import bcrypt from 'bcryptjs';
import { db } from '../../../lib/db';
import { signToken, setAuthCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

  const user = db.users.findByEmail(email);
  if (!user) return res.status(401).json({ error: 'Credenciales incorrectas' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });

  const token = signToken({ id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin });
  setAuthCookie(res, token);

  return res.status(200).json({
    user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin }
  });
}
