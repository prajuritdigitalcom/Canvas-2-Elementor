import { GoogleGenAI } from '@google/genai';
import { maskApiKey, parseKeysFromText, validateConvertedHtml } from '../utils/converterValidation.js';
import { KeyStatus, ValidationResult } from '../types.js';

// Satu-satunya tempat nama model didefinisikan.
// Bisa di-override lewat env var tanpa perlu redeploy kode.
export const GEMINI_MODEL = process.env.GEMINI_MODEL_NAME || 'gemini-3.6-flash';

// Satu-satunya "jaring pengaman" waktu: bungkus SELURUH proses (semua percobaan
// key digabung) dengan satu timeout global, sengaja disetel sedikit di bawah
// maxDuration Vercel (lihat vercel.json -> functions.api/convert.ts). Ini BUKAN
// timeout per-key (itu sengaja dihapus) - tujuannya cuma mencegah Vercel sendiri
// yang memaksa mati dengan 504 kosong kalau suatu saat benar-benar ada panggilan
// yang macet total tanpa respons/tanpa error sama sekali (skenario sangat jarang).
// Kegagalan karena LAMBAT (tapi tetap berjalan menuju sukses) TIDAK memicu rotasi
// ke key lain lagi - key baru akan mengalami kelambatan yang sama persis, jadi
// merotasi hanya memecah waktu yang ada tanpa manfaat.
const OVERALL_SAFETY_TIMEOUT_MS = Number(process.env.GEMINI_OVERALL_SAFETY_TIMEOUT_MS) || 285000;

const RATE_LIMIT_COOLDOWN_MS = Number(process.env.GEMINI_KEY_COOLDOWN_MS) || 60000;

const keyCooldownUntil = new Map<string, number>();

function isKeyInCooldown(key: string): boolean {
  const until = keyCooldownUntil.get(key);
  return typeof until === 'number' && Date.now() < until;
}

function markKeyCooldown(key: string, ms: number = RATE_LIMIT_COOLDOWN_MS): void {
  keyCooldownUntil.set(key, Date.now() + ms);
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`TIMEOUT: ${label} tidak merespons dalam ${ms}ms`)), ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

export interface ConvertRequestParams {
  rawHtml?: string;
  userKeys?: string[];
}

export interface ConvertResultResponse {
  success: boolean;
  html?: string;
  keyIndexUsed?: number;
  durationMs?: number;
  keyStatuses?: KeyStatus[];
  validation?: ValidationResult;
  usedSource?: 'user' | 'server';
  error?: string;
  statusCode: number;
}

export interface HealthResponseData {
  status: string;
  serverKeysAvailable: boolean;
  serverKeysCount?: number;
  allowServerKeyFallback: boolean;
  model: string;
}

export function isServerKeyFallbackAllowed(): boolean {
  if (process.env.ALLOW_SERVER_KEY_FALLBACK !== undefined) {
    return process.env.ALLOW_SERVER_KEY_FALLBACK === 'true';
  }
  return false;
}

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

export function handleHealthRequest(isDev = process.env.NODE_ENV !== 'production'): HealthResponseData {
  const serverKeys = getServerKeyPool();
  const fallbackAllowed = isServerKeyFallbackAllowed();

  const response: HealthResponseData = {
    status: 'ok',
    serverKeysAvailable: serverKeys.length > 0 && fallbackAllowed,
    allowServerKeyFallback: fallbackAllowed,
    model: GEMINI_MODEL,
  };

  if (isDev) {
    response.serverKeysCount = serverKeys.length;
  }

  return response;
}

export async function handleConvertRequest(params: ConvertRequestParams): Promise<ConvertResultResponse> {
  const startTime = Date.now();
  const rawHtml = typeof params.rawHtml === 'string' ? params.rawHtml.trim() : '';
  const userKeysInput = Array.isArray(params.userKeys) ? params.userKeys : [];

  if (!rawHtml) {
    return {
      success: false,
      error: 'Data HTML mentah (rawHtml) tidak boleh kosong.',
      statusCode: 400,
    };
  }

  const validUserKeys = userKeysInput
    .map((k) => (typeof k === 'string' ? k.trim() : ''))
    .filter((k) => k.length > 0 && !k.startsWith('#'));

  let activeKeys: string[] = [];
  let usedSource: 'user' | 'server' = 'user';

  if (validUserKeys.length > 0) {
    activeKeys = validUserKeys;
    usedSource = 'user';
  } else {
    const fallbackAllowed = isServerKeyFallbackAllowed();
    if (!fallbackAllowed) {
      return {
        success: false,
        error: 'Penggunaan server key pool dinonaktifkan. Silakan berikan API key Gemini Anda di UI.',
        statusCode: 403,
      };
    }

    const serverKeys = getServerKeyPool();
    if (serverKeys.length === 0) {
      return {
        success: false,
        error: 'Server key pool kosong dan tidak ada API key Gemini yang diberikan di UI.',
        statusCode: 400,
      };
    }
    activeKeys = serverKeys;
    usedSource = 'server';
  }

  const { conversionResult, keyStatuses } = await runConversion(rawHtml, activeKeys, usedSource);
  const durationMs = Date.now() - startTime;

  if (!conversionResult) {
    return {
      success: false,
      error: 'Semua API key yang tersedia gagal — bisa karena rate-limit, key tidak valid, atau model menghasilkan HTML yang tidak valid. Silakan coba lagi atau tambahkan API key baru di UI.',
      durationMs,
      keyStatuses,
      usedSource,
      statusCode: 429,
    };
  }

  const validation = validateConvertedHtml(conversionResult.html, rawHtml);

  return {
    success: true,
    html: conversionResult.html,
    keyIndexUsed: conversionResult.keyIndexUsed,
    durationMs,
    keyStatuses,
    validation,
    usedSource,
    statusCode: 200,
  };
}

export function buildSystemPrompt(rawHtml: string): string {
  return `Kamu adalah engine konversi format HTML. Tugasmu HANYA mengubah "kemasan" (packaging) dari HTML hasil Gemini Canvas menjadi HTML yang siap ditempel ke Elementor HTML Widget di WordPress — TANPA mengubah konten, desain, atau perilaku apapun.

ATURAN MUTLAK (tidak boleh dilanggar):
1. DILARANG mengubah teks, konten, struktur visual, warna, layout, atau perilaku (behavior) apapun dari HTML asli. Output harus terlihat 100% identik saat dirender.
2. JANGAN hapus struktur dokumen. Pertahankan <!DOCTYPE html>, <html>, <head>, dan <body> persis seperti dokumen HTML utuh — JANGAN dipotong jadi fragment.
3. Hapus HANYA dua hal: (a) <script src="https://cdn.tailwindcss.com"></script>, dan (b) blok <script>tailwind.config = {...}</script>. Keduanya harus lenyap total dari output.
3a. Karena script Tailwind CDN dihapus (lihat aturan #3), Preflight (base CSS reset) yang biasanya otomatis di-inject oleh Tailwind IKUT HILANG dan WAJIB digantikan manual. Tambahkan blok berikut sebagai baris PALING ATAS di dalam <style>, sebelum aturan :root atau apapun lainnya:

        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }

    Ini wajib ada di SETIAP hasil konversi tanpa terkecuali, bahkan kalau source tidak terlihat menulis reset ini secara eksplisit di HTML-nya — reset itu datang dari Preflight yang implisit, bukan dari kode yang terlihat.
4. Tentukan SATU prefix pendek (2-4 huruf) dari nama brand/bisnis yang ada di <title> atau konten halaman (contoh: "Warung Nyaman 2" -> "wn2", "Family Aqiqah" -> "fa", "Parama Satya Pertiwi" -> "psp"). Prefix ini WAJIB dipakai konsisten untuk:
   a. Semua class CSS baru yang kamu buat.
   b. SEMUA id yang direferensikan oleh JavaScript (getElementById, querySelector), TANPA TERKECUALI — termasuk id pada elemen form sekalipun.
   c. Satu div pembungkus tunggal langsung di dalam <body> yang membungkus SELURUH konten halaman, dengan class "{prefix}-container-root".
5. Konversi setiap class utility Tailwind ke CSS asli di dalam satu blok <style> di <head>, dengan strategi HYBRID:
   a. Jika kombinasi class yang sama dipakai berulang pada beberapa elemen sejenis (nav link, card, button, dll) -> gabungkan jadi SATU class semantik baru dengan nama deskriptif berprefix (contoh: .wn2-nav-link), bukan class terpisah per-utility.
   b. Jika sebuah kombinasi class hanya dipakai SEKALI di seluruh dokumen (styling unik untuk 1 elemen spesifik) -> tulis langsung sebagai inline style="..." pada elemen tersebut, JANGAN buat class CSS baru untuk ini.
      ATURAN SANGAT PENTING: Properti layout yang nilainya berbeda antar breakpoint (display, grid-template-columns, grid-template-rows, flex-direction, text-align, justify-content, align-items, dan properti struktural sejenis yang berasal dari class Tailwind ber-prefix sm:/md:/lg:/xl:) WAJIB ditulis lewat CLASS (base rule di luar media query + override di dalam @media), TIDAK BOLEH sebagai inline style — walau kombinasi class aslinya cuma dipakai SEKALI di seluruh dokumen.
      Alasan: inline style="..." punya spesifisitas CSS yang SELALU menang di atas class manapun, termasuk yang berada di dalam @media yang kondisinya terpenuhi. Kalau properti layout responsif ditulis inline, override di breakpoint manapun TIDAK AKAN PERNAH berlaku, dan elemen itu permanen terjebak di satu nilai saja di semua ukuran layar — persis seperti kasus ".kn-hero-grid" yang macet di "display: flex" walau ada rule "display: grid" di @media (min-width: 1024px) untuknya.
      Properti LAIN pada elemen yang sama yang TIDAK berubah antar breakpoint (warna, padding tetap, border-radius, box-shadow, dll) tetap boleh ditulis inline seperti biasa — aturan ini HANYA berlaku untuk properti yang punya prefix responsif di source.
      Cara verifikasi sebelum output dianggap selesai: untuk SETIAP elemen yang punya inline style DAN class sekaligus, pastikan tidak ada satupun properti di dalam style="..." itu yang juga muncul sebagai deklarasi untuk class yang sama di dalam @media block manapun. Kalau ada tumpang tindih, pindahkan properti itu dari inline ke class (base value di luar media query, nilai breakpoint lain di dalam @media) — jangan biarkan kedua representasi itu hidup berdampingan pada elemen yang sama.
6. Variant Tailwind wajib dikonversi presisi, bukan didekati:
   a. Prefix responsive (sm:, md:, lg:, xl:) WAJIB dikonversi dengan aturan berikut, TANPA kecuali dan TANPA didekati/dirata-ratakan:
      - Base value (class tanpa prefix, mis. "py-20" dalam "py-20 md:py-32") adalah nilai DEFAULT di luar media query — ini berlaku untuk SEMUA ukuran layar sampai ada breakpoint yang meng-override.
      - Setiap prefix (sm:/md:/lg:/xl:) WAJIB menjadi satu deklarasi terpisah di dalam @media (min-width: ...) { } dengan breakpoint Tailwind standar MOBILE-FIRST (sm=640px, md=768px, lg=1024px, xl=1280px), BUKAN max-width/desktop-first. Alasan: Tailwind sendiri mobile-first, base value = mobile, prefix = override ke atas. Jangan pernah membalik arah ini atau memakai nilai breakpoint sebagai default lalu override ke bawah.
      - DILARANG KERAS menghasilkan satu nilai flat (tanpa media query) untuk class yang di source aslinya punya lebih dari satu breakpoint. Kalau ada N breakpoint pada satu properti, output HARUS punya N deklarasi CSS (1 base + (N-1) di dalam media query), tidak boleh kurang.
      - DILARANG mengarang/membulatkan nilai antara (contoh: py-20 md:py-28 tidak boleh jadi 6rem flat — itu bukan nilai 20 (5rem) maupun 28 (7rem) manapun).
      - Sebelum menulis <style>, buat DAFTAR INTERNAL (untuk diri sendiri, tidak usah ditampilkan ke output) semua kombinasi class dengan prefix responsif yang ada di source, beserta nilai px/rem persis per breakpoint (rujuk skala spacing Tailwind resmi: 1=0.25rem, 2=0.5rem, ... 20=5rem, 28=7rem, 32=8rem, dst — jangan menebak). Pastikan SETIAP baris di daftar itu punya representasi CSS yang match persis di output akhir sebelum dianggap selesai.
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

  // Loop percobaan key, sekarang TANPA timeout per-key - setiap key dibiarkan
  // selesai secara natural (persis seperti sebelum ada mekanisme timeout sama
  // sekali), karena proses konversi ini memang butuh waktu lama secara wajar.
  // Rotasi ke key berikutnya HANYA terjadi untuk error cepat & pasti (429/401/403),
  // bukan karena lambat.
  const attemptAllKeys = async (): Promise<void> => {
    for (let attempt = 0; attempt < activeKeys.length; attempt++) {
      const currentKey = activeKeys[attempt];
      const keyMasked = keyStatuses[attempt].maskedKey;

      if (isKeyInCooldown(currentKey)) {
        keyStatuses[attempt].status = 'rate_limited';
        keyStatuses[attempt].lastError = 'Masih dalam masa cooldown dari rate-limit sebelumnya';
        console.warn(`[C2E_KEY_COOLDOWN] Key #${attempt + 1}/${activeKeys.length} (${keyMasked}) skipped due to active cooldown.`);
        continue;
      }

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

        // Tidak ada withTimeout di sini lagi - dibiarkan menunggu secara alami,
        // dijaga hanya oleh OVERALL_SAFETY_TIMEOUT_MS di level pemanggil di bawah.
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
        return;
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
          markKeyCooldown(currentKey);
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
  };

  try {
    await withTimeout(attemptAllKeys(), OVERALL_SAFETY_TIMEOUT_MS, 'Seluruh proses konversi');
  } catch (safetyErr: any) {
    // Safety-net global kena (sangat jarang) - tandai key yang sedang jalan sebagai
    // timeout, dan key yang belum sempat dicoba sebagai skipped, supaya UI tetap
    // menunjukkan status yang jujur alih-alih diam saja.
    console.error(`[C2E_OVERALL_TIMEOUT] Proses konversi melewati batas aman ${OVERALL_SAFETY_TIMEOUT_MS}ms:`, safetyErr?.message || safetyErr);
    for (const ks of keyStatuses) {
      if (ks.status === 'in_use') {
        ks.status = 'timeout';
        ks.lastError = `Melewati batas waktu aman keseluruhan (${OVERALL_SAFETY_TIMEOUT_MS}ms)`;
      } else if (ks.status === 'idle') {
        ks.status = 'skipped';
        ks.lastError = 'Waktu aman keseluruhan sudah habis sebelum key ini sempat dicoba';
      }
    }
  }

  return { conversionResult, keyStatuses };
}
