import type { VercelRequest, VercelResponse } from '@vercel/node';
import { maskApiKey } from '../src/utils/converterValidation.js';
import { getServerKeyPool } from '../src/lib/convertEngine.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const serverKeys = getServerKeyPool();
  res.status(200).json({
    status: 'ok',
    serverKeysAvailable: serverKeys.length > 0,
    serverKeysCount: serverKeys.length,
    maskedServerKeys: serverKeys.map(maskApiKey),
  });
}
