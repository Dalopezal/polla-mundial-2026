import { predictMatch } from '../../../lib/statsPredictor';
import fs from 'fs';
import path from 'path';

const GROUPS = {
  A:['México','Sudáfrica','Corea del Sur','República Checa'],
  B:['Canadá','Bosnia y Herzegovina','Catar','Suiza'],
  C:['Brasil','Marruecos','Haití','Escocia'],
  D:['Estados Unidos','Paraguay','Australia','Turquía'],
  E:['Alemania','Curazao','Costa de Marfil','Ecuador'],
  F:['Países Bajos','Japón','Suecia','Túnez'],
  G:['Bélgica','Egipto','Irán','Nueva Zelanda'],
  H:['España','Cabo Verde','Arabia Saudita','Uruguay'],
  I:['Francia','Senegal','Noruega','Irak'],
  J:['Argentina','Argelia','Austria','Jordania'],
  K:['Portugal','Colombia','R.D. del Congo','Uzbekistán'],
  L:['Inglaterra','Croacia','Ghana','Panamá']
};

function getTeams() {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(),'data','teams.json'),'utf8')); }
  catch { return {}; }
}

function simulateResult(lambdaH, lambdaA) {
  // Poisson random variate using Knuth algorithm
  const poisson = (lambda) => {
    let L = Math.exp(-lambda), k = 0, p = 1;
    do { k++; p *= Math.random(); } while (p > L);
    return k - 1;
  };
  return [poisson(lambdaH), poisson(lambdaA)];
}

function simulateGroup(teams, teamsData) {
  const pts = {}, gd = {}, gf = {};
  teams.forEach(t => { pts[t]=0; gd[t]=0; gf[t]=0; });

  for (let i=0; i<teams.length; i++) {
    for (let j=i+1; j<teams.length; j++) {
      const pred = predictMatch(teams[i], teams[j], teamsData);
      const [hg, ag] = simulateResult(pred.lambdaH, pred.lambdaA);
      gf[teams[i]]+=hg; gf[teams[j]]+=ag;
      gd[teams[i]]+=(hg-ag); gd[teams[j]]+=(ag-hg);
      if (hg>ag) pts[teams[i]]+=3;
      else if (hg===ag) { pts[teams[i]]++; pts[teams[j]]++; }
      else pts[teams[j]]+=3;
    }
  }

  return teams.slice().sort((a,b) => {
    if (pts[b]!==pts[a]) return pts[b]-pts[a];
    if (gd[b]!==gd[a]) return gd[b]-gd[a];
    return gf[b]-gf[a];
  }).map(t => ({ team:t, pts:pts[t], gd:gd[t], gf:gf[t] }));
}

function simulateMatch(t1, t2, teamsData) {
  try {
    const pred = predictMatch(t1, t2, teamsData);
    const [hg, ag] = simulateResult(pred.lambdaH, pred.lambdaA);
    if (hg !== ag) return hg > ag ? t1 : t2;
    // Extra time / penalties: use win probability
    return Math.random() < pred.homeWin / (pred.homeWin + pred.awayWin) ? t1 : t2;
  } catch { return Math.random() < 0.5 ? t1 : t2; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const teamsData = getTeams();
  const ITERS = 500; // Monte Carlo iterations

  const champCount = {}, finalCount = {}, semiCount = {};

  for (let iter = 0; iter < ITERS; iter++) {
    // --- Group stage ---
    const groupWinners = {}, groupRunners = {}, allThirds = [];

    for (const [gName, teams] of Object.entries(GROUPS)) {
      const standings = simulateGroup(teams, teamsData);
      groupWinners[gName] = standings[0].team;
      groupRunners[gName] = standings[1].team;
      allThirds.push({ group:gName, team:standings[2].team, pts:standings[2].pts, gd:standings[2].gd });
    }

    // Best 8 thirds
    const best8Thirds = allThirds
      .sort((a,b) => b.pts!==a.pts ? b.pts-a.pts : b.gd-a.gd)
      .slice(0,8).map(x=>x.team);

    // Build pool of 32 for R32
    // Simplified: pair them logically
    const r32Teams = [
      groupRunners['A'], groupRunners['B'],
      groupWinners['E'], best8Thirds[0]||groupRunners['C'],
      groupWinners['F'], groupRunners['C'],
      groupWinners['E'], groupRunners['F'],
      groupWinners['I'], best8Thirds[1]||groupRunners['D'],
      groupRunners['E'], groupRunners['I'],
      groupWinners['A'], best8Thirds[2]||groupRunners['K'],
      groupWinners['L'], best8Thirds[3]||groupRunners['G'],
      groupWinners['G'], best8Thirds[4]||groupRunners['J'],
      groupRunners['K'], groupRunners['L'],
      groupWinners['H'], groupRunners['J'],
      groupWinners['B'], best8Thirds[5]||groupRunners['F'],
      groupWinners['J'], groupRunners['H'],
      groupWinners['K'], best8Thirds[6]||groupRunners['L'],
      groupRunners['D'], groupRunners['G'],
      groupWinners['C'], groupRunners['G'],
    ];

    // Simulate from R32 to Final
    let roundTeams = [];
    for (let i=0; i<r32Teams.length; i+=2) {
      roundTeams.push(simulateMatch(r32Teams[i], r32Teams[i+1]||r32Teams[i], teamsData));
    }
    // R16
    const r16 = [];
    for (let i=0; i<roundTeams.length; i+=2) r16.push(simulateMatch(roundTeams[i], roundTeams[i+1]||roundTeams[i], teamsData));
    // QF
    const qf = [];
    for (let i=0; i<r16.length; i+=2) qf.push(simulateMatch(r16[i], r16[i+1]||r16[i], teamsData));
    // SF
    const sf = [];
    for (let i=0; i<qf.length; i+=2) {
      const w = simulateMatch(qf[i], qf[i+1]||qf[i], teamsData);
      sf.push(w);
      semiCount[qf[i]] = (semiCount[qf[i]]||0)+1;
      semiCount[qf[i+1]||(qf[i])] = (semiCount[qf[i+1]||(qf[i])]||0)+1;
    }
    // Final
    if (sf.length >= 2) {
      const finalist1 = sf[0], finalist2 = sf[1];
      finalCount[finalist1] = (finalCount[finalist1]||0)+1;
      finalCount[finalist2] = (finalCount[finalist2]||0)+1;
      const champion = simulateMatch(finalist1, finalist2, teamsData);
      champCount[champion] = (champCount[champion]||0)+1;
    }
  }

  const toPercent = (obj) => Object.entries(obj)
    .map(([team, count]) => ({ team, pct: +((count/ITERS)*100).toFixed(1) }))
    .sort((a,b) => b.pct-a.pct)
    .slice(0,12);

  return res.status(200).json({
    champion: toPercent(champCount),
    finalist: toPercent(finalCount),
    semifinal: toPercent(semiCount),
    iterations: ITERS
  });
}
