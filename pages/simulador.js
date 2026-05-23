import { useState } from 'react';
import Layout from '../components/Layout';

export default function Simulador() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const simular = async () => {
    setLoading(true); setResult(null);
    try {
      const r = await fetch('/api/simulator', { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' });
      setResult(await r.json());
    } catch { setResult({ error:true }); }
    finally { setLoading(false); }
  };

  const Barra = ({ team, pct, rank, color='var(--crimson)', maxPct=100 }) => (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid var(--off-white)' }}>
      <span style={{ fontFamily:'var(--font-head)', fontSize:'0.9rem', color:rank<=3?['#B8860B','#708090','#8B4513'][rank-1]:'var(--text-muted)', width:22, textAlign:'center' }}>
        {rank<=3?['🥇','🥈','🥉'][rank-1]:rank}
      </span>
      <span style={{ fontWeight:700, fontSize:'0.875rem', flex:1, color:'var(--text-on-card)' }}>{team}</span>
      <div style={{ width:120, height:8, background:'#F3F4F6', borderRadius:4, overflow:'hidden' }}>
        <div style={{ width:`${(pct/maxPct)*100}%`, height:'100%', background:color, borderRadius:4, transition:'width .8s ease' }}/>
      </div>
      <span style={{ fontFamily:'var(--font-head)', fontSize:'1.1rem', color, minWidth:48, textAlign:'right' }}>{pct}%</span>
    </div>
  );

  return (
    <Layout title="Simulador del Mundial" description="Simula quién ganaría el Mundial 2026 según la fortaleza actual de cada equipo.">
      <div className="container page">
        <div className="page-header">
          <h1>Simulador del Mundial</h1>
          <p>¿Quién ganaría si el Mundial se jugara hoy? Basado en la fortaleza actual de cada selección</p>
        </div>

        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div className="card" style={{ maxWidth:520, margin:'0 auto', padding:'2.5rem' }}>
            <div style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>🏆</div>
            <h2 style={{ fontFamily:'var(--font-head)', fontSize:'1.6rem', letterSpacing:'1px', color:'var(--text-on-card)', marginBottom:'0.875rem' }}>
              Simula el torneo completo
            </h2>
            <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', marginBottom:'0.5rem', lineHeight:1.7 }}>
              El sistema juega todos los partidos — desde la fase de grupos hasta la final — usando la fortaleza real de cada selección.
            </p>
            <p style={{ color:'var(--text-muted)', fontSize:'0.8rem', marginBottom:'2rem', lineHeight:1.6 }}>
              El resultado puede variar cada vez que simulas, igual que en la vida real donde cualquier equipo puede tener un día bueno o malo.
            </p>
            <button onClick={simular} disabled={loading} className="btn btn-gold btn-lg" style={{ width:'100%' }}>
              {loading ? 'Simulando torneo...' : 'Simular Mundial 2026'}
            </button>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign:'center', padding:'3rem', color:'rgba(255,255,255,0.5)' }}>
            <div style={{ width:48, height:48, border:'4px solid rgba(255,255,255,0.1)', borderTopColor:'var(--gold)', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 1.25rem' }}/>
            <p style={{ fontSize:'1rem', fontWeight:600 }}>Jugando todos los partidos...</p>
            <p style={{ fontSize:'0.78rem', marginTop:6, color:'rgba(255,255,255,0.35)' }}>Grupos → Dieciseisavos → Octavos → Cuartos → Semis → Final</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {result && !result.error && (
          <div>
            <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:6, padding:'6px 16px', fontSize:'0.8rem', color:'rgba(255,255,255,0.65)' }}>
                Resultado basado en {result.iterations} simulaciones del torneo completo
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:'1rem' }}>
              <div className="card">
                <div className="card-header"><h3 className="card-title">🏆 Probabilidad de ser Campeón</h3></div>
                {result.champion.slice(0,10).map((x,i) => (
                  <Barra key={x.team} team={x.team} pct={x.pct} rank={i+1} color='var(--gold)' maxPct={result.champion[0]?.pct||100} />
                ))}
                <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:12 }}>
                  Porcentaje de veces que cada selección ganó el torneo en la simulación
                </p>
              </div>
              <div className="card">
                <div className="card-header"><h3 className="card-title">🥈 Probabilidad de llegar a la Final</h3></div>
                {result.finalist.slice(0,10).map((x,i) => (
                  <Barra key={x.team} team={x.team} pct={x.pct} rank={i+1} color='var(--crimson)' maxPct={result.finalist[0]?.pct||100} />
                ))}
              </div>
              <div className="card">
                <div className="card-header"><h3 className="card-title">🥉 Probabilidad de llegar a Semifinales</h3></div>
                {result.semifinal.slice(0,10).map((x,i) => (
                  <Barra key={x.team} team={x.team} pct={x.pct} rank={i+1} color='#7C3AED' maxPct={result.semifinal[0]?.pct||100} />
                ))}
              </div>
            </div>
          </div>
        )}

        {result?.error && (
          <div style={{ padding:'1.5rem', background:'rgba(220,38,38,0.1)', border:'1px solid rgba(220,38,38,0.3)', borderRadius:'var(--radius)', color:'#FCA5A5', textAlign:'center' }}>
            Error al simular. Intenta de nuevo.
          </div>
        )}
      </div>
    </Layout>
  );
}
