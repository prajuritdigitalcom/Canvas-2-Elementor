import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ success: false, error: 'Method not allowed. Gunakan POST.' });
    return;
  }

  try {
    const expectedPassword = process.env.PASSWORD || 'csku2@prajuritdigital.com';
    const { password } = req.body ?? {};

    if (typeof password !== 'string') {
      res.status(400).json({ success: false, error: 'Format input password tidak valid.' });
      return;
    }

    // Secure comparison (trimmed)
    if (password.trim() === expectedPassword.trim()) {
      res.status(200).json({
        success: true,
        message: 'Password benar. Akses diterima.',
        token: 'authenticated',
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Password yang Anda masukkan salah.',
      });
    }
  } catch (err: any) {
    console.error(`[C2E_VERIFY_PASSWORD_ERROR] Exception:`, err);
    res.status(500).json({
      success: false,
      error: `Server Internal Error: ${err?.message || String(err)}`,
    });
  }
}
