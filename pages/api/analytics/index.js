import { db } from '../../../lib/db';
import { calculatePoints } from '../../../lib/scoring';
import { calculateLeaderboard } from '../../../lib/scoring';
import { getUserLevel, calculateFootballIQ, calculateStreak, classifyPersonality } from '../../../lib/userLevels';
import fs from 'fs';
import path from 'path';

function getTeams() {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(),'data','teams.json'),'utf8')); } catch { return {}; }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const users       = db.users.getAll();
  const matches     = db.matches.getAll();
  const predictions = db.predictions.getAll();
  const comments    = db.comments.getAll();
  const teamsData   = getTeams();
  const userMeta    = db.userMeta.getAll();

  // Leaderboard
  const leaderboard = calculateLeaderboard(users, matches, predictions);

  // Per-user analytics
  const userStats = users.map(user => {
    const preds = predictions.filter(p => p.userId === user.id);
    let pts=0, played=0, exact=0;
    preds.forEach(p => {
      const m = matches.find(x=>x.id===p.matchId);
      if (!m || m.homeScore===null || p.homeScore===null) return;
      played++; const s=calculatePoints(p,m); pts+=s; if(s===3) exact++;
    });
    const streak    = calculateStreak(preds, matches);
    const iq        = calculateFootballIQ(preds, matches, teamsData);
    const level     = getUserLevel(pts);
    const personality = classifyPersonality(preds, matches, teamsData);
    const meta      = userMeta[user.id] || {};
    return {
      id:user.id, name:user.name,
      pts, played, exact, accuracy: played ? Math.round((exact/played)*100) : 0,
      currentStreak: streak.currentStreak, maxStreak: streak.maxStreak,
      iq: iq.iq, level: level.id, levelLabel: level.label, levelIcon: level.icon,
      personality: personality.type, personalityPct: personality.pct,
      achievementsCount: (meta.achievements||[]).length,
      predictions: preds.length
    };
  });

  // Match insights
  const matchInsights = matches
    .filter(m => m.homeScore !== null)
    .map(m => {
      const preds = predictions.filter(p => p.matchId === m.id && p.homeScore !== null);
      const correct = preds.filter(p => calculatePoints(p,m) > 0).length;
      const exact   = preds.filter(p => calculatePoints(p,m) === 3).length;
      const avgHome = preds.length ? preds.reduce((s,p)=>s+p.homeScore,0)/preds.length : 0;
      const avgAway = preds.length ? preds.reduce((s,p)=>s+p.awayScore,0)/preds.length : 0;
      return {
        id:m.id, round:m.round, homeTeam:m.homeTeam, awayTeam:m.awayTeam,
        result:`${m.homeScore}-${m.awayScore}`, date:m.date,
        totalPredictions:preds.length, correct, exact,
        accuracy: preds.length ? Math.round((correct/preds.length)*100) : 0,
        avgPrediction:`${avgHome.toFixed(1)}-${avgAway.toFixed(1)}`
      };
    })
    .sort((a,b) => a.accuracy - b.accuracy);

  // Global stats
  const totalPts      = predictions.reduce((s,p) => { const m=matches.find(x=>x.id===p.matchId); return s+(m&&m.homeScore!==null&&p.homeScore!==null?calculatePoints(p,m):0); }, 0);
  const playedMatches = matches.filter(m=>m.homeScore!==null).length;

  // Personality distribution
  const personalityDist = {};
  userStats.forEach(u => { personalityDist[u.personality] = (personalityDist[u.personality]||0)+1; });

  // Level distribution
  const levelDist = {};
  userStats.forEach(u => { levelDist[u.level] = (levelDist[u.level]||0)+1; });

  // AI mode users (those who activated it)
  const aiUsers = Object.entries(userMeta).filter(([,m]) => m.aiMode).length;

  return res.status(200).json({
    leaderboard: leaderboard.slice(0,10),
    userStats,
    matchInsights: { hardest: matchInsights.slice(0,3), easiest: matchInsights.slice(-3).reverse() },
    globalStats: {
      totalUsers: users.length, totalPredictions: predictions.length,
      totalPts, playedMatches, totalMatches: matches.length,
      avgPtsPerUser: users.length ? Math.round(totalPts/users.length) : 0,
      totalComments: comments.filter(c=>c.type==='comment').length,
      aiUsers,
    },
    personalityDist, levelDist,
    topStreaks: userStats.sort((a,b)=>b.maxStreak-a.maxStreak).slice(0,5),
    topIQ: userStats.sort((a,b)=>b.iq-a.iq).slice(0,5),
  });
}
