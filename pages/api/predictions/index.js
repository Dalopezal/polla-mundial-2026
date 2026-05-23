import { requireAuth } from '../../../lib/auth';
import { db } from '../../../lib/db';

// Fecha límite para pronósticos — configurable en .env.local
const DEADLINE = new Date(
  process.env.PREDICTION_DEADLINE || '2026-06-03T23:59:59'
);

function deadlinePassed() {
  return new Date() > DEADLINE;
}

async function handler(req, res) {
  // ── GET: retornar pronósticos del usuario ──────────────────
  if (req.method === 'GET') {
    const preds = db.predictions.findByUser(req.user.id);
    return res.status(200).json({
      predictions: preds,
      deadlinePassed: deadlinePassed(),
      deadline: DEADLINE.toISOString()
    });
  }

  // ── POST: guardar / actualizar pronóstico ──────────────────
  if (req.method === 'POST') {
    // Bloqueo por fecha límite
    if (deadlinePassed()) {
      return res.status(403).json({
        error: `El plazo para ingresar pronósticos cerró el 3 de junio. No se pueden hacer cambios.`
      });
    }

    const { matchId, homeScore, awayScore } = req.body;
    if (!matchId) return res.status(400).json({ error: 'matchId requerido' });

    const match = db.matches.findById(matchId);
    if (!match) return res.status(404).json({ error: 'Partido no encontrado' });

    // Validar que el partido no haya empezado (fecha de hoy en adelante)
    const matchDate = new Date(match.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (matchDate < today) {
      return res.status(403).json({
        error: 'No se pueden editar pronósticos de partidos que ya ocurrieron.'
      });
    }

    const hs  = homeScore === '' || homeScore === null ? null : parseInt(homeScore);
    const as_ = awayScore === '' || awayScore === null ? null : parseInt(awayScore);

    if (hs  !== null && (isNaN(hs)  || hs  < 0 || hs  > 30))
      return res.status(400).json({ error: 'Marcador local inválido (0-30)' });
    if (as_ !== null && (isNaN(as_) || as_ < 0 || as_ > 30))
      return res.status(400).json({ error: 'Marcador visitante inválido (0-30)' });

    const pred = db.predictions.upsert(req.user.id, matchId, {
      homeScore: hs,
      awayScore: as_
    });

    return res.status(200).json({ prediction: pred });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

export default requireAuth(handler);
