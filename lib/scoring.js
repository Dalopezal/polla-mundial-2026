/**
 * Sistema de puntuación:
 * - Marcador exacto (ambos goles): 3 puntos
 * - Cantidad total de goles correcta: 2 puntos
 * - Al menos un resultado de equipo correcto: 1 punto
 */
export function calculatePoints(prediction, match) {
  if (match.homeScore === null || match.awayScore === null) return 0;
  if (prediction.homeScore === null || prediction.awayScore === null) return 0;

  const predH = parseInt(prediction.homeScore);
  const predA = parseInt(prediction.awayScore);
  const actH = parseInt(match.homeScore);
  const actA = parseInt(match.awayScore);

  if (isNaN(predH) || isNaN(predA)) return 0;

  // Marcador exacto: 3 puntos
  if (predH === actH && predA === actA) return 3;

  // Total de goles correcto: 2 puntos
  if (predH + predA === actH + actA) return 2;

  // Al menos un equipo correcto: 1 punto
  if (predH === actH || predA === actA) return 1;

  return 0;
}

export function getPointLabel(points) {
  switch (points) {
    case 3: return { label: '¡Exacto!', color: '#22c55e', emoji: '🎯' };
    case 2: return { label: 'Total correcto', color: '#f59e0b', emoji: '✨' };
    case 1: return { label: 'Parcial', color: '#6366f1', emoji: '👍' };
    default: return { label: 'Sin puntos', color: '#6b7280', emoji: '❌' };
  }
}

export function calculateLeaderboard(users, matches, predictions) {
  return users.map(user => {
    const userPreds = predictions.filter(p => p.userId === user.id);
    let totalPoints = 0;
    let exactScores = 0;
    let totalGoals = 0;
    let partials = 0;
    let played = 0;

    userPreds.forEach(pred => {
      const match = matches.find(m => m.id === pred.matchId);
      if (!match || match.homeScore === null) return;
      played++;
      const pts = calculatePoints(pred, match);
      totalPoints += pts;
      if (pts === 3) exactScores++;
      else if (pts === 2) totalGoals++;
      else if (pts === 1) partials++;
    });

    return {
      id: user.id,
      name: user.name,
      totalPoints,
      exactScores,
      totalGoals,
      partials,
      played,
      predictions: userPreds.length
    };
  }).sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
    return b.totalGoals - a.totalGoals;
  });
}
