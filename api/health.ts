import type { VercelRequest, VercelResponse } from '@vercel/node';
import { maskApiKey, parseKeysFromText } from '../src/utils/converterValidation.js';

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

export default function handler(req: VercelRequest, res: VercelResponse) {
  const serverKeys = getServerKeyPool();
  res.status(200).json({
    status: 'ok',
    serverKeysAvailable: serverKeys.length > 0,
    serverKeysCount: serverKeys.length,
    maskedServerKeys: serverKeys.map(maskApiKey),
  });
}
