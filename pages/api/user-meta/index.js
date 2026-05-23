import { requireAuth } from '../../../lib/auth';
import { db } from '../../../lib/db';
import { getUserLevel, calculateFootballIQ, calculateStreak, classifyPersonality, checkAchievements } from '../../../lib/userLevels';
import fs from 'fs';
import path from 'path';

function getTeams() {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(),'data','teams.json'),'utf8')); }
  catch { return {}; }
}

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const userId      = req.user.id;
  const matches     = db.matches.getAll();
  const predictions = db.predictions.findByUser(userId);
  const teamsData   = getTeams();
  const meta        = db.userMeta.findById(userId) || {};

  // Calculate everything
  const { calculatePoints } = await import('../../../lib/scoring');
  let pts = 0;
  predictions.forEach(p => {
    const m = matches.find(x => x.id === p.matchId);
    if (m && m.homeScore !== null && p.homeScore !== null) pts += calculatePoints(p, m);
  });

  const level       = getUserLevel(pts);
  const streak      = calculateStreak(predictions, matches);
  const iq          = calculateFootballIQ(predictions, matches, teamsData);
  const personality = classifyPersonality(predictions, matches, teamsData);
  const { allAchievements } = checkAchievements(predictions, matches, teamsData, meta.achievements || []);

  // Persist achievements if new ones unlocked
  if (allAchievements.length > (meta.achievements||[]).length) {
    db.userMeta.upsert(userId, { achievements: allAchievements });
  }

  return res.status(200).json({ level, streak, iq, personality, achievements: allAchievements, pts });
}

export default requireAuth(handler);
