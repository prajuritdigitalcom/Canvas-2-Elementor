import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { validateConvertedHtml, maskApiKey, parseKeysFromText } from './src/utils/converterValidation.js';
import { getServerKeyPool, runConversion } from './src/lib/convertEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

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

      // Run conversion engine (§7.4 & system prompt)
      const { conversionResult, keyStatuses } = await runConversion(rawHtml, activeKeys, usedSource);

      const durationMs = Date.now() - startTime;

      if (!conversionResult) {
        console.error(`[C2E_ALL_KEYS_FAILED] All ${activeKeys.length} keys exhausted without success in ${durationMs}ms.`);
        return res.status(429).json({
          success: false,
          error: 'Semua API key yang tersedia gagal — bisa karena rate-limit, key tidak valid, atau model menghasilkan HTML yang tidak valid. Silakan coba lagi atau tambahkan API key baru di UI.',
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
