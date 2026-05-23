import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';

// ── Sub-components ─────────────────────────────────────────

/** Barra de probabilidades Win/Draw/Loss */
function WDLBar({ homeWin, draw, awayWin, homeTeam, awayTeam }) {
  const hp = (homeWin * 100).toFixed(1);
  const dp = (draw    * 100).toFixed(1);
  const ap = (awayWin * 100).toFixed(1);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:'0.75rem', fontWeight:700 }}>
        <span style={{ color:'var(--crimson)' }}>{hp}%</span>
        <span style={{ color:'var(--text-muted)' }}>{dp}%</span>
        <span style={{ color:'#1D4ED8' }}>{ap}%</span>
      </div>
      <div style={{ height:10, borderRadius:5, overflow:'hidden', display:'flex', background:'#E5E7EB' }}>
        <div style={{ width:`${hp}%`, background:'var(--crimson)', transition:'width 0.6s ease' }}/>
        <div style={{ width:`${dp}%`, background:'#9CA3AF' }}/>
        <div style={{ width:`${ap}%`, background:'#1D4ED8', transition:'width 0.6s ease' }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, fontSize:'0.68rem', color:'var(--text-muted)' }}>
        <span>{homeTeam.split(' ').slice(-1)[0]}</span>
        <span>Empate</span>
        <span>{awayTeam.split(' ').slice(-1)[0]}</span>
      </div>
    </div>
  );
}

/** Goles esperados Goles estimados con barras */
function XGBars({ lambdaH, lambdaA, homeTeam, awayTeam }) {
  const max = Math.max(lambdaH, lambdaA, 2.0);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-on-card)', minWidth:90, textAlign:'right', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{homeTeam}</span>
        <div style={{ flex:1, height:8, borderRadius:4, background:'#F3F4F6', overflow:'hidden' }}>
          <div style={{ width:`${(lambdaH / max) * 100}%`, height:'100%', background:'var(--crimson)', borderRadius:4, transition:'width 0.6s' }}/>
        </div>
        <span style={{ fontSize:'0.8rem', fontWeight:800, color:'var(--crimson)', minWidth:30, fontFamily:'var(--font-head)' }}>{lambdaH.toFixed(2)}</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-on-card)', minWidth:90, textAlign:'right', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{awayTeam}</span>
        <div style={{ flex:1, height:8, borderRadius:4, background:'#F3F4F6', overflow:'hidden' }}>
          <div style={{ width:`${(lambdaA / max) * 100}%`, height:'100%', background:'#1D4ED8', borderRadius:4, transition:'width 0.6s' }}/>
        </div>
        <span style={{ fontSize:'0.8rem', fontWeight:800, color:'#1D4ED8', minWidth:30, fontFamily:'var(--font-head)' }}>{lambdaA.toFixed(2)}</span>
      </div>
    </div>
  );
}

/** Top marcadores más probables */
function TopScores({ scores, homeTeam, awayTeam }) {
  const maxProb = scores[0]?.prob || 1;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {scores.slice(0, 6).map((s, i) => {
        const isHomeWin = s.home > s.away;
        const isDraw    = s.home === s.away;
        const color = isHomeWin ? 'var(--crimson)' : isDraw ? '#6B7280' : '#1D4ED8';
        return (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{
              fontFamily:'var(--font-head)', fontSize:'0.9rem', letterSpacing:1,
              color: i === 0 ? color : 'var(--text-on-card)',
              minWidth:38, textAlign:'center',
              background: i === 0 ? `${color}15` : 'var(--off-white)',
              borderRadius:4, padding:'2px 6px',
              border: i === 0 ? `1px solid ${color}40` : '1px solid transparent'
            }}>
              {s.home}–{s.away}
            </div>
            <div style={{ flex:1, height:6, background:'#F3F4F6', borderRadius:3, overflow:'hidden' }}>
              <div style={{ width:`${(s.prob / maxProb) * 100}%`, height:'100%', background: i === 0 ? color : '#D1D5DB', borderRadius:3 }}/>
            </div>
            <span style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', minWidth:36, textAlign:'right' }}>{s.prob.toFixed(1)}%</span>
          </div>
        );
      })}
    </div>
  );
}

/** Medidor de confianza */
function ConfidenceMeter({ value }) {
  const color = value >= 80 ? '#16A34A' : value >= 65 ? '#D97706' : '#6B7280';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <div style={{ flex:1, height:5, background:'#F3F4F6', borderRadius:3, overflow:'hidden' }}>
        <div style={{ width:`${value}%`, height:'100%', background: color, borderRadius:3, transition:'width 0.6s' }}/>
      </div>
      <span style={{ fontSize:'0.68rem', fontWeight:800, color, minWidth:34 }}>{value}%</span>
    </div>
  );
}

/** Elo badge */
function EloBadge({ elo }) {
  const tier = elo >= 1950 ? { label:'Elite', bg:'#FEF3C7', color:'#92400E' }
             : elo >= 1870 ? { label:'Top', bg:'#DCFCE7', color:'#166534' }
             : elo >= 1780 ? { label:'Medio', bg:'#EFF6FF', color:'#1E40AF' }
             :               { label:'Base', bg:'#F3F4F6', color:'#6B7280' };
  return (
    <span style={{ background: tier.bg, color: tier.color, fontSize:'0.62rem', fontWeight:800,
      padding:'1px 6px', borderRadius:3, textTransform:'uppercase', letterSpacing:'0.5px' }}>
      {tier.label} {elo}
    </span>
  );
}

/** Tarjeta completa de predicción de un partido */
function PredictionCard({ pred }) {
  const [expanded, setExpanded] = useState(false);
  if (pred.error) return null;

  const maxProb = Math.max(pred.homeWin, pred.draw, pred.awayWin);
  const leader  = pred.homeWin === maxProb ? pred.homeTeam
                : pred.awayWin === maxProb ? pred.awayTeam
                : 'Empate';
  const leaderProb = (maxProb * 100).toFixed(0);
  const hasResult = pred.actualHomeScore !== null;

  return (
    <div className="card" style={{ padding:0, overflow:'hidden' }}>
      {/* Header */}
      <div style={{
        background:'var(--banner)', padding:'8px 14px',
        display:'flex', justifyContent:'space-between', alignItems:'center'
      }}>
        <span style={{ fontFamily:'var(--font-head)', fontSize:'0.72rem', letterSpacing:'1.5px', color:'var(--gold)' }}>
          {pred.round}
        </span>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {hasResult && (
            <span style={{ background:'#166534', color:'#BBF7D0', fontSize:'0.62rem', fontWeight:700, padding:'1px 7px', borderRadius:3, textTransform:'uppercase' }}>
              Jugado
            </span>
          )}
          <span style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.4)' }}>
            {new Date(pred.date).toLocaleDateString('es-CO', { day:'numeric', month:'short' })}
          </span>
        </div>
      </div>

      {/* Teams row */}
      <div style={{ padding:'12px 14px 8px', display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', gap:8 }}>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:'var(--font-head)', fontSize:'0.95rem', color:'var(--text-on-card)', letterSpacing:'0.5px' }}>{pred.homeTeam}</div>
          <EloBadge elo={pred.homeElo} />
        </div>
        <div style={{ textAlign:'center' }}>
          {hasResult ? (
            <span style={{ fontFamily:'var(--font-head)', fontSize:'1.4rem', color:'var(--text-on-card)', letterSpacing:2 }}>
              {pred.actualHomeScore}–{pred.actualAwayScore}
            </span>
          ) : (
            <span style={{ fontFamily:'var(--font-head)', fontSize:'0.72rem', color:'var(--text-muted)', letterSpacing:1 }}>VS</span>
          )}
        </div>
        <div>
          <div style={{ fontFamily:'var(--font-head)', fontSize:'0.95rem', color:'var(--text-on-card)', letterSpacing:'0.5px' }}>{pred.awayTeam}</div>
          <EloBadge elo={pred.awayElo} />
        </div>
      </div>

      {/* Main prediction */}
      <div style={{ padding:'0 14px 10px' }}>
        <WDLBar homeWin={pred.homeWin} draw={pred.draw} awayWin={pred.awayWin} homeTeam={pred.homeTeam} awayTeam={pred.awayTeam} />
      </div>

      {/* Predicted favorite label */}
      <div style={{ padding:'0 14px 10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>
          Favorito: <strong style={{ color:'var(--text-on-card)' }}>{leader}</strong> ({leaderProb}%)
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--crimson)', fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', padding:0 }}
        >
          {expanded ? 'Menos ▲' : 'Detalles ▼'}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ borderTop:'1px solid var(--off-white)', padding:'12px 14px', display:'flex', flexDirection:'column', gap:14 }}>
          {/* Goles estimados */}
          <div>
            <div style={{ fontSize:'0.68rem', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:8 }}>
              Goles esperados (Goles estimados)
            </div>
            <XGBars lambdaH={pred.lambdaH} lambdaA={pred.lambdaA} homeTeam={pred.homeTeam} awayTeam={pred.awayTeam} />
            <div style={{ marginTop:6, fontSize:'0.7rem', color:'var(--text-muted)', textAlign:'center' }}>
              Total esperado: <strong>{pred.totalExpectedGoals.toFixed(2)}</strong> goles
            </div>
          </div>

          {/* Top scores */}
          <div>
            <div style={{ fontSize:'0.68rem', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:8 }}>
              Marcadores más probables
            </div>
            <TopScores scores={pred.topScores} homeTeam={pred.homeTeam} awayTeam={pred.awayTeam} />
          </div>

          {/* Confidence */}
          <div>
            <div style={{ fontSize:'0.68rem', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:5 }}>
              Certeza de la predicción
            </div>
            <ConfidenceMeter value={pred.confidence} />
            <p style={{ fontSize:'0.68rem', color:'var(--text-muted)', marginTop:5, lineHeight:1.5 }}>
              Basado en distribución de Poisson bivariada con corrección Dixon-Coles y rating Elo.
              La confianza aumenta con mayor diferencia de fortaleza entre equipos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Top 10 equipos por Elo */
function EloRankingPanel({ topTeams }) {
  return (
    <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:'1.5rem' }}>
      <div style={{ background:'var(--banner)', padding:'10px 16px', display:'flex', alignItems:'center', gap:8 }}>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="var(--gold)">
          <path d="M10 1l2.39 7.26H19l-5.19 3.77 1.98 6.1L10 14.27l-5.79 3.86 1.98-6.1L1 8.26h6.61z"/>
        </svg>
        <span style={{ fontFamily:'var(--font-head)', fontSize:'0.85rem', letterSpacing:'1.5px', color:'var(--white)' }}>
          LOS 10 MEJORES EQUIPOS DEL MUNDIAL
        </span>
      </div>
      <div style={{ padding:'8px 0' }}>
        {topTeams.map((t, i) => (
          <div key={t.name} style={{
            display:'flex', alignItems:'center', gap:10, padding:'7px 16px',
            borderBottom: i < topTeams.length - 1 ? '1px solid var(--off-white)' : 'none',
            background: i < 3 ? `rgba(240,165,0,0.0${4-i})` : 'transparent'
          }}>
            <span style={{ fontFamily:'var(--font-head)', fontSize:'1rem', width:22, textAlign:'center',
              color: i===0?'#B8860B':i===1?'#708090':i===2?'#8B4513':'var(--text-muted)' }}>
              {i+1}
            </span>
            <span style={{ fontSize:'1rem' }}>{t.flag}</span>
            <span style={{ fontWeight:700, fontSize:'0.875rem', flex:1, color:'var(--text-on-card)' }}>{t.name}</span>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:'var(--font-head)', fontSize:'0.95rem', color:'var(--text-on-card)' }}>{t.elo}</div>
              <div style={{ fontSize:'0.62rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{t.confederation}</div>
            </div>
            <div style={{ width:60 }}>
              <div style={{ height:5, background:'#F3F4F6', borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', background: i<3?'var(--gold)':'var(--crimson)', borderRadius:3,
                  width:`${((t.elo - 1650) / (1978 - 1650)) * 100}%` }}/>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Explicación del modelo */
function ModelExplainer() {
  const [open, setOpen] = useState(false);
  return (
    <div className="card" style={{ marginBottom:'1.5rem' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width:'100%', background:'none', border:'none', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', padding:0 }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:6, background:'var(--off-white)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="var(--crimson)">
              <path d="M10 1a9 9 0 100 18A9 9 0 0010 1zm1 13H9v-5h2v5zm0-7H9V5h2v2z"/>
            </svg>
          </div>
          <span style={{ fontFamily:'var(--font-head)', fontSize:'1rem', letterSpacing:'0.5px', color:'var(--text-on-card)' }}>
            ¿Cómo funciona el modelo estadístico?
          </span>
        </div>
        <span style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:12 }}>
          {[
            {
              title: '1. Análisis de goles por equipo',
              text: 'Los goles en fútbol siguen una distribución de Poisson: eventos raros e independientes en un intervalo de tiempo. Para cada equipo se calcula λ (tasa de goles esperados) y se construye una matriz de probabilidades conjuntas para todos los posibles marcadores de 0-0 a 9-9.'
            },
            {
              title: '2. Ajuste para partidos cerrados',
              text: 'El modelo de Poisson puro subestima los marcadores bajos (0-0, 1-0, 0-1, 1-1). La corrección Dixon-Coles aplica un factor τ con parámetro de correlación ρ = -0.13 calibrado para fútbol, mejorando la precisión en los marcadores más frecuentes.'
            },
            {
              title: '3. Rating Elo Adaptado',
              text: 'Cada selección tiene un rating Elo derivado de sus resultados históricos, FIFA Rankings y rendimiento reciente. λ se ajusta proporcionalmente a la diferencia de fortaleza entre equipos, con regresión a la media para evitar predicciones extremas.'
            },
            {
              title: '4. Probabilidades Finales',
              text: 'Sumando las probabilidades de la matriz: P(local gana) = Σ P(i>j), P(empate) = Σ P(i=j), P(visitante gana) = Σ P(i<j). La confianza del modelo aumenta con mayor diferencia Elo entre equipos (partidos más predecibles).'
            }
          ].map((item, i) => (
            <div key={i} style={{ background:'var(--off-white)', borderRadius:6, padding:'10px 14px' }}>
              <div style={{ fontWeight:800, fontSize:'0.82rem', color:'var(--text-on-card)', marginBottom:4 }}>{item.title}</div>
              <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', lineHeight:1.6 }}>{item.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────
const GROUPS = ['Grupo A','Grupo B','Grupo C','Grupo D','Grupo E','Grupo F',
                'Grupo G','Grupo H','Grupo I','Grupo J','Grupo K','Grupo L'];
const ROUNDS_KNOCKOUT = ['Dieciseisavos','Octavos','Cuartos','Semifinal','Tercer Lugar','Final'];

export default function Estadisticas() {
  const [predictions,  setPredictions]  = useState([]);
  const [topTeams,     setTopTeams]     = useState([]);
  const [activeRound,  setActiveRound]  = useState('Grupo A');
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState('');
  const [viewMode,     setViewMode]     = useState('groups'); // 'groups' | 'knockout' | 'ranking'

  const fetchPredictions = useCallback(async (round) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/stats?round=${encodeURIComponent(round)}`);
      const data = await res.json();
      setPredictions(data.predictions || []);
      if (data.topTeams?.length) setTopTeams(data.topTeams);
    } catch {
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load top teams on mount
  useEffect(() => {
    fetch('/api/stats?round=Grupo A')
      .then(r => r.json())
      .then(d => { setTopTeams(d.topTeams || []); setPredictions(d.predictions || []); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchPredictions(activeRound);
  }, [activeRound, fetchPredictions]);

  const filtered = predictions.filter(p =>
    !search || p.homeTeam.toLowerCase().includes(search.toLowerCase()) || p.awayTeam.toLowerCase().includes(search.toLowerCase())
  );

  const roundTabs = viewMode === 'groups' ? GROUPS : ROUNDS_KNOCKOUT;

  return (
    <Layout title="Predicciones Estadísticas" description="Predicciones de partidos del Mundial 2026 basadas en Poisson, Dixon-Coles y ratings Elo.">
      <div className="container page">

        {/* Header */}
        <div className="page-header">
          <h1>Predicciones Estadísticas</h1>
          <p>Modelo Poisson bivariado · Corrección Dixon-Coles · Rating Elo · Mundial 2026</p>
        </div>

        {/* Global stats chips */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:'1.5rem' }}>
          {[
            { label:'Modelo', value:'Poisson + D-C', color:'#1D4ED8' },
            { label:'Equipos', value:'48 selecciones', color:'var(--crimson)' },
            { label:'Partidos', value:'104 totales', color:'#16A34A' },
            { label:'Confianza promedio', value:'~70%', color:'#D97706' },
          ].map((c,i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:6, padding:'6px 14px', display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:700 }}>{c.label}:</span>
              <span style={{ fontSize:'0.8rem', fontWeight:800, color:c.color }}>{c.value}</span>
            </div>
          ))}
        </div>

        {/* View mode toggle */}
        <div style={{ display:'flex', gap:6, marginBottom:'1.25rem', flexWrap:'wrap' }}>
          {[
            { id:'groups',   label:'Fase de Grupos' },
            { id:'knockout', label:'Eliminatorias' },
            { id:'ranking',  label:'Ranking Elo' },
          ].map(v => (
            <button key={v.id}
              className={`btn btn-sm${viewMode===v.id?' btn-white':' btn-ghost'}`}
              onClick={() => {
                setViewMode(v.id);
                if (v.id === 'groups')   setActiveRound('Grupo A');
                if (v.id === 'knockout') setActiveRound('Dieciseisavos');
              }}
            >{v.label}</button>
          ))}
        </div>

        {/* RANKING VIEW */}
        {viewMode === 'ranking' && (
          <>
            <ModelExplainer />
            <EloRankingPanel topTeams={topTeams.length >= 10 ? topTeams : [...topTeams, ...Array(10-topTeams.length).fill({ name:'–', flag:'', elo:0, confederation:'' })].slice(0, 10)} />
            <div className="alert alert-info">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink:0 }}>
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
              Los ratings Elo son estimaciones basadas en resultados históricos, performances recientes en Eliminatorias y Copa del Mundo. Se actualizan continuamente. Mayor Elo = mayor fortaleza relativa.
            </div>
          </>
        )}

        {/* GROUPS / KNOCKOUT VIEW */}
        {viewMode !== 'ranking' && (
          <>
            <ModelExplainer />

            {/* Round tabs */}
            <div className="tabs">
              {roundTabs.map(r => (
                <button key={r} className={`tab${activeRound===r?' active':''}`} onClick={() => setActiveRound(r)}>
                  {r.replace('Grupo ','')}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="filter-bar" style={{ marginBottom:'1.25rem' }}>
              <input type="text" className="search-input" placeholder="Buscar selección..."
                value={search} onChange={e => setSearch(e.target.value)} />
              {filtered.length > 0 && (
                <span style={{ color:'rgba(255,255,255,0.55)', fontSize:'0.8rem', fontWeight:600 }}>
                  {filtered.length} partido{filtered.length!==1?'s':''} · {activeRound}
                </span>
              )}
            </div>

            {/* Grid */}
            {loading ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'0.875rem' }}>
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="card" style={{ height:160, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ width:24, height:24, border:'3px solid var(--card-border)', borderTopColor:'var(--crimson)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3>Sin predicciones disponibles</h3>
                <p>Los partidos de esta ronda todavía no tienen equipos definidos (dependen de resultados de fases anteriores).</p>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'0.875rem' }}>
                {filtered.map(pred => (
                  <PredictionCard key={pred.matchId} pred={pred} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Footer note */}
        <div style={{ marginTop:'2rem', padding:'1rem 1.25rem', background:'rgba(0,0,0,0.2)', borderRadius:'var(--radius-sm)', fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', lineHeight:1.7 }}>
          <strong style={{ color:'rgba(255,255,255,0.6)' }}>Aviso:</strong> Las predicciones son modelos estadísticos basados en datos históricos y ratings actuales. No garantizan resultados. El fútbol tiene una componente aleatoria inherente que ningún modelo puede capturar completamente.
          Modelo: Análisis de goles por equipo con corrección Dixon-Coles (1997) · .
        </div>
      </div>
    </Layout>
  );
}
