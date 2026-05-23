import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../../lib/db';
import { signToken, setAuthCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  const existing = db.users.findByEmail(email);
  if (existing) return res.status(400).json({ error: 'Este email ya está registrado' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const users = db.users.getAll();
  const isAdmin = users.length === 0 || email === process.env.ADMIN_EMAIL;

  const user = db.users.create({
    id: uuidv4(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    isAdmin,
    createdAt: new Date().toISOString()
  });

  const token = signToken({ id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin });
  setAuthCookie(res, token);

  return res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin }
  });
}
