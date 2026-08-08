import { GoogleGenAI } from '@google/genai';
import { maskApiKey, parseKeysFromText } from '../utils/converterValidation.js';
import { KeyStatus } from '../types.js';

// Satu-satunya tempat nama model didefinisikan.
// Bisa di-override lewat env var tanpa perlu redeploy kode.
export const GEMINI_MODEL = process.env.GEMINI_MODEL_NAME || 'gemini-3.6-flash';

export function getServerKeyPool(): string[] {
  const multiKeys = process.env.GEMINI_API_KEYS;
  if (multiKeys && multiKeys.trim().length > 0) {
    return parseKeysFromText(multiKeys);
  }
  const singleKey = process.env.GEMINI_API_KEY;
  if (singleKey && singleKey.trim().length > 0) {
    return [singleKey.trim()];
  }
  return [];
}

export function buildSystemPrompt(rawHtml: string): string {
  return `Kamu adalah engine konversi format HTML. Tugasmu HANYA mengubah "kemasan" (packaging) dari HTML hasil Gemini Canvas menjadi HTML yang siap ditempel ke Elementor HTML Widget di WordPress — TANPA mengubah konten, desain, atau perilaku apapun.

ATURAN MUTLAK (tidak boleh dilanggar):
1. DILARANG mengubah teks, konten, struktur visual, warna, layout, atau perilaku (behavior) apapun dari HTML asli. Output harus terlihat 100% identik saat dirender.
2. JANGAN hapus struktur dokumen. Pertahankan <!DOCTYPE html>, <html>, <head>, dan <body> persis seperti dokumen HTML utuh — JANGAN dipotong jadi fragment.
3. Hapus HANYA dua hal: (a) <script src="https://cdn.tailwindcss.com"></script>, dan (b) blok <script>tailwind.config = {...}</script>. Keduanya harus lenyap total dari output.
4. Tentukan SATU prefix pendek (2-4 huruf) dari nama brand/bisnis yang ada di <title> atau konten halaman (contoh: "Warung Nyaman 2" -> "wn2", "Family Aqiqah" -> "fa", "Parama Satya Pertiwi" -> "psp"). Prefix ini WAJIB dipakai konsisten untuk:
   a. Semua class CSS baru yang kamu buat.
   b. SEMUA id yang direferensikan oleh JavaScript (getElementById, querySelector), TANPA TERKECUALI — termasuk id pada elemen form sekalipun.
   c. Satu div pembungkus tunggal langsung di dalam <body> yang membungkus SELURUH konten halaman, dengan class "{prefix}-container-root".
5. Konversi setiap class utility Tailwind ke CSS asli di dalam satu blok <style> di <head>, dengan strategi HYBRID:
   a. Jika kombinasi class yang sama dipakai berulang pada beberapa elemen sejenis (nav link, card, button, dll) -> gabungkan jadi SATU class semantik baru dengan nama deskriptif berprefix (contoh: .wn2-nav-link), bukan class terpisah per-utility.
   b. Jika sebuah kombinasi class hanya dipakai SEKALI di seluruh dokumen (styling unik untuk 1 elemen spesifik) -> tulis langsung sebagai inline style="..." pada elemen tersebut, JANGAN buat class CSS baru untuk ini.
6. Variant Tailwind wajib dikonversi presisi, bukan didekati:
   a. Prefix responsive (sm:, md:, lg:, xl:) -> @media (max-width: ...) asli dengan breakpoint Tailwind standar (640/768/1024/1280px), desktop-first, dikumpulkan dalam satu blok menjelang akhir <style>.
   b. hover: -> :hover asli. focus: -> :focus asli. selection: -> ::selection asli.
   c. Pola "group" + "group-hover:" -> WAJIB dikonversi jadi compound selector ".{prefix}-group:hover .{prefix}-group-hover-nama-efek { ... }", karena ini titik paling sering gagal dikonversi asal-asalan.
7. Warna dari tailwind.config.theme.extend.colors (dan warna lain yang dipakai berulang) -> dipindah jadi CSS custom property di :root, prefix sama, misal "--{prefix}-navy: #0B192C;", lalu dipakai lewat var(--{prefix}-navy) di semua rule CSS.
8. Class atau id BAWAAN ASLI yang bukan Tailwind (misal "custom-scrollbar", "mobile-nav-link") -> JANGAN dihapus/digabung, tetap pertahankan sebagai class terpisah (beri prefix), karena kemungkinan direferensikan selector CSS lain seperti ::-webkit-scrollbar.
9. SEMUA <script> JavaScript WAJIB dibuat aman terhadap kemungkinan elemen belum ter-render (karena Elementor bisa memuat widget secara dinamis). Terapkan SALAH SATU dari ini secara KONSISTEN ke seluruh script, bukan sebagian:
   a. Bungkus seluruh logika dalam document.addEventListener('DOMContentLoaded', () => { ... }); ATAU
   b. Tambahkan pengecekan if (element) { ... } sebelum setiap pemanggilan method pada hasil getElementById/querySelector.
   Perilaku/fungsi JS itu sendiri TIDAK BOLEH berubah, hanya ditambah proteksi.
10. Dependency eksternal (Google Fonts, Font Awesome, script tracking GA/GTM, meta tag SEO/verification) -> pertahankan 100% verbatim, tidak disentuh sama sekali.
11. OUTPUT HARUS BERUPA HANYA KODE HTML MURNI, dimulai dari <!DOCTYPE html> sampai </html>. Tidak ada penjelasan, tidak ada markdown code fence, tidak ada komentar tambahan di luar yang memang ada di source asli.

HTML SUMBER (dari Gemini Canvas):
<<<
${rawHtml}
>>>`;
}

export interface ConversionOutcome {
  conversionResult: { html: string; keyIndexUsed: number } | null;
  keyStatuses: KeyStatus[];
}

export async function runConversion(
  rawHtml: string,
  activeKeys: string[],
  usedSource: 'user' | 'server'
): Promise<ConversionOutcome> {
  const keyStatuses: KeyStatus[] = activeKeys.map((key, idx) => ({
    index: idx,
    maskedKey: maskApiKey(key),
    source: usedSource,
    status: 'idle',
    lastError: undefined,
  }));

  const systemPrompt = buildSystemPrompt(rawHtml);
  let conversionResult: { html: string; keyIndexUsed: number } | null = null;

  for (let attempt = 0; attempt < activeKeys.length; attempt++) {
    const currentKey = activeKeys[attempt];
    const keyMasked = keyStatuses[attempt].maskedKey;
    const keyStartTime = Date.now();
    keyStatuses[attempt].status = 'in_use';

    console.log(`[C2E_KEY_TRY] Key #${attempt + 1}/${activeKeys.length} (${keyMasked}) - Calling Gemini API (${GEMINI_MODEL})...`);

    try {
      const ai = new GoogleGenAI({
        apiKey: currentKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: systemPrompt,
      });

      let outputText = response.text || '';
      outputText = outputText
        .replace(/^```html\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      if (!outputText || outputText.length < 50) {
        throw new Error('Hasil respon model terlalu pendek atau kosong.');
      }

      const hasDoctype = /<!DOCTYPE\s+html/i.test(outputText);
      const hasHtmlTag = /<html[\s>]/i.test(outputText) && /<\/html>/i.test(outputText);
      if (!hasDoctype || !hasHtmlTag) {
        throw new Error('Hasil respon model tidak memiliki struktur HTML dokumen yang valid (DOCTYPE atau tag <html> hilang).');
      }

      const callDuration = Date.now() - keyStartTime;
      keyStatuses[attempt].status = 'success';
      conversionResult = {
        html: outputText,
        keyIndexUsed: attempt,
      };

      console.log(`[C2E_KEY_SUCCESS] Key #${attempt + 1}/${activeKeys.length} (${keyMasked}) SUCCESS in ${callDuration}ms! Generated ${outputText.length} chars HTML.`);
      break;
    } catch (err: any) {
      const callDuration = Date.now() - keyStartTime;
      const errorMessage = err?.message || String(err);
      const errLower = errorMessage.toLowerCase();

      if (
        errLower.includes('429') ||
        errLower.includes('quota') ||
        errLower.includes('rate_limit') ||
        errLower.includes('resource_exhausted')
      ) {
        keyStatuses[attempt].status = 'rate_limited';
        keyStatuses[attempt].lastError = 'Quota / Rate limit exceeded (429)';
        console.warn(`[C2E_KEY_RATE_LIMITED] Key #${attempt + 1}/${activeKeys.length} (${keyMasked}) hit rate limit (429) after ${callDuration}ms. Rotating to next key...`);
      } else if (
        errLower.includes('401') ||
        errLower.includes('403') ||
        errLower.includes('invalid_api_key') ||
        errLower.includes('api key not valid')
      ) {
        keyStatuses[attempt].status = 'invalid';
        keyStatuses[attempt].lastError = 'API key tidak valid (401/403)';
        console.warn(`[C2E_KEY_INVALID] Key #${attempt + 1}/${activeKeys.length} (${keyMasked}) rejected as invalid (401/403) after ${callDuration}ms. Rotating to next key...`);
      } else {
        keyStatuses[attempt].status = 'error';
        keyStatuses[attempt].lastError = errorMessage;
        console.error(`[C2E_KEY_ERROR] Key #${attempt + 1}/${activeKeys.length} (${keyMasked}) encountered error after ${callDuration}ms:`, errorMessage);
      }
    }
  }

  return { conversionResult, keyStatuses };
}
