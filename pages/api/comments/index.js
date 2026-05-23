import { db } from '../../../lib/db';
import { getUserFromRequest } from '../../../lib/auth';

export default async function handler(req, res) {
  const { matchId } = req.query;
  if (!matchId) return res.status(400).json({ error: 'matchId requerido' });

  if (req.method === 'GET') {
    const comments  = db.comments.findByMatch(matchId).filter(c => c.type === 'comment');
    const reactions = db.comments.findByMatch(matchId).filter(c => c.type === 'reaction');
    const users     = db.users.getAll();
    const preds     = db.predictions.findByMatch(matchId);

    // Build bets view: who predicted what for this match
    const bets = preds.map(p => {
      const user = users.find(u => u.id === p.userId);
      const matchReactions = reactions.filter(r => r.predUserId === p.userId);
      return {
        userId: p.userId, userName: user?.name || 'Anónimo',
        homeScore: p.homeScore, awayScore: p.awayScore,
        reactions: matchReactions.reduce((acc, r) => { acc[r.reaction] = (acc[r.reaction]||0)+1; return acc; }, {})
      };
    });

    return res.status(200).json({ comments, bets });
  }

  if (req.method === 'POST') {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'No autenticado' });

    const { text, type, predUserId, reaction } = req.body;

    if (type === 'reaction') {
      if (!predUserId || !reaction) return res.status(400).json({ error: 'Datos incompletos' });
      const VALID_REACTIONS = ['🔥','😮','🤣','💀','🎯','👏','🤡','💪'];
      if (!VALID_REACTIONS.includes(reaction)) return res.status(400).json({ error: 'Reacción inválida' });
      db.comments.upsertReaction(matchId, predUserId, user.id, reaction);
      return res.status(200).json({ ok: true });
    }

    if (!text || text.trim().length < 2) return res.status(400).json({ error: 'Comentario muy corto' });
    if (text.length > 280) return res.status(400).json({ error: 'Máximo 280 caracteres' });

    const comment = db.comments.add({
      id: `c_${Date.now()}_${user.id.slice(0,6)}`,
      type: 'comment', matchId,
      userId: user.id, userName: user.name,
      text: text.trim()
    });

    return res.status(201).json({ comment });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
