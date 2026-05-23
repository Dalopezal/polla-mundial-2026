import { db } from '../../../lib/db';
import { calculateLeaderboard } from '../../../lib/scoring';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const users = db.users.getAll();
  const matches = db.matches.getAll();
  const predictions = db.predictions.getAll();

  const leaderboard = calculateLeaderboard(users, matches, predictions);
  return res.status(200).json({ leaderboard });
}
