import { requireAdmin } from '../../../../lib/auth';
import { db } from '../../../../lib/db';

async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Método no permitido' });

  const { id } = req.query;
  const { homeTeam, awayTeam, homeScore, awayScore, homePens, awayPens } = req.body;

  const match = db.matches.findById(id);
  if (!match) return res.status(404).json({ error: 'Partido no encontrado' });

  const updates = {};

  if (homeTeam !== undefined) updates.homeTeam = homeTeam;
  if (awayTeam !== undefined) updates.awayTeam = awayTeam;

  if (homeScore !== undefined) {
    updates.homeScore = homeScore === '' || homeScore === null ? null : parseInt(homeScore);
  }
  if (awayScore !== undefined) {
    updates.awayScore = awayScore === '' || awayScore === null ? null : parseInt(awayScore);
  }
  if (homePens !== undefined) {
    updates.homePens = homePens === '' || homePens === null ? null : parseInt(homePens);
  }
  if (awayPens !== undefined) {
    updates.awayPens = awayPens === '' || awayPens === null ? null : parseInt(awayPens);
  }

  const updated = db.matches.update(id, updates);

  // Resolver apuestas IA si el partido tiene resultado ahora
  if (updated && updated.homeScore !== null && updated.awayScore !== null) {
    try {
      const { resolverApuestas } = await import('../../ai-bet/index');
      await resolverApuestas(id);
    } catch (e) { console.error('Error resolviendo apuestas IA:', e.message); }
  }

  return res.status(200).json({ match: updated });
}

export default requireAdmin(handler);
