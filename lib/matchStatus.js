/**
 * Estado de un partido:
 *
 *  'finished'      → tiene resultado oficial (homeScore !== null)
 *  'past_pending'  → la fecha ya pasó pero el admin aún no cargó el resultado
 *  'live'          → el partido es hoy
 *  'upcoming'      → el partido aún no ocurre
 *
 * Límite de pronósticos:
 *  PREDICTION_DEADLINE (env) — por defecto 2026-06-03T23:59:59
 *  Después de esa fecha nadie puede ingresar ni editar pronósticos.
 */

export const DEADLINE_ISO =
  process.env.NEXT_PUBLIC_PREDICTION_DEADLINE ||
  process.env.PREDICTION_DEADLINE ||
  '2026-06-03T23:59:59';

export function getDeadline() {
  return new Date(DEADLINE_ISO);
}

export function isPredictionOpen() {
  return new Date() < getDeadline();
}

/**
 * Returns one of: 'finished' | 'past_pending' | 'live' | 'upcoming'
 */
export function getMatchStatus(match) {
  if (match.homeScore !== null && match.awayScore !== null) return 'finished';

  const matchDate = new Date(match.date);
  const today     = new Date();

  // Compare only dates (ignore time)
  const mDay = matchDate.toISOString().slice(0, 10);
  const tDay = today.toISOString().slice(0, 10);

  if (mDay === tDay) return 'live';
  if (matchDate < today) return 'past_pending';
  return 'upcoming';
}

export function statusLabel(status) {
  switch (status) {
    case 'finished':     return { text: 'Finalizado',         bg: '#1A3320', color: '#4ADE80', dot: '#22C55E' };
    case 'past_pending': return { text: 'Pendiente resultado',bg: '#2A1A00', color: '#FCD34D', dot: '#F59E0B' };
    case 'live':         return { text: 'En curso',           bg: '#1E0A0A', color: '#FCA5A5', dot: '#EF4444', pulse: true };
    case 'upcoming':     return { text: 'Próximo',            bg: 'rgba(0,0,0,0.25)', color: 'rgba(255,255,255,0.5)', dot: 'rgba(255,255,255,0.4)' };
    default:             return { text: '',                   bg: 'transparent', color: '#fff', dot: '#fff' };
  }
}

export function formatMatchDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
}

export function daysUntilDeadline() {
  const diff = getDeadline() - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
