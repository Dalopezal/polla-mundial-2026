import { getUserFromRequest } from '../../../lib/auth';
import { db } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
  const tokenUser = getUserFromRequest(req);
  if (!tokenUser) return res.status(401).json({ error: 'No autenticado' });
  const user = db.users.findById(tokenUser.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  return res.status(200).json({
    user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin }
  });
}
