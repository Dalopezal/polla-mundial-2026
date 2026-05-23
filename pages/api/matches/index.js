import { db } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
  const matches = db.matches.getAll();
  return res.status(200).json({ matches });
}
