/**
 * Motor de predicción estadística para partidos de fútbol.
 *
 * Técnicas implementadas:
 *  1. Distribución de Poisson bivariada — modelo estándar en actuaría deportiva.
 *     Cada equipo genera goles como proceso de Poisson independiente con tasa λ.
 *
 *  2. Corrección Dixon-Coles — ajusta la subestimación del modelo de Poisson para
 *     marcadores bajos (0-0, 1-0, 0-1, 1-1), que ocurren con más frecuencia de
 *     lo que Poisson puro predice.
 *
 *  3. Ponderación Elo — estima la fortaleza relativa de cada equipo a partir de
 *     su rating Elo. Normaliza ataque y defensa con respecto al promedio del torneo.
 *
 *  4. Regresión a la media — evita predicciones extremas para equipos con Elo
 *     muy diferente al promedio.
 *
 * Referencia:
 *  Dixon & Coles (1997). "Modelling Association Football Scores and
 *  Inefficiencies in the Football Betting Market." Applied Statistics, 46(2), 265-280.
 */

// ── Constantes del modelo ──────────────────────────────────
const BASE_LAMBDA   = 1.22;  // goles promedio por equipo en un Mundial (~2.44 totales)
const HOME_ADVANTAGE= 1.04;  // ligera ventaja de "local" en sorteo de bracket
const DC_RHO        = -0.13; // correlación Dixon-Coles (valor calibrado para fútbol)
const MAX_GOALS     = 9;     // máximo de goles a considerar en la matriz
const AVG_ELO       = 1800;  // Elo promedio de los 48 equipos del Mundial 2026

// ── Carga de ratings ──────────────────────────────────────
let _teamData = null;

function getTeamData() {
  if (_teamData) return _teamData;
  if (typeof window !== 'undefined') return {};  // cliente: se carga via API
  try {
    const fs   = require('fs');
    const path = require('path');
    const raw  = fs.readFileSync(path.join(process.cwd(), 'data', 'teams.json'), 'utf8');
    _teamData  = JSON.parse(raw);
  } catch {
    _teamData  = {};
  }
  return _teamData;
}

// ── Utilidades matemáticas ─────────────────────────────────
function factorial(n) {
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

/** P(X=k) donde X ~ Poisson(λ) */
function poisson(lambda, k) {
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

/**
 * Corrección Dixon-Coles para marcadores bajos.
 * Ajusta la probabilidad conjunta P(home=x, away=y).
 */
function dixonColes(x, y, lambdaH, lambdaA, rho) {
  if (x === 0 && y === 0) return 1 - lambdaH * lambdaA * rho;
  if (x === 0 && y === 1) return 1 + lambdaH * rho;
  if (x === 1 && y === 0) return 1 + lambdaA * rho;
  if (x === 1 && y === 1) return 1 - rho;
  return 1;
}

// ── Estimación de λ por equipo ─────────────────────────────
function computeLambdas(homeTeam, awayTeam, teams) {
  const h = teams[homeTeam] || { elo: AVG_ELO, attack: 1.0, defense: 1.0 };
  const a = teams[awayTeam] || { elo: AVG_ELO, attack: 1.0, defense: 1.0 };

  // Factor de fortaleza Elo (desviación del promedio, con regresión a la media)
  const REGRESSION = 0.55; // cuánto regresamos hacia la media
  const eloFactorH = 1 + REGRESSION * ((h.elo - AVG_ELO) / AVG_ELO);
  const eloFactorA = 1 + REGRESSION * ((a.elo - AVG_ELO) / AVG_ELO);

  // λ = base × ataque_propio × defensa_rival × factor_elo × ventaja_local
  const lambdaH = BASE_LAMBDA
    * (h.attack * (1 - REGRESSION) + eloFactorH * REGRESSION)
    * (a.defense * (1 - REGRESSION) + (AVG_ELO / a.elo) * REGRESSION)
    * HOME_ADVANTAGE;

  const lambdaA = BASE_LAMBDA
    * (a.attack * (1 - REGRESSION) + eloFactorA * REGRESSION)
    * (h.defense * (1 - REGRESSION) + (AVG_ELO / h.elo) * REGRESSION);

  // Clamp: nunca menos de 0.3 ni más de 3.5 goles esperados
  return {
    lambdaH: Math.min(Math.max(lambdaH, 0.30), 3.5),
    lambdaA: Math.min(Math.max(lambdaA, 0.30), 3.5)
  };
}

// ── Predicción central ─────────────────────────────────────
export function predictMatch(homeTeam, awayTeam, teamsData = null) {
  const teams = teamsData || getTeamData();
  const { lambdaH, lambdaA } = computeLambdas(homeTeam, awayTeam, teams);

  let homeWin = 0, draw = 0, awayWin = 0;
  const scoreMatrix = [];

  for (let h = 0; h <= MAX_GOALS; h++) {
    for (let a = 0; a <= MAX_GOALS; a++) {
      const rawProb = poisson(lambdaH, h) * poisson(lambdaA, a);
      const dcCorr  = dixonColes(h, a, lambdaH, lambdaA, DC_RHO);
      const prob    = rawProb * dcCorr;

      scoreMatrix.push({ home: h, away: a, prob });

      if (h > a) homeWin += prob;
      else if (h === a) draw += prob;
      else awayWin += prob;
    }
  }

  // Normalizar para que sume 1.0 exactamente
  const total = homeWin + draw + awayWin;
  homeWin /= total;
  draw    /= total;
  awayWin /= total;
  scoreMatrix.forEach(s => { s.prob /= total; });

  // Top 8 marcadores más probables
  scoreMatrix.sort((a, b) => b.prob - a.prob);
  const topScores = scoreMatrix.slice(0, 8);

  // Confianza del modelo: mayor cuando la diferencia Elo es significativa
  const hTeam = teams[homeTeam] || { elo: AVG_ELO };
  const aTeam = teams[awayTeam] || { elo: AVG_ELO };
  const eloDiff = Math.abs(hTeam.elo - aTeam.elo);
  const confidence = Math.min(95, 55 + (eloDiff / 20));

  return {
    homeTeam, awayTeam,
    lambdaH: +lambdaH.toFixed(3),
    lambdaA: +lambdaA.toFixed(3),
    homeWin: +homeWin.toFixed(4),
    draw:    +draw.toFixed(4),
    awayWin: +awayWin.toFixed(4),
    totalExpectedGoals: +(lambdaH + lambdaA).toFixed(2),
    topScores: topScores.map(s => ({
      home: s.home, away: s.away,
      prob: +(s.prob * 100).toFixed(2)
    })),
    confidence: +confidence.toFixed(1),
    homeElo: hTeam.elo || AVG_ELO,
    awayElo: aTeam.elo || AVG_ELO
  };
}

/** Predicción para un array de partidos — útil en el servidor */
export function predictMatches(matches, teamsData) {
  return matches.map(m => {
    try {
      return { matchId: m.id, ...predictMatch(m.homeTeam, m.awayTeam, teamsData) };
    } catch {
      return { matchId: m.id, error: 'Sin datos suficientes' };
    }
  });
}

/**
 * Calcula las probabilidades de avance de cada selección
 * basadas en su grupo y los ratings Elo de sus rivales.
 * Usa simulación de Monte Carlo (10 000 iteraciones).
 */
export function simulateTournament(groups, teamsData, iterations = 10000) {
  const advanceCount = {};

  for (let iter = 0; iter < iterations; iter++) {
    const groupResults = {};

    for (const [groupName, teamNames] of Object.entries(groups)) {
      const pts = {};
      const gd  = {};
      teamNames.forEach(t => { pts[t] = 0; gd[t] = 0; });

      // Round-robin dentro del grupo
      for (let i = 0; i < teamNames.length; i++) {
        for (let j = i + 1; j < teamNames.length; j++) {
          const pred = predictMatch(teamNames[i], teamNames[j], teamsData);
          // Simular resultado aleatorio basado en probabilidades
          const r = Math.random();
          let hg, ag;
          if (r < pred.homeWin) {
            hg = Math.round(pred.lambdaH * (0.7 + Math.random() * 0.6));
            ag = Math.max(0, hg - 1 - Math.floor(Math.random() * 2));
          } else if (r < pred.homeWin + pred.draw) {
            hg = Math.round(pred.lambdaH * 0.8);
            ag = hg;
          } else {
            ag = Math.round(pred.lambdaA * (0.7 + Math.random() * 0.6));
            hg = Math.max(0, ag - 1 - Math.floor(Math.random() * 2));
          }
          // Puntos
          if (hg > ag) { pts[teamNames[i]] += 3; }
          else if (hg === ag) { pts[teamNames[i]] += 1; pts[teamNames[j]] += 1; }
          else { pts[teamNames[j]] += 3; }
          gd[teamNames[i]] += (hg - ag);
          gd[teamNames[j]] += (ag - hg);
        }
      }

      // Clasificar: top 2 avanzan directo
      const sorted = teamNames.slice().sort((a, b) =>
        pts[b] !== pts[a] ? pts[b] - pts[a] : gd[b] - gd[a]
      );
      groupResults[groupName] = sorted;
      sorted.slice(0, 2).forEach(t => {
        advanceCount[t] = (advanceCount[t] || 0) + 1;
      });
    }
  }

  // Convertir a porcentajes
  const result = {};
  for (const [team, count] of Object.entries(advanceCount)) {
    result[team] = +((count / iterations) * 100).toFixed(1);
  }
  return result;
}
