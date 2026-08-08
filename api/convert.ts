import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleConvertRequest } from '../src/lib/convertEngine.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ success: false, error: 'Method not allowed. Gunakan POST.' });
    return;
  }

  try {
    const { rawHtml, userKeys } = req.body ?? {};
    const result = await handleConvertRequest({ rawHtml, userKeys });
    res.status(result.statusCode).json(result);
  } catch (unhandledErr: any) {
    console.error(`[C2E_VERCEL_CONVERT_ERROR] Exception:`, unhandledErr);
    res.status(500).json({
      success: false,
      error: `Server Internal Error: ${unhandledErr?.message || String(unhandledErr)}`,
    });
  }
}
