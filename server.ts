import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { validateConvertedHtml, maskApiKey, parseKeysFromText } from './src/utils/converterValidation.js';
import { KeyStatus } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Helper to resolve server API key pool
  function getServerKeyPool(): string[] {
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

  // Health check & Server Keys status route
  app.get('/api/health', (req: Request, res: Response) => {
    const serverKeys = getServerKeyPool();
    res.json({
      status: 'ok',
      serverKeysAvailable: serverKeys.length > 0,
      serverKeysCount: serverKeys.length,
      maskedServerKeys: serverKeys.map(maskApiKey),
    });
  });

  // Conversion API Endpoint
  app.post('/api/convert', async (req: Request, res: Response) => {
    const startTime = Date.now();
    console.log(`[C2E_CONVERT_START] Request received at ${new Date().toISOString()}`);

    try {
      const { rawHtml, userKeys } = req.body;

      if (!rawHtml || typeof rawHtml !== 'string' || rawHtml.trim().length === 0) {
        console.warn(`[C2E_VALIDATION_ERROR] Empty rawHtml received.`);
        return res.status(400).json({
          success: false,
          error: 'HTML input tidak boleh kosong. Silakan masukkan HTML dari Gemini Canvas.',
        });
      }

      // Determine Key Pool & Priority (§7.3)
      let parsedUserKeys: string[] = [];
      if (Array.isArray(userKeys)) {
        parsedUserKeys = userKeys.filter((k) => typeof k === 'string' && k.trim().length > 0);
      } else if (typeof userKeys === 'string') {
        parsedUserKeys = parseKeysFromText(userKeys);
      }

      let activeKeys: string[] = [];
      let usedSource: 'user' | 'server' = 'server';

      if (parsedUserKeys.length > 0) {
        activeKeys = parsedUserKeys;
        usedSource = 'user';
      } else {
        activeKeys = getServerKeyPool();
        usedSource = 'server';
      }

      console.log(`[C2E_POOL_INFO] Source: ${usedSource}, Total Keys in Pool: ${activeKeys.length}, Raw HTML Size: ${rawHtml.length} chars`);

      if (activeKeys.length === 0) {
        console.error(`[C2E_NO_KEYS_ERROR] Key pool is empty! User supplied 0, Server supplied 0.`);
        return res.status(400).json({
          success: false,
          error: 'Tidak ada API key Gemini yang tersedia. Silakan isi minimal 1 API key di panel UI atau atur GEMINI_API_KEYS di lingkungan server.',
        });
      }

      // Setup key pool status tracking (§7.2)
      const keyStatuses: KeyStatus[] = activeKeys.map((key, idx) => ({
        index: idx,
        maskedKey: maskApiKey(key),
        source: usedSource,
        status: 'idle',
        lastError: undefined,
      }));

      // System Prompt (§8.1 PRD v1.1)
      const systemPrompt = `Kamu adalah engine konversi format HTML. Tugasmu HANYA mengubah "kemasan" (packaging) dari HTML hasil Gemini Canvas menjadi HTML yang siap ditempel ke Elementor HTML Widget di WordPress — TANPA mengubah konten, desain, atau perilaku apapun.

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

      // Multi-key rotation loop (§7.4)
      let conversionResult: { html: string; keyIndexUsed: number } | null = null;

      for (let attempt = 0; attempt < activeKeys.length; attempt++) {
        const currentKey = activeKeys[attempt];
        const keyMasked = keyStatuses[attempt].maskedKey;
        const keyStartTime = Date.now();
        keyStatuses[attempt].status = 'in_use';

        console.log(`[C2E_KEY_TRY] Key #${attempt + 1}/${activeKeys.length} (${keyMasked}) - Calling Gemini API (gemini-3.6-flash)...`);

        try {
          const ai = new GoogleGenAI({
            apiKey: currentKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              },
            },
          });

          // Use gemini-3.6-flash for general text & code conversion tasks
          const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: systemPrompt,
          });

          let outputText = response.text || '';

          // Clean up markdown code blocks if the model enclosed output in ```html ... ```
          outputText = outputText.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

          if (!outputText || outputText.length < 50) {
            throw new Error('Hasil respon model terlalu pendek atau kosong.');
          }

          const callDuration = Date.now() - keyStartTime;
          keyStatuses[attempt].status = 'success';
          conversionResult = {
            html: outputText,
            keyIndexUsed: attempt,
          };

          console.log(`[C2E_KEY_SUCCESS] Key #${attempt + 1}/${activeKeys.length} (${keyMasked}) SUCCESS in ${callDuration}ms! Generated ${outputText.length} chars HTML.`);
          break; // Success! Break out of rotation loop
        } catch (err: any) {
          const callDuration = Date.now() - keyStartTime;
          const errorMessage = err?.message || String(err);
          const errLower = errorMessage.toLowerCase();

          // Check if rate limit / quota / auth error (§7.4)
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

      const durationMs = Date.now() - startTime;

      if (!conversionResult) {
        console.error(`[C2E_ALL_KEYS_FAILED] All ${activeKeys.length} keys exhausted without success in ${durationMs}ms.`);
        return res.status(429).json({
          success: false,
          error: 'Semua API key yang tersedia sedang rate-limited atau tidak valid. Silakan coba beberapa saat lagi atau tambahkan API key baru di UI.',
          durationMs,
          keyStatuses,
          usedSource,
        });
      }

      // Run post-conversion automated validation (§8.3)
      const validation = validateConvertedHtml(conversionResult.html);
      console.log(`[C2E_VALIDATION_DONE] Conversion finished in ${durationMs}ms. Detected Prefix: "${validation.detectedPrefix}", Validation issues count: ${validation.issues.length}`);

      return res.json({
        success: true,
        html: conversionResult.html,
        keyIndexUsed: conversionResult.keyIndexUsed,
        durationMs,
        keyStatuses,
        validation,
        usedSource,
      });
    } catch (unhandledErr: any) {
      const durationMs = Date.now() - startTime;
      console.error(`[C2E_CRACK_SERVER_EXPRESS_ERROR] Server crash/unhandled exception after ${durationMs}ms:`, unhandledErr);
      return res.status(500).json({
        success: false,
        error: `Server Internal Error: ${unhandledErr?.message || String(unhandledErr)}`,
        durationMs,
      });
    }
  });

  // Serve static / Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Canvas2Elementor] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
