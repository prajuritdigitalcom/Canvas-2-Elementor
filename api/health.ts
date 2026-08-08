import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleHealthRequest } from '../src/lib/convertEngine.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const healthData = handleHealthRequest();
  res.status(200).json(healthData);
}
