import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from './_app';
import Navbar from '../components/Navbar';

function ColombiaHero({ user }) {
  return (
    <div style={{ position:'relative', overflow:'hidden', background:'linear-gradient(135deg,#FCD116 0%,#003087 40%,#CE1126 100%)', minHeight:520, display:'flex', alignItems:'center' }}>
      <div style={{ position:'absolute', inset:0 }}>
        <div style={{ position:'absolute', top:'-20%', left:'-5%', width:'55%', height:'140%', background:'rgba(0,48,135,0.65)', transform:'rotate(-14deg)' }}/>
        <div style={{ position:'absolute', top:'-20%', left:'18%', width:'38%', height:'140%', background:'rgba(206,17,38,0.5)', transform:'rotate(-14deg)' }}/>
        {[...Array(18)].map((_,i) => (
          <div key={i} style={{ position:'absolute', left:`${(i*19)%95}%`, top:`${10+(i*27)%75}%`, width:3, height:3, borderRadius:'50%', background:'rgba(255,255,255,0.35)', animation:`tw ${2+i*0.25}s ease-in-out infinite` }}/>
        ))}
        <div style={{ position:'absolute', right:'3%', top:'50%', transform:'translateY(-50%)', width:260, height:260, borderRadius:'50%', border:'3px solid rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:140, opacity:0.15 }}>⚽</div>
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:8, display:'flex' }}>
          <div style={{ flex:2, background:'#FCD116' }}/><div style={{ flex:1, background:'#003087' }}/><div style={{ flex:1, background:'#CE1126' }}/>
        </div>
      </div>
      <div className="container" style={{ position:'relative', zIndex:2, paddingTop:'3rem', paddingBottom:'3.5rem', width:'100%' }}>
        <div style={{ maxWidth:660 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(0,0,0,0.35)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:4, padding:'5px 14px', marginBottom:'1.5rem' }}>
            <span style={{ fontFamily:'var(--font-head)', fontSize:'0.78rem', letterSpacing:'2px', color:'#FCD116' }}>🇨🇴 MUNDIAL 2026 · USA · CANADÁ · MÉXICO</span>
          </div>
          <h1 style={{ fontFamily:'var(--font-head)', fontSize:'clamp(2.8rem,7vw,5.5rem)', lineHeight:0.95, letterSpacing:'2px', color:'white', marginBottom:'1rem', textShadow:'0 2px 20px rgba(0,0,0,0.5)' }}>
            POLLA<br/>
            <span style={{ color:'#FCD116' }}>MUNDIALISTA</span><br/>
            <span style={{ fontSize:'40%', letterSpacing:'4px', color:'rgba(255,255,255,0.65)' }}>CON INTELIGENCIA ARTIFICIAL</span>
          </h1>
          <p style={{ fontSize:'1rem', color:'rgba(255,255,255,0.85)', marginBottom:'2rem', lineHeight:1.7, fontWeight:500, maxWidth:500 }}>
            Predice marcadores, recibe asesoría con IA, gana logros y compite con tus amigos. Colombia está en el Grupo K junto a Portugal.
          </p>
          <div style={{ display:'flex', gap:'0.875rem', flexWrap:'wrap' }}>
            {user ? (
              <><Link href="/dashboard" className="btn btn-gold btn-lg">Mis Pronósticos</Link><Link href="/asistente" className="btn btn-white btn-lg">Asistente IA</Link></>
            ) : (
              <><Link href="/register" className="btn btn-gold btn-lg">Unirse Gratis</Link><Link href="/asistente" className="btn btn-white btn-lg">Predicciones</Link></>
            )}
          </div>
          <div style={{ display:'flex', gap:8, marginTop:'1.75rem', flexWrap:'wrap' }}>
            {['⚽ 48 Selecciones','📅 104 Partidos','🤖 IA Predictiva','🇨🇴 Colombia Grupo K'].map((s,i) => (
              <div key={i} style={{ background:'rgba(0,0,0,0.32)', backdropFilter:'blur(6px)', border:'1px solid rgba(255,255,255,0.14)', borderRadius:4, padding:'4px 11px', fontFamily:'var(--font-head)', fontSize:'0.7rem', letterSpacing:'1px', color:'rgba(255,255,255,0.82)' }}>{s}</div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes tw{0%,100%{opacity:.3}50%{opacity:1}}`}</style>
    </div>
  );
}

function AIWidget() {
  const [home, setHome] = useState('Colombia');
  const [away, setAway] = useState('Portugal');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const TEAMS = ['México','Sudáfrica','Corea del Sur','República Checa','Canadá','Bosnia y Herzegovina','Catar','Suiza','Brasil','Marruecos','Haití','Escocia','Estados Unidos','Paraguay','Australia','Turquía','Alemania','Curazao','Costa de Marfil','Ecuador','Países Bajos','Japón','Suecia','Túnez','Bélgica','Egipto','Irán','Nueva Zelanda','España','Cabo Verde','Arabia Saudita','Uruguay','Francia','Senegal','Noruega','Irak','Argentina','Argelia','Austria','Jordania','Portugal','Colombia','R.D. del Congo','Uzbekistán','Inglaterra','Croacia','Ghana','Panamá'];

  const analyze = async () => {
    if (home === away) return;
    setLoading(true); setResult(null);
    try {
      const r = await fetch('/api/ai-assistant', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ homeTeam:home, awayTeam:away }) });
      setResult(await r.json());
    } catch { setResult({ error:true }); }
    finally { setLoading(false); }
  };

  const Sel = ({ val, set }) => (
    <select value={val} onChange={e=>set(e.target.value)} style={{ flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:6, color:'white', fontFamily:'var(--font-body)', fontSize:'0.85rem', padding:'9px 10px', outline:'none' }}>
      {TEAMS.map(t => <option key={t} value={t} style={{ background:'#1a1a26' }}>{t}</option>)}
    </select>
  );

  const pred = result?.prediction;
  const exp  = result?.explanation;

  return (
    <div style={{ background:'var(--banner)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'var(--radius)', overflow:'hidden' }}>
      <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:36, height:36, background:'linear-gradient(135deg,var(--crimson),#7C3AED)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem' }}>🤖</div>
        <div>
          <div style={{ fontFamily:'var(--font-head)', fontSize:'1.05rem', letterSpacing:'1.5px', color:'white' }}>ASISTENTE DE PREDICCIÓN IA</div>
          <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.4)', marginTop:1 }}>Sistema de predicción de partidos</div>
        </div>
      </div>
      <div style={{ padding:'1.25rem 1.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1rem' }}>
          <Sel val={home} set={setHome} />
          <span style={{ fontFamily:'var(--font-head)', fontSize:'1rem', color:'rgba(255,255,255,0.35)', flexShrink:0 }}>VS</span>
          <Sel val={away} set={setAway} />
          <button onClick={analyze} disabled={loading||home===away} className="btn btn-primary btn-sm" style={{ flexShrink:0 }}>
            {loading ? '···' : 'Analizar'}
          </button>
        </div>

        {pred && exp && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {/* Prob bar */}
            <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:8, padding:'0.875rem' }}>
              <div style={{ display:'flex', gap:6, marginBottom:8 }}>
                {[{pct:pred.homeWin,lbl:home.split(' ')[0],clr:'var(--crimson)',bg:'rgba(208,20,60,0.2)'},{pct:pred.draw,lbl:'Empate',clr:'#9CA3AF',bg:'rgba(255,255,255,0.06)'},{pct:pred.awayWin,lbl:away.split(' ')[0],clr:'#60A5FA',bg:'rgba(29,78,216,0.2)'}].map((x,i) => (
                  <div key={i} style={{ flex:1, textAlign:'center', background:x.bg, borderRadius:6, padding:'7px 4px' }}>
                    <div style={{ fontFamily:'var(--font-head)', fontSize:'1.3rem', color:x.clr }}>{(x.pct*100).toFixed(0)}%</div>
                    <div style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.45)', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{x.lbl}</div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign:'center', fontSize:'0.8rem', color:'rgba(255,255,255,0.6)' }}>
                Resultado sugerido: <strong style={{ fontFamily:'var(--font-head)', fontSize:'1.1rem', color:'var(--gold)' }}>{exp.suggestedScore}</strong>
                <span style={{ marginLeft:12, color:'rgba(255,255,255,0.4)' }}>xG: {pred.totalExpectedGoals} goles</span>
              </div>
            </div>

            {/* Key players */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {exp.keyPlayerHome && (
                <div style={{ background:'rgba(208,20,60,0.12)', border:'1px solid rgba(208,20,60,0.25)', borderRadius:7, padding:'0.75rem' }}>
                  <div style={{ fontSize:'0.6rem', textTransform:'uppercase', letterSpacing:'0.8px', color:'rgba(255,255,255,0.4)', marginBottom:3 }}>Jugador clave</div>
                  <div style={{ fontWeight:700, fontSize:'0.82rem', color:'white' }}>{exp.keyPlayerHome}</div>
                  <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.45)', marginTop:1 }}>{home.split(' ')[0]} · {exp.keyPlayerHomePos}</div>
                </div>
              )}
              {exp.keyPlayerAway && (
                <div style={{ background:'rgba(29,78,216,0.12)', border:'1px solid rgba(29,78,216,0.25)', borderRadius:7, padding:'0.75rem' }}>
                  <div style={{ fontSize:'0.6rem', textTransform:'uppercase', letterSpacing:'0.8px', color:'rgba(255,255,255,0.4)', marginBottom:3 }}>Jugador clave</div>
                  <div style={{ fontWeight:700, fontSize:'0.82rem', color:'white' }}>{exp.keyPlayerAway}</div>
                  <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.45)', marginTop:1 }}>{away.split(' ')[0]} · {exp.keyPlayerAwayPos}</div>
                </div>
              )}
            </div>

            {/* AI summary */}
            <div style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.72)', lineHeight:1.6, padding:'8px 12px', background:'rgba(255,255,255,0.04)', borderRadius:6, borderLeft:'3px solid var(--gold)' }}>
              <strong style={{ color:'var(--gold)' }}>IA: </strong>{exp.summary}
            </div>

            {exp.reasons?.slice(0,2).map((r,i) => (
              <div key={i} style={{ display:'flex', gap:6, fontSize:'0.75rem', color:'rgba(255,255,255,0.55)' }}>
                <span style={{ color:'var(--gold)', flexShrink:0 }}>•</span>{r}
              </div>
            ))}
          </div>
        )}

        {!result && !loading && (
          <div style={{ textAlign:'center', padding:'1.5rem', color:'rgba(255,255,255,0.25)', fontSize:'0.85rem' }}>
            Selecciona dos equipos y analiza el partido
          </div>
        )}
        {result?.error && <div style={{ color:'#FCA5A5', fontSize:'0.82rem', padding:'0.75rem', background:'rgba(220,38,38,0.1)', borderRadius:6 }}>Error al obtener predicción.</div>}
      </div>
      <div style={{ padding:'0.75rem 1.5rem', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.25)' }}>Predicción estadística · No garantiza resultados</span>
        <Link href="/asistente" style={{ fontSize:'0.72rem', color:'var(--gold)', fontWeight:700, textDecoration:'none', textTransform:'uppercase', letterSpacing:'0.5px' }}>Análisis completo →</Link>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  return (
    <>
      <Head>
        <title>Polla Mundialista 2026 – IA, Predicciones y Competencia</title>
        <meta name="description" content="La polla mundialista más inteligente del Mundial 2026. Predice 104 partidos, recibe asesoría de IA, gana logros y compite con amigos. Colombia en el Grupo K." />
        <meta name="keywords" content="polla mundialista 2026, mundial 2026, predicciones fútbol IA, fixture 2026, Colombia mundial 2026" />
        <meta property="og:title" content="Polla Mundialista 2026 con IA" />
        <meta property="og:description" content="Predice, analiza y compite en el Mundial 2026 USA·Canadá·México." />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
      </Head>
      <Navbar />
      <ColombiaHero user={user} />
      <div className="container page" style={{ paddingTop:'2.5rem' }}>
        {/* AI Widget - main feature */}
        <div style={{ marginBottom:'2.5rem' }}>
          <div style={{ marginBottom:'1rem', display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
            <div>
              <h2 style={{ fontFamily:'var(--font-head)', fontSize:'1.5rem', letterSpacing:'1px', color:'white' }}>Asistente de Predicción</h2>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.82rem', marginTop:3 }}>Análisis estadístico para cualquier partido del torneo</p>
            </div>
            <Link href="/asistente" className="btn btn-ghost btn-sm">Ver análisis completo</Link>
          </div>
          <AIWidget />
        </div>

        {/* Feature cards */}
        <div style={{ marginBottom:'2.5rem' }}>
          <h2 style={{ fontFamily:'var(--font-head)', fontSize:'1.4rem', letterSpacing:'1px', color:'white', marginBottom:'1rem' }}>Todo lo que necesitas</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'0.875rem' }}>
            {[
              { icon:'🤖', title:'Asistente IA',       desc:'Análisis análisis estadístico para cada partido con explicación táctica.',            link:'/asistente',  btn:'Analizar' },
              { icon:'🏆', title:'Fixture Oficial',     desc:'104 partidos del Mundial 2026 con fechas y sedes confirmadas.',               link:'/fixture',    btn:'Ver Fixture' },
              { icon:'📊', title:'Tabla en Vivo',       desc:'Clasificación con niveles, rachas y personalidad de cada jugador.',           link:'/leaderboard',btn:'Ver Tabla' },
              { icon:'🎮', title:'Simulador',           desc:'Simula el torneo completo con 500 iteraciones Monte Carlo.',                  link:'/simulador',  btn:'Simular' },
              { icon:'🧠', title:'IQ Futbolístico',     desc:'Mide tu inteligencia predictiva: analítico, arriesgado o conservador.',      link:'/iq',         btn:'Mi IQ' },
              { icon:'📈', title:'Dashboard',           desc:'Analítica condensada de todos los participantes de tu polla.',               link:'/analytics',  btn:'Ver datos' },
            ].map((f,i) => (
              <div key={i} className="card" style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                <div style={{ fontSize:'1.6rem' }}>{f.icon}</div>
                <div>
                  <h3 style={{ fontFamily:'var(--font-head)', fontSize:'1rem', letterSpacing:'0.5px', marginBottom:4, color:'var(--text-on-card)' }}>{f.title}</h3>
                  <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', lineHeight:1.6 }}>{f.desc}</p>
                </div>
                <Link href={f.link} className="btn btn-primary btn-sm" style={{ alignSelf:'flex-start', marginTop:'auto' }}>{f.btn}</Link>
              </div>
            ))}
          </div>
        </div>

        {/* Scoring */}
        <div className="card" style={{ marginBottom:'2rem' }}>
          <div className="card-header"><h2 className="card-title">Sistema de Puntuación</h2></div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'0.875rem' }}>
            {[
              { pts:3, bg:'#DCFCE7', tc:'#166534', bc:'#BBF7D0', label:'Marcador Exacto', desc:'Acertaste ambos goles exactamente' },
              { pts:2, bg:'#FEF3C7', tc:'#92400E', bc:'#FDE68A', label:'Total de Goles', desc:'La suma total de goles es correcta' },
              { pts:1, bg:'#EDE9FE', tc:'#5B21B6', bc:'#DDD6FE', label:'Resultado Parcial', desc:'Acertaste los goles de un equipo' },
            ].map(s => (
              <div key={s.pts} style={{ background:s.bg, border:`1px solid ${s.bc}`, borderRadius:8, padding:'1rem', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ background:'white', border:`2px solid ${s.bc}`, borderRadius:6, padding:'6px 10px', fontFamily:'var(--font-head)', fontSize:'1.3rem', color:s.tc, flexShrink:0 }}>{s.pts}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:'0.82rem', color:s.tc }}>{s.label}</div>
                  <div style={{ fontSize:'0.74rem', color:s.tc, opacity:0.75 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
