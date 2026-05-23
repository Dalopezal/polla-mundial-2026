import { calculatePoints } from './scoring';

// ── NIVELES ────────────────────────────────────────────────
export const LEVELS = [
  { id:'novato',   label:'Novato',          min:0,   icon:'⚽', color:'#6B7280', bg:'#F3F4F6',  desc:'Empezando a predecir' },
  { id:'analista', label:'Analista',         min:30,  icon:'📊', color:'#2563EB', bg:'#EFF6FF',  desc:'Usa la lógica para predecir' },
  { id:'experto',  label:'Experto',          min:80,  icon:'🔮', color:'#7C3AED', bg:'#EDE9FE',  desc:'Conocimiento sólido del fútbol' },
  { id:'guru',     label:'Gurú Mundialista', min:160, icon:'🏆', color:'#B8860B', bg:'#FEF9EC',  desc:'Maestro de las predicciones' },
];

export function getUserLevel(pts) {
  let level = LEVELS[0];
  for (const l of LEVELS) { if (pts >= l.min) level = l; }
  return level;
}

export function getNextLevel(pts) {
  for (const l of LEVELS) { if (pts < l.min) return l; }
  return null;
}

// ── LOGROS ─────────────────────────────────────────────────
export const ACHIEVEMENT_DEFS = [
  { id:'hat_trick',      icon:'🎯', label:'Hat-Trick Exacto',     desc:'3 marcadores exactos consecutivos',       rarity:'epic'  },
  { id:'streak_5',       icon:'🔥', label:'Racha Caliente',        desc:'5 resultados correctos seguidos',         rarity:'rare'  },
  { id:'streak_10',      icon:'⚡', label:'En Llamas',              desc:'10 resultados correctos seguidos',        rarity:'epic'  },
  { id:'improbable_draw',icon:'🎲', label:'Empate Imposible',       desc:'Predijiste un empate muy improbable',     rarity:'rare'  },
  { id:'weekly_top',     icon:'👑', label:'Rey de la Semana',       desc:'Terminaste top 1 en la tabla semanal',    rarity:'rare'  },
  { id:'upset_master',   icon:'💥', label:'Cazador de Sorpresas',   desc:'Predijiste 3 sorpresas seguidas',         rarity:'epic'  },
  { id:'early_bird',     icon:'⏰', label:'El Primero',             desc:'Predijiste todos los partidos antes del límite', rarity:'common'},
  { id:'colombia_fan',   icon:'🇨🇴', label:'Corazón Colombiano',    desc:'Predijiste correctamente 2 partidos de Colombia', rarity:'common'},
  { id:'cold_blood',     icon:'🧊', label:'Sangre Fría',            desc:'Predijiste 5 victorias del favorito correctamente', rarity:'common'},
  { id:'risk_taker',     icon:'🃏', label:'El Apostador Loco',      desc:'Predijiste 5 resultados de underdog',     rarity:'rare'  },
  { id:'first_predict',  icon:'🌟', label:'Primera Predicción',     desc:'Hiciste tu primera predicción',           rarity:'common'},
  { id:'perfectionist',  icon:'💎', label:'Perfeccionista',         desc:'Predijiste todos los partidos de un grupo', rarity:'rare'  },
];

// ── PERSONALIDAD ───────────────────────────────────────────
export const PERSONALITIES = {
  analytic:     { icon:'🧠', label:'Analítico',    color:'#1D4ED8', bg:'#EFF6FF',  desc:'Apuesta con lógica y datos' },
  risky:        { icon:'🎲', label:'Arriesgado',   color:'#D97706', bg:'#FEF3C7',  desc:'Busca sorpresas y upsets' },
  conservative: { icon:'🛡', label:'Conservador',  color:'#16A34A', bg:'#DCFCE7',  desc:'Siempre va a la fija' },
  emotional:    { icon:'🔥', label:'Emocional',    color:'var(--crimson)', bg:'#FEF2F2', desc:'Apuesta por su equipo del corazón' },
};

export function classifyPersonality(predictions, matches, teamsData) {
  if (!predictions.length) return { type:'analytic', score: { analytic:0, risky:0, conservative:0, emotional:0 } };

  let risky = 0, conservative = 0, emotional = 0, total = 0;

  predictions.forEach(pred => {
    const m = matches.find(x => x.id === pred.matchId);
    if (!m || pred.homeScore === null) return;
    total++;

    const h = teamsData[m.homeTeam] || { elo:1800 };
    const a = teamsData[m.awayTeam] || { elo:1800 };
    const eloDiff = h.elo - a.elo;
    const favHome = eloDiff > 100;  // home is clear favorite
    const favAway = eloDiff < -100; // away is clear favorite

    const predH = pred.homeScore, predA = pred.awayScore;

    // Conservative: picked the favorite to win
    if ((favHome && predH > predA) || (favAway && predH < predA)) conservative++;
    // Risky: picked the underdog to win
    if ((favHome && predH < predA) || (favAway && predH > predA)) risky++;
    if (predH === predA && Math.abs(eloDiff) > 150) risky++; // improbable draw
    // Emotional: consistently picked Colombia, Argentina, Brazil
    const fav = ['Colombia','Argentina','Brasil','Francia'];
    if (fav.includes(m.homeTeam) && predH > predA) emotional++;
    if (fav.includes(m.awayTeam) && predA > predH) emotional++;
  });

  if (!total) return { type:'analytic', pct: 0, score: {} };

  const score = {
    analytic:     Math.round(100 - ((risky + Math.abs(conservative - total/2)) / total) * 100),
    risky:        Math.round((risky / total) * 100),
    conservative: Math.round((conservative / total) * 100),
    emotional:    Math.round((emotional / total) * 60),
  };

  const dominant = Object.entries(score).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  return { type: dominant, pct: score[dominant], score };
}

// ── FOOTBALL IQ ────────────────────────────────────────────
export function calculateFootballIQ(predictions, matches, teamsData) {
  if (!predictions.length) return { iq:0, accuracy:0, riskScore:0, trend:0, details:{} };

  let correct = 0, total = 0, exact = 0, pts = 0;
  let riskyBets = 0, riskyWins = 0;
  const monthly = {};

  predictions.forEach(pred => {
    const m = matches.find(x => x.id === pred.matchId);
    if (!m || m.homeScore === null || pred.homeScore === null) return;
    total++;

    const p = calculatePoints(pred, m);
    pts += p;
    if (p > 0) correct++;
    if (p === 3) exact++;

    // Risk: betting against heavy favorite
    const h = teamsData[m.homeTeam] || { elo:1800 };
    const a = teamsData[m.awayTeam] || { elo:1800 };
    const eloDiff = Math.abs(h.elo - a.elo);
    if (eloDiff > 120) {
      riskyBets++;
      if (p > 0) riskyWins++;
    }

    // Monthly tracking
    const month = m.date?.slice(0,7) || 'unknown';
    if (!monthly[month]) monthly[month] = { correct:0, total:0 };
    monthly[month].total++;
    if (p > 0) monthly[month].correct++;
  });

  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const exactRate = total ? Math.round((exact / total) * 100) : 0;
  const riskScore = riskyBets ? Math.round((riskyWins / riskyBets) * 100) : 0;

  // Trend: compare first half vs second half accuracy
  const months = Object.values(monthly);
  let trend = 0;
  if (months.length >= 2) {
    const first = months.slice(0, Math.floor(months.length/2));
    const second = months.slice(Math.floor(months.length/2));
    const firstAcc  = first.reduce((s,m)=>s+m.correct,0)/Math.max(1,first.reduce((s,m)=>s+m.total,0));
    const secondAcc = second.reduce((s,m)=>s+m.correct,0)/Math.max(1,second.reduce((s,m)=>s+m.total,0));
    trend = Math.round((secondAcc - firstAcc) * 100);
  }

  // IQ: weighted formula (0-200 scale)
  const iq = Math.min(200, Math.round(
    accuracy * 0.6 +
    exactRate * 0.8 +
    riskScore * 0.4 +
    Math.max(0, trend) * 0.5 +
    Math.min(total, 50) * 0.4
  ));

  return { iq, accuracy, exactRate, riskScore, trend, total, correct, exact, pts,
    rating: iq >= 150 ? 'Genio' : iq >= 100 ? 'Experto' : iq >= 60 ? 'Aprendiz' : 'Iniciante' };
}

// ── STREAK CALCULATOR ──────────────────────────────────────
export function calculateStreak(predictions, matches) {
  const played = predictions
    .map(pred => {
      const m = matches.find(x => x.id === pred.matchId);
      if (!m || m.homeScore === null || pred.homeScore === null) return null;
      return { date: m.date, pts: calculatePoints(pred, m) };
    })
    .filter(Boolean)
    .sort((a,b) => a.date.localeCompare(b.date));

  let currentStreak = 0, maxStreak = 0, exactStreak = 0, maxExactStreak = 0;

  for (const p of played) {
    if (p.pts > 0) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
    if (p.pts === 3) {
      exactStreak++;
      maxExactStreak = Math.max(maxExactStreak, exactStreak);
    } else {
      exactStreak = 0;
    }
  }

  return { currentStreak, maxStreak, currentExactStreak: exactStreak, maxExactStreak };
}

// ── ACHIEVEMENT CHECKER ────────────────────────────────────
export function checkAchievements(predictions, matches, teamsData, existingAchievements = []) {
  const earned = new Set(existingAchievements.map(a => a.id));
  const newOnes = [];

  const played = predictions
    .map(pred => {
      const m = matches.find(x => x.id === pred.matchId);
      if (!m || m.homeScore === null || pred.homeScore === null) return null;
      return { pred, match: m, pts: calculatePoints(pred, m) };
    })
    .filter(Boolean)
    .sort((a,b) => a.match.date.localeCompare(b.match.date));

  const grant = (id) => {
    if (!earned.has(id)) {
      earned.add(id);
      const def = ACHIEVEMENT_DEFS.find(a => a.id === id);
      if (def) newOnes.push({ ...def, unlockedAt: new Date().toISOString() });
    }
  };

  // First prediction
  if (played.length >= 1) grant('first_predict');

  // Streaks
  const { currentStreak, maxStreak, maxExactStreak } = calculateStreak(predictions, matches);
  if (maxStreak >= 5)       grant('streak_5');
  if (maxStreak >= 10)      grant('streak_10');
  if (maxExactStreak >= 3)  grant('hat_trick');

  // Colombia predictions
  const colombiaCorrect = played.filter(p =>
    (p.match.homeTeam === 'Colombia' || p.match.awayTeam === 'Colombia') && p.pts > 0
  ).length;
  if (colombiaCorrect >= 2) grant('colombia_fan');

  // Cold blood: 5 correct favorites
  let favCorrect = 0;
  played.forEach(({ pred, match, pts }) => {
    if (pts === 0) return;
    const h = teamsData[match.homeTeam] || { elo:1800 };
    const a = teamsData[match.awayTeam] || { elo:1800 };
    const favHome = h.elo > a.elo + 80;
    const favAway = a.elo > h.elo + 80;
    if ((favHome && pred.homeScore > pred.awayScore) || (favAway && pred.awayScore > pred.homeScore)) favCorrect++;
  });
  if (favCorrect >= 5) grant('cold_blood');

  // Risk taker: 5 underdog wins predicted
  let underdogCorrect = 0;
  played.forEach(({ pred, match, pts }) => {
    if (pts === 0) return;
    const h = teamsData[match.homeTeam] || { elo:1800 };
    const a = teamsData[match.awayTeam] || { elo:1800 };
    const upsetHome = h.elo < a.elo - 100 && pred.homeScore > pred.awayScore && match.homeScore > match.awayScore;
    const upsetAway = a.elo < h.elo - 100 && pred.awayScore > pred.homeScore && match.awayScore > match.homeScore;
    if (upsetHome || upsetAway) underdogCorrect++;
  });
  if (underdogCorrect >= 3) grant('upset_master');

  // Improbable draw
  played.forEach(({ pred, match, pts }) => {
    if (pts === 0) return;
    const h = teamsData[match.homeTeam] || { elo:1800 };
    const a = teamsData[match.awayTeam] || { elo:1800 };
    if (Math.abs(h.elo - a.elo) > 150 && pred.homeScore === pred.awayScore && match.homeScore === match.awayScore) {
      grant('improbable_draw');
    }
  });

  return { newAchievements: newOnes, allAchievements: [...existingAchievements, ...newOnes] };
}
