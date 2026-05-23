import { db } from '../../../lib/db';
import { predictMatch } from '../../../lib/statsPredictor';
import fs from 'fs';
import path from 'path';

function getTeams() {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'data', 'teams.json'), 'utf8');
    return JSON.parse(raw);
  } catch { return {}; }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const { matchId, round } = req.query;
  const teams   = getTeams();
  const matches = db.matches.getAll();

  // Filtrar partidos con equipos reales (no placeholders W(...), L(...), 1A, etc.)
  const isRealTeam = (name) => name && !name.startsWith('W(') && !name.startsWith('L(')
    && !/^\d[A-Z]/.test(name) && !name.startsWith('3');

  let pool = matches.filter(m => isRealTeam(m.homeTeam) && isRealTeam(m.awayTeam));

  if (matchId) {
    pool = pool.filter(m => m.id === matchId);
  } else if (round) {
    pool = pool.filter(m => m.round === round);
  }

  // Limitar a 50 para no sobrecargar
  pool = pool.slice(0, 50);

  const predictions = pool.map(m => {
    try {
      const pred = predictMatch(m.homeTeam, m.awayTeam, teams);
      return {
        matchId:  m.id,
        round:    m.round,
        date:     m.date,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        actualHomeScore: m.homeScore,
        actualAwayScore: m.awayScore,
        ...pred
      };
    } catch (e) {
      return { matchId: m.id, homeTeam: m.homeTeam, awayTeam: m.awayTeam, error: e.message };
    }
  });

  // Estadísticas globales del torneo
  const allGroupMatches = matches.filter(m => m.round.startsWith('Grupo') && isRealTeam(m.homeTeam) && isRealTeam(m.awayTeam));
  const teamStats = {};
  allGroupMatches.forEach(m => {
    if (!teamStats[m.homeTeam]) teamStats[m.homeTeam] = { name: m.homeTeam, flag: teams[m.homeTeam]?.flag || '', elo: teams[m.homeTeam]?.elo || 1700, confederation: teams[m.homeTeam]?.confederation || '' };
    if (!teamStats[m.awayTeam]) teamStats[m.awayTeam] = { name: m.awayTeam, flag: teams[m.awayTeam]?.flag || '', elo: teams[m.awayTeam]?.elo || 1700, confederation: teams[m.awayTeam]?.confederation || '' };
  });

  const sortedTeams = Object.values(teamStats).sort((a, b) => b.elo - a.elo);

  return res.status(200).json({
    predictions,
    topTeams: sortedTeams.slice(0, 10),
    totalMatches: pool.length
  });
}
