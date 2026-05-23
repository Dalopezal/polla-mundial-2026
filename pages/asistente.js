import { useState } from 'react';
import Layout from '../components/Layout';

const TEAMS = ['México','Sudáfrica','Corea del Sur','República Checa','Canadá',
  'Bosnia y Herzegovina','Catar','Suiza','Brasil','Marruecos','Haití','Escocia',
  'Estados Unidos','Paraguay','Australia','Turquía','Alemania','Curazao',
  'Costa de Marfil','Ecuador','Países Bajos','Japón','Suecia','Túnez','Bélgica',
  'Egipto','Irán','Nueva Zelanda','España','Cabo Verde','Arabia Saudita','Uruguay',
  'Francia','Senegal','Noruega','Irak','Argentina','Argelia','Austria','Jordania',
  'Portugal','Colombia','R.D. del Congo','Uzbekistán','Inglaterra','Croacia','Ghana','Panamá'];

function BarraGanar({ homeWin, draw, awayWin, homeTeam, awayTeam }) {
  const hp = (homeWin*100).toFixed(0);
  const dp = (draw*100).toFixed(0);
  const ap = (awayWin*100).toFixed(0);
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem', fontWeight:700, marginBottom:6 }}>
        <span style={{ color:'var(--crimson)' }}>{homeTeam.split(' ').slice(-1)[0]} {hp}%</span>
        <span style={{ color:'#6B7280' }}>Empate {dp}%</span>
        <span style={{ color:'#1D4ED8' }}>{awayTeam.split(' ').slice(-1)[0]} {ap}%</span>
      </div>
      <div style={{ height:16, borderRadius:8, overflow:'hidden', display:'flex', background:'#E5E7EB' }}>
        <div style={{ width:`${hp}%`, background:'var(--crimson)', transition:'width .6s' }}/>
        <div style={{ width:`${dp}%`, background:'#9CA3AF' }}/>
        <div style={{ width:`${ap}%`, background:'#1D4ED8', transition:'width .6s' }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:5, fontSize:'0.72rem', color:'var(--text-muted)' }}>
        <span>Gana {homeTeam.split(' ')[0]}</span>
        <span>Empate</span>
        <span>Gana {awayTeam.split(' ')[0]}</span>
      </div>
    </div>
  );
}

function MarcadoresProbables({ scores }) {
  const max = scores[0]?.prob || 1;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {scores.slice(0,6).map((s,i) => {
        const clr = s.home>s.away?'var(--crimson)':s.home===s.away?'#6B7280':'#1D4ED8';
        return (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ fontFamily:'var(--font-head)', fontSize:'1rem', minWidth:44, textAlign:'center',
              background:i===0?`${clr}18`:'var(--off-white)', borderRadius:5, padding:'3px 8px',
              color:i===0?clr:'var(--text-on-card)', border:`1px solid ${i===0?`${clr}40`:'transparent'}`,
              fontWeight:i===0?800:600 }}>
              {s.home}–{s.away}
            </div>
            {i===0 && <span style={{ fontSize:'0.7rem', background:'var(--crimson)', color:'white', borderRadius:3, padding:'1px 6px', fontWeight:700 }}>MÁS PROBABLE</span>}
            <div style={{ flex:1, height:8, background:'#F3F4F6', borderRadius:4, overflow:'hidden' }}>
              <div style={{ width:`${(s.prob/max)*100}%`, height:'100%', background:i===0?clr:'#D1D5DB', borderRadius:4 }}/>
            </div>
            <span style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', minWidth:40, textAlign:'right' }}>
              {s.prob.toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

function BarraGoles({ val, max, label, color }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <span style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--text-on-card)', minWidth:100, textAlign:'right', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</span>
      <div style={{ flex:1, height:10, background:'#F3F4F6', borderRadius:5, overflow:'hidden' }}>
        <div style={{ width:`${(val/max)*100}%`, height:'100%', background:color, borderRadius:5 }}/>
      </div>
      <span style={{ fontFamily:'var(--font-head)', fontSize:'1.1rem', color, minWidth:32 }}>{val.toFixed(1)}</span>
    </div>
  );
}

export default function Asistente() {
  const [home, setHome] = useState('Colombia');
  const [away, setAway] = useState('Portugal');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analizar = async () => {
    if (home === away) return;
    setLoading(true); setResult(null);
    try {
      const r = await fetch('/api/ai-assistant', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ homeTeam:home, awayTeam:away }) });
      setResult(await r.json());
    } catch { setResult({ error:true }); }
    finally { setLoading(false); }
  };

  const Sel = ({ val, set }) => (
    <select value={val} onChange={e=>set(e.target.value)} style={{ flex:1, background:'rgba(255,255,255,0.1)', border:'1.5px solid rgba(255,255,255,0.2)', borderRadius:'var(--radius-sm)', color:'white', fontFamily:'var(--font-body)', fontSize:'0.9rem', padding:'11px 12px', outline:'none' }}>
      {TEAMS.map(t => <option key={t} value={t} style={{ background:'#1A1A26', color:'white' }}>{t}</option>)}
    </select>
  );

  const pred = result?.prediction;
  const exp  = result?.explanation;
  const maxGoles = pred ? Math.max(pred.lambdaH, pred.lambdaA, 1.5) : 2;

  return (
    <Layout title="Predicción de Partidos" description="Predice el resultado de cualquier partido del Mundial 2026 con nuestro sistema de análisis.">
      <div className="container page">
        <div className="page-header">
          <h1>Predicción de Partidos</h1>
          <p>Selecciona dos equipos y te decimos quién tiene más probabilidad de ganar</p>
        </div>

        {/* Selector de equipos */}
        <div style={{ background:'var(--banner)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'var(--radius)', padding:'1.5rem', marginBottom:'1.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <Sel val={home} set={setHome} />
            <div style={{ textAlign:'center', padding:'0 4px' }}>
              <div style={{ fontFamily:'var(--font-head)', fontSize:'1.5rem', color:'rgba(255,255,255,0.3)', letterSpacing:'2px' }}>VS</div>
              <div style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.5px', marginTop:2 }}>Mundial 2026</div>
            </div>
            <Sel val={away} set={setAway} />
            <button onClick={analizar} disabled={loading||home===away} className="btn btn-gold" style={{ flexShrink:0, minWidth:150, padding:'11px 20px' }}>
              {loading ? 'Analizando...' : 'Analizar partido'}
            </button>
          </div>
        </div>

        {/* Resultados */}
        {pred && exp && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>

            {/* Probabilidades de ganar */}
            <div className="card">
              <div className="card-header"><h3 className="card-title">¿Quién tiene más chances?</h3></div>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <BarraGanar homeWin={pred.homeWin} draw={pred.draw} awayWin={pred.awayWin} homeTeam={home} awayTeam={away} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[
                    { lbl:'Goles estimados '+home.split(' ')[0], val:pred.lambdaH.toFixed(1), clr:'var(--crimson)' },
                    { lbl:'Goles estimados '+away.split(' ')[0], val:pred.lambdaA.toFixed(1), clr:'#1D4ED8' },
                    { lbl:'Total de goles esperados', val:pred.totalExpectedGoals.toFixed(1), clr:'var(--text-on-card)' },
                    { lbl:'Certeza de la predicción', val:`${pred.confidence.toFixed(0)}%`, clr:'#16A34A' },
                  ].map((x,i) => (
                    <div key={i} style={{ background:'var(--off-white)', borderRadius:6, padding:'10px 12px' }}>
                      <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3, lineHeight:1.3 }}>{x.lbl}</div>
                      <div style={{ fontFamily:'var(--font-head)', fontSize:'1.3rem', color:x.clr }}>{x.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Marcadores más probables */}
            <div className="card">
              <div className="card-header"><h3 className="card-title">Resultados más probables</h3></div>
              <MarcadoresProbables scores={pred.topScores} />
              <div style={{ marginTop:14, padding:'10px 12px', background:'var(--off-white)', borderRadius:6, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Resultado sugerido para tu pronóstico</span>
                <span style={{ fontFamily:'var(--font-head)', fontSize:'1.6rem', color:'var(--crimson)' }}>
                  {pred.topScores[0]?.home}–{pred.topScores[0]?.away}
                </span>
              </div>
            </div>

            {/* Goles por equipo */}
            <div className="card">
              <div className="card-header"><h3 className="card-title">Estimación de goles por equipo</h3></div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <BarraGoles val={pred.lambdaH} max={maxGoles} label={home} color="var(--crimson)" />
                <BarraGoles val={pred.lambdaA} max={maxGoles} label={away} color="#1D4ED8" />
                <div style={{ marginTop:6, padding:'8px 12px', background:'var(--off-white)', borderRadius:6, fontSize:'0.78rem', color:'var(--text-muted)' }}>
                  Basado en el historial reciente de cada selección y su fortaleza actual
                </div>
              </div>
            </div>

            {/* Jugadores clave + análisis */}
            <div className="card">
              <div className="card-header"><h3 className="card-title">Jugadores clave</h3></div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {exp.keyPlayerHome && (
                  <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px', background:'rgba(208,20,60,0.06)', border:'1px solid rgba(208,20,60,0.15)', borderRadius:8 }}>
                    <div style={{ width:42, height:42, background:'linear-gradient(135deg,var(--crimson),#7C3AED)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-head)', fontSize:'1.1rem', color:'white', flexShrink:0 }}>{exp.keyPlayerHome[0]}</div>
                    <div>
                      <div style={{ fontWeight:800, fontSize:'0.9rem', color:'var(--text-on-card)' }}>{exp.keyPlayerHome}</div>
                      <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{home} · {exp.keyPlayerHomePos}</div>
                    </div>
                    <div style={{ marginLeft:'auto', background:'var(--crimson)', color:'white', fontSize:'0.68rem', fontWeight:700, padding:'2px 8px', borderRadius:3, flexShrink:0 }}>LOCAL</div>
                  </div>
                )}
                {exp.keyPlayerAway && (
                  <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px', background:'rgba(29,78,216,0.06)', border:'1px solid rgba(29,78,216,0.15)', borderRadius:8 }}>
                    <div style={{ width:42, height:42, background:'linear-gradient(135deg,#1D4ED8,#7C3AED)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-head)', fontSize:'1.1rem', color:'white', flexShrink:0 }}>{exp.keyPlayerAway[0]}</div>
                    <div>
                      <div style={{ fontWeight:800, fontSize:'0.9rem', color:'var(--text-on-card)' }}>{exp.keyPlayerAway}</div>
                      <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{away} · {exp.keyPlayerAwayPos}</div>
                    </div>
                    <div style={{ marginLeft:'auto', background:'#1D4ED8', color:'white', fontSize:'0.68rem', fontWeight:700, padding:'2px 8px', borderRadius:3, flexShrink:0 }}>VISITANTE</div>
                  </div>
                )}
              </div>
            </div>

            {/* Análisis completo */}
            <div className="card" style={{ gridColumn:'1/-1' }}>
              <div className="card-header"><h3 className="card-title">Análisis del partido</h3></div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ padding:'12px 14px', background:'rgba(240,165,0,0.08)', border:'1px solid rgba(240,165,0,0.2)', borderRadius:8, fontSize:'0.9rem', lineHeight:1.7, color:'var(--text-on-card)' }}>
                  <strong style={{ color:'var(--gold)' }}>Conclusión: </strong>{exp.summary}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:8 }}>
                  {exp.reasons?.map((r,i) => (
                    <div key={i} style={{ display:'flex', gap:8, fontSize:'0.82rem', color:'var(--text-on-card)', padding:'10px 12px', background:'var(--off-white)', borderRadius:6, lineHeight:1.5 }}>
                      <span style={{ color:'var(--crimson)', fontWeight:800, flexShrink:0 }}>•</span>{r}
                    </div>
                  ))}
                </div>

                {exp.keyInsight && (
                  <div style={{ padding:'10px 14px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:6, fontSize:'0.83rem', color:'#1E40AF', lineHeight:1.6 }}>
                    <strong>Dato importante: </strong>{exp.keyInsight}
                  </div>
                )}
                {exp.riskAlert && exp.riskAlert !== 'null' && (
                  <div style={{ padding:'10px 14px', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:6, fontSize:'0.83rem', color:'#92400E', lineHeight:1.6 }}>
                    <strong>Ten en cuenta: </strong>{exp.riskAlert}
                  </div>
                )}

                {/* Cómo funciona - en lenguaje simple */}
                <details style={{ marginTop:4 }}>
                  <summary style={{ cursor:'pointer', fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:600, padding:'8px 0', userSelect:'none' }}>
                    ¿Cómo calculamos esta predicción? ▾
                  </summary>
                  <div style={{ marginTop:8, display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:8 }}>
                    {[
                      { title:'Historial de goles', desc:'Analizamos cuántos goles suelen meter y recibir cada equipo en promedio por partido.' },
                      { title:'Fortaleza del equipo', desc:`${home} tiene un nivel de ${pred.homeElo} puntos y ${away} tiene ${pred.awayElo}. Mayor nivel = más posibilidad de ganar.` },
                      { title:'Certeza de la predicción', desc:`${pred.confidence.toFixed(0)}%. Cuando hay mucha diferencia entre los equipos, la predicción es más segura.` },
                      { title:'Goles esperados', desc:`${home} estimamos ${pred.lambdaH.toFixed(1)} goles y ${away} estimamos ${pred.lambdaA.toFixed(1)} goles en 90 minutos.` },
                    ].map((m,i) => (
                      <div key={i} style={{ background:'var(--off-white)', borderRadius:7, padding:'12px 14px' }}>
                        <div style={{ fontWeight:800, fontSize:'0.78rem', color:'var(--text-on-card)', marginBottom:4 }}>{m.title}</div>
                        <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', lineHeight:1.5 }}>{m.desc}</div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          </div>
        )}

        {result?.error && (
          <div style={{ padding:'1.5rem', background:'rgba(220,38,38,0.1)', border:'1px solid rgba(220,38,38,0.3)', borderRadius:'var(--radius)', color:'#FCA5A5' }}>
            Error al obtener la predicción. Intenta de nuevo.
          </div>
        )}

        {!result && !loading && (
          <div className="empty-state">
            <div className="empty-icon" style={{ fontSize:'2rem' }}>🤖</div>
            <h3>Selecciona dos equipos</h3>
            <p>Te mostraremos quién tiene más probabilidad de ganar, el resultado más probable y el jugador clave de cada equipo.</p>
          </div>
        )}

        {loading && (
          <div style={{ textAlign:'center', padding:'4rem', color:'rgba(255,255,255,0.5)' }}>
            <div style={{ width:36, height:36, border:'3px solid rgba(255,255,255,0.1)', borderTopColor:'var(--crimson)', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 1rem' }}/>
            <p>Analizando el partido...</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        <div style={{ marginTop:'2rem', padding:'0.875rem 1.25rem', background:'rgba(0,0,0,0.2)', borderRadius:'var(--radius-sm)', fontSize:'0.75rem', color:'rgba(255,255,255,0.35)', lineHeight:1.7 }}>
          Las predicciones son estimaciones basadas en estadísticas históricas. El fútbol siempre puede sorprender — úsalas como guía, no como certeza absoluta.
        </div>
      </div>
    </Layout>
  );
}
