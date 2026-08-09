import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  handleHealthRequest,
  handleConvertRequest,
  GEMINI_MODEL,
  isServerKeyFallbackAllowed,
  getServerKeyPool,
} from './src/lib/convertEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check & Server Keys status route
  app.get('/api/health', (req: Request, res: Response) => {
    const health = handleHealthRequest();
    res.json(health);
  });

  // Verify Password Endpoint
  app.post('/api/verify-password', (req: Request, res: Response) => {
    try {
      const expectedPassword = process.env.PASSWORD || 'csku2@prajuritdigital.com';
      const { password } = req.body || {};

      if (typeof password !== 'string') {
        return res.status(400).json({ success: false, error: 'Format input password tidak valid.' });
      }

      if (password.trim() === expectedPassword.trim()) {
        return res.status(200).json({
          success: true,
          message: 'Password benar. Akses diterima.',
          token: 'authenticated',
        });
      } else {
        return res.status(401).json({
          success: false,
          error: 'Password yang Anda masukkan salah.',
        });
      }
    } catch (err: any) {
      console.error(`[C2E_VERIFY_PASSWORD_ERROR] Exception:`, err);
      return res.status(500).json({
        success: false,
        error: `Server Internal Error: ${err?.message || String(err)}`,
      });
    }
  });

  // Conversion API Endpoint
  app.post('/api/convert', async (req: Request, res: Response) => {
    console.log(`[C2E_CONVERT_START] Request received at ${new Date().toISOString()}`);

    try {
      const { rawHtml, userKeys } = req.body || {};
      const result = await handleConvertRequest({ rawHtml, userKeys });
      return res.status(result.statusCode).json(result);
    } catch (unhandledErr: any) {
      console.error(`[C2E_CRACK_SERVER_EXPRESS_ERROR] Server crash/unhandled exception:`, unhandledErr);
      return res.status(500).json({
        success: false,
        error: `Server Internal Error: ${unhandledErr?.message || String(unhandledErr)}`,
        statusCode: 500,
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
    console.log(`[Canvas2Elementor] Active Gemini Model: "${GEMINI_MODEL}"`);
    console.log(`[Canvas2Elementor] Server Key Fallback Allowed: ${isServerKeyFallbackAllowed()} (Pool size: ${getServerKeyPool().length})`);
  });
}

startServer();
