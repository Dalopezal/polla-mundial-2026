import { clearAuthCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  clearAuthCookie(res);
  return res.status(200).json({ ok: true });
}
