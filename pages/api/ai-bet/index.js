import { v4 as uuid } from 'uuid';
import { requireAuth } from '../../../lib/auth';
import { db } from '../../../lib/db';
import { predictMatch } from '../../../lib/statsPredictor';
import { calculatePoints } from '../../../lib/scoring';
import { IA_BET } from '../../../lib/payments';
import fs from 'fs'; import path from 'path';

function getTeams() {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(),'data','teams.json'),'utf8')); }
  catch { return {}; }
}

async function handler(req, res) {
  const user = db.users.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  // ── GET: obtener apuestas del usuario ─────────────────
  if (req.method === 'GET') {
    const bets = db.aiBets.findByUser(req.user.id);
    const matches = db.matches.getAll();
    const enriched = bets.map(b => {
      const m = matches.find(x => x.id === b.matchId);
      return { ...b, match: m || null };
    });
    return res.status(200).json({
      bets: enriched,
      saldoIA: user.saldoIA || 0,
      totalGanado: enriched.filter(b=>b.resultado==='ganada').reduce((s,b)=>s+b.monto,0),
      totalPerdido: enriched.filter(b=>b.resultado==='perdida').reduce((s,b)=>s+b.monto,0),
    });
  }

  // ── POST: colocar apuesta ─────────────────────────────
  if (req.method === 'POST') {
    if (!user.incluye_ia) return res.status(403).json({ error: 'Necesitas el plan Con IA para apostar' });

    const { matchId, monto } = req.body;
    if (!matchId || !monto) return res.status(400).json({ error: 'matchId y monto requeridos' });

    const montoNum = parseInt(monto);
    if (montoNum < IA_BET.minimo) return res.status(400).json({ error: `Mínimo: $${IA_BET.minimo.toLocaleString('es-CO')} COP` });

    const saldoActual = user.saldoIA || 0;
    if (montoNum > saldoActual) return res.status(400).json({ error: `Saldo insuficiente. Tienes $${saldoActual.toLocaleString('es-CO')} COP` });

    const match = db.matches.findById(matchId);
    if (!match) return res.status(404).json({ error: 'Partido no encontrado' });
    if (match.homeScore !== null) return res.status(400).json({ error: 'El partido ya terminó, no puedes apostar' });

    const yaApuesto = db.aiBets.findOne(req.user.id, matchId);
    if (yaApuesto) return res.status(400).json({ error: 'Ya tienes una apuesta en este partido' });

    // Generar predicción de la IA
    const teams = getTeams();
    let iaScore = { home: 1, away: 1 };
    try {
      const pred = predictMatch(match.homeTeam, match.awayTeam, teams);
      iaScore = pred.topScores[0] || iaScore;
    } catch {}

    // Descontar saldo
    db.users.update(req.user.id, { saldoIA: saldoActual - montoNum });

    const bet = db.aiBets.create({
      id:         uuid(),
      userId:     req.user.id,
      matchId,
      monto:      montoNum,
      iaPrediccion: { home: iaScore.home, away: iaScore.away },
      resultado:  'pendiente',  // pendiente / ganada / perdida / empate
    });

    return res.status(200).json({
      bet,
      saldoIA: saldoActual - montoNum,
      mensaje: `Apuesta de $${montoNum.toLocaleString('es-CO')} registrada. La IA predice ${match.homeTeam} ${iaScore.home}–${iaScore.away} ${match.awayTeam}`
    });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

// ── Función para resolver apuestas cuando hay resultado ──
export async function resolverApuestas(matchId) {
  const match = db.matches.findById(matchId);
  if (!match || match.homeScore === null) return;

  const bets = db.aiBets.findByMatch(matchId);
  const teams = getTeams();

  let iaScore = { home: 1, away: 1 };
  try {
    const pred = predictMatch(match.homeTeam, match.awayTeam, teams);
    iaScore = pred.topScores[0] || iaScore;
  } catch {}

  // Puntos de la IA
  const iaPred = { homeScore: iaScore.home, awayScore: iaScore.away };
  const iaPts  = calculatePoints(iaPred, match);

  for (const bet of bets) {
    if (bet.resultado !== 'pendiente') continue;

    const userPred = db.predictions.findOne(bet.userId, matchId);
    const userPts  = userPred ? calculatePoints(userPred, match) : 0;

    let resultado, saldoCambio;
    const user = db.users.findById(bet.userId);

    if (userPts > iaPts) {
      resultado    = 'ganada';
      saldoCambio  = bet.monto * 2; // recupera lo apostado + gana igual
    } else if (userPts === iaPts) {
      resultado    = 'empate';
      saldoCambio  = bet.monto;     // devuelve lo apostado
    } else {
      resultado    = 'perdida';
      saldoCambio  = 0;             // dinero pasa al admin
    }

    db.aiBets.update(bet.id, {
      resultado,
      userPts,
      iaPts,
      iaPrediccionFinal: iaPred,
      resueltaEn: new Date().toISOString(),
    });

    if (user && saldoCambio > 0) {
      db.users.update(bet.userId, { saldoIA: (user.saldoIA || 0) + saldoCambio });
    }
  }
}

export default requireAuth(handler);
