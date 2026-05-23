import { predictMatch } from '../../../lib/statsPredictor';
import fs from 'fs';
import path from 'path';

function getTeams() {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(),'data','teams.json'),'utf8')); }
  catch { return {}; }
}

// Genera explicación natural si no hay API key de Anthropic
function buildTemplateExplanation(homeTeam, awayTeam, pred, ht, at) {
  const winner = pred.homeWin > pred.awayWin ? homeTeam : pred.awayWin > pred.homeWin ? awayTeam : 'Empate';
  const topScore = pred.topScores[0];
  const eloGap = Math.abs(pred.homeElo - pred.awayElo);

  const reasons = [];
  if (ht && at) {
    if (ht.elo > at.elo + 80)   reasons.push(`${homeTeam} tiene rating Elo superior (${ht.elo} vs ${at.elo})`);
    if (at.elo > ht.elo + 80)   reasons.push(`${awayTeam} tiene rating Elo superior (${at.elo} vs ${ht.elo})`);
    if (ht.fifaRank < at.fifaRank) reasons.push(`${homeTeam} está mejor rankeado en FIFA (#${ht.fifaRank} vs #${at.fifaRank})`);
    if (at.fifaRank < ht.fifaRank) reasons.push(`${awayTeam} está mejor rankeado en FIFA (#${at.fifaRank} vs #${ht.fifaRank})`);
    if (ht.avgGoals > at.avgGoals + 0.3) reasons.push(`${homeTeam} promedia ${ht.avgGoals} goles por partido vs ${at.avgGoals} de ${awayTeam}`);
    if (at.avgGoals > ht.avgGoals + 0.3) reasons.push(`${awayTeam} promedia ${at.avgGoals} goles por partido vs ${ht.avgGoals} de ${homeTeam}`);
    if (eloGap < 50) reasons.push(`Las selecciones tienen fortaleza muy similar (Elo diferencia: ${eloGap})`);
  }

  const favoriteText = winner === 'Empate'
    ? `El modelo predice un partido muy parejo entre ${homeTeam} y ${awayTeam}. El empate es escenario probable.`
    : `${winner} es el favorito según el modelo estadístico con ${Math.round(Math.max(pred.homeWin, pred.awayWin)*100)}% de probabilidad.`;

  const keyPlayerHome = ht?.keyPlayer ? `⭐ Jugador clave ${homeTeam}: **${ht.keyPlayer}** (${ht.keyPlayerPos})` : '';
  const keyPlayerAway = at?.keyPlayer ? `⭐ Jugador clave ${awayTeam}: **${at.keyPlayer}** (${at.keyPlayerPos})` : '';

  return {
    summary: favoriteText,
    reasons: reasons.slice(0, 3),
    suggestedScore: `${topScore.home}-${topScore.away}`,
    keyPlayerHome: ht?.keyPlayer || null,
    keyPlayerAway: at?.keyPlayer || null,
    keyPlayerHomePos: ht?.keyPlayerPos || null,
    keyPlayerAwayPos: at?.keyPlayerPos || null,
    confidence: pred.confidence,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { homeTeam, awayTeam } = req.body;
  if (!homeTeam || !awayTeam) return res.status(400).json({ error: 'Equipos requeridos' });

  const teams = getTeams();
  const ht = teams[homeTeam];
  const at = teams[awayTeam];

  // Statistical prediction
  let pred;
  try { pred = predictMatch(homeTeam, awayTeam, teams); }
  catch(e) { return res.status(500).json({ error: 'Error en predicción: ' + e.message }); }

  // Try Anthropic API for natural language explanation
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey) {
    try {
      const prompt = `Eres un experto analista de fútbol para el Mundial 2026. Analiza este partido y da una predicción.

PARTIDO: ${homeTeam} vs ${awayTeam}

DATOS ESTADÍSTICOS (Modelo Poisson + Elo):
- Probabilidad victoria ${homeTeam}: ${(pred.homeWin*100).toFixed(1)}%
- Probabilidad empate: ${(pred.draw*100).toFixed(1)}%
- Probabilidad victoria ${awayTeam}: ${(pred.awayWin*100).toFixed(1)}%
- Goles esperados ${homeTeam}: ${pred.lambdaH}
- Goles esperados ${awayTeam}: ${pred.lambdaA}
- Marcador más probable: ${pred.topScores[0].home}-${pred.topScores[0].away}
- Rating Elo ${homeTeam}: ${pred.homeElo} | Ranking FIFA: #${ht?.fifaRank || 'N/A'}
- Rating Elo ${awayTeam}: ${pred.awayElo} | Ranking FIFA: #${at?.fifaRank || 'N/A'}
- Jugador clave ${homeTeam}: ${ht?.keyPlayer || 'N/A'} (${ht?.keyPlayerPos || ''})
- Jugador clave ${awayTeam}: ${at?.keyPlayer || 'N/A'} (${at?.keyPlayerPos || ''})

Responde ÚNICAMENTE en este formato JSON (sin markdown, sin texto extra):
{
  "summary": "1 oración sobre quién es favorito y por qué",
  "reasons": ["razón 1 concreta con datos", "razón 2 concreta con datos", "razón 3 concreta con datos"],
  "suggestedScore": "${pred.topScores[0].home}-${pred.topScores[0].away}",
  "keyInsight": "1 dato táctico o estadístico importante que el usuario no debería ignorar",
  "riskAlert": "si hay algún factor que podría cambiar el resultado (lesiones conocidas, motivación, etc.) o null"
}`;

      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'x-api-key': apiKey, 'anthropic-version':'2023-06-01' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 500,
          messages: [{ role:'user', content: prompt }]
        })
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const text = aiData.content?.[0]?.text || '';
        try {
          const parsed = JSON.parse(text.replace(/```json|```/g,'').trim());
          return res.status(200).json({
            prediction: pred,
            explanation: { ...parsed, keyPlayerHome: ht?.keyPlayer, keyPlayerAway: at?.keyPlayer,
              keyPlayerHomePos: ht?.keyPlayerPos, keyPlayerAwayPos: at?.keyPlayerPos,
              suggestedScore: pred.topScores[0] ? `${pred.topScores[0].home}-${pred.topScores[0].away}` : '1-1',
            },
            source: 'ai'
          });
        } catch {/* fall through to template */}
      }
    } catch {/* fall through to template */}
  }

  // Fallback: template explanation
  const explanation = buildTemplateExplanation(homeTeam, awayTeam, pred, ht, at);
  return res.status(200).json({ prediction: pred, explanation, source: 'template' });
}
