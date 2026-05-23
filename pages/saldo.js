import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from './_app';
import { formatCOP, METODOS_PAGO, IA_BET } from '../lib/payments';

function calcularTotal(base, metodoId) {
  const m = METODOS_PAGO[metodoId];
  if (!m) return { base, comision:0, total:base };
  const c = base * m.comision_pct + (m.comision_fija||0);
  const iva = c * m.comision_iva;
  return { base, comision: Math.ceil(c+iva), total: base + Math.ceil(c+iva) };
}

function ResultBadge({ resultado }) {
  const map = {
    ganada:   { bg:'#DCFCE7', color:'#166534', label:'Ganada ✓' },
    perdida:  { bg:'#FEF2F2', color:'#991B1B', label:'Perdida ✗' },
    empate:   { bg:'#FEF3C7', color:'#92400E', label:'Empate' },
    pendiente:{ bg:'#F3F4F6', color:'#6B7280', label:'Pendiente' },
  };
  const s = map[resultado] || map.pendiente;
  return <span style={{ background:s.bg, color:s.color, fontSize:'0.72rem', fontWeight:700, padding:'2px 10px', borderRadius:4 }}>{s.label}</span>;
}

function ApostaBet({ bet, onPlace, loading, user }) {
  const [monto, setMonto] = useState('');
  const m = Math.min(parseInt(monto)||0, user?.saldoIA||0);

  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
      <input type="number" min={IA_BET.minimo} max={user?.saldoIA||0} placeholder="Monto apuesta"
        value={monto} onChange={e=>setMonto(e.target.value)}
        style={{ width:140, background:'var(--off-white)', border:'1.5px solid var(--card-border)', borderRadius:6, padding:'6px 10px', fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none', color:'var(--text-on-card)' }} />
      <button onClick={() => { onPlace(bet.matchId, parseInt(monto)); setMonto(''); }}
        disabled={!monto || parseInt(monto) < IA_BET.minimo || parseInt(monto) > (user?.saldoIA||0) || loading}
        className="btn btn-primary btn-sm">
        Apostar vs IA
      </button>
      <span style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>Mín {formatCOP(IA_BET.minimo)}</span>
    </div>
  );
}

export default function Saldo() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [balData,    setBalData]   = useState(null);
  const [matches,    setMatches]   = useState([]);
  const [bets,       setBets]      = useState([]);
  const [tab,        setTab]       = useState('saldo');
  const [recargaMonto, setRecargaMonto] = useState('20000');
  const [recargaMetodo,setRecargaMetodo] = useState('wompi_pse');
  const [saving,     setSaving]    = useState(false);
  const [msg,        setMsg]       = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user?.estado !== 'activo') router.push('/pendiente');
  }, [user, loading, router]);

  const loadData = async () => {
    const [balRes, betRes, mRes] = await Promise.all([
      fetch('/api/balance'), fetch('/api/ai-bet'), fetch('/api/matches')
    ]);
    const [b, bets, m] = await Promise.all([balRes.json(), betRes.json(), mRes.json()]);
    setBalData(b); setBets(bets.bets || []); setMatches(m.matches || []);
  };

  useEffect(() => { if (user?.estado === 'activo') loadData(); }, [user]);

  const hacerApuesta = async (matchId, monto) => {
    setSaving(true); setMsg('');
    const r = await fetch('/api/ai-bet', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ matchId, monto }) });
    const d = await r.json();
    setSaving(false);
    if (!r.ok) { setMsg(`Error: ${d.error}`); return; }
    setMsg(d.mensaje || 'Apuesta registrada');
    loadData();
  };

  const iniciarRecarga = async () => {
    setSaving(true); setMsg('');
    const r = await fetch('/api/balance', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ monto:recargaMonto, metodoPagoId:recargaMetodo }) });
    const d = await r.json();
    setSaving(false);
    if (!r.ok) { setMsg(`Error: ${d.error}`); return; }
    if (d.wompi) {
      // Redirigir al widget Wompi
      setMsg('Serás redirigido a Wompi...');
    } else {
      router.push('/pendiente');
    }
  };

  if (!user || user.estado !== 'activo') return null;

  const matchesUpcoming = matches.filter(m => m.homeScore === null && !bets.find(b=>b.matchId===m.id));
  const cal = calcularTotal(parseInt(recargaMonto)||0, recargaMetodo);

  return (
    <Layout title="Mi Saldo IA" description="Gestiona tu saldo de competencia contra IA">
      <div className="container page">
        <div className="page-header">
          <h1>Mi Saldo IA</h1>
          <p>Apuesta contra la IA en cada partido y gana saldo</p>
        </div>

        {!balData?.incluye_ia ? (
          <div style={{ textAlign:'center', padding:'3rem 2rem' }}>
            <div className="card" style={{ maxWidth:440, margin:'0 auto', padding:'2rem' }}>
              <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🤖</div>
              <h2 style={{ fontFamily:'var(--font-head)', fontSize:'1.5rem', color:'var(--text-on-card)', marginBottom:'0.5rem' }}>Activa la competencia IA</h2>
              <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', lineHeight:1.6, marginBottom:'1.5rem' }}>
                Tu plan actual no incluye competencia contra IA. Paga {formatCOP(20000)} para activarla y obtener saldo inicial.
              </p>
              <div style={{ background:'#EDE9FE', border:'1px solid #DDD6FE', borderRadius:8, padding:'1rem', marginBottom:'1.5rem', fontSize:'0.8rem', color:'#5B21B6' }}>
                <strong>¿Cómo funciona?</strong>
                <ul style={{ marginTop:6, paddingLeft:16, lineHeight:2 }}>
                  <li>Apuestas un monto contra la predicción de la IA</li>
                  <li>Si tu pronóstico es mejor → ganas el doble</li>
                  <li>Si la IA acierta mejor → pierdes tu apuesta</li>
                  <li>Mínimo {formatCOP(IA_BET.minimo)} por apuesta</li>
                </ul>
              </div>
              <select value={recargaMetodo} onChange={e=>setRecargaMetodo(e.target.value)}
                style={{ width:'100%', marginBottom:8, background:'var(--off-white)', border:'1.5px solid var(--card-border)', borderRadius:6, padding:'10px 12px', fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none', color:'var(--text-on-card)' }}>
                {Object.values(METODOS_PAGO).map(m => <option key={m.id} value={m.id}>{m.label} — {m.comision_pct>0?`+comisión`:' Sin comisión'}</option>)}
              </select>
              <button onClick={iniciarRecarga} disabled={saving} className="btn btn-gold" style={{ width:'100%', padding:'13px' }}>
                Activar IA — {formatCOP(cal.total)} {cal.comision>0 && `(incl. comisión ${formatCOP(cal.comision)})`}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Balance cards */}
            <div className="stats-grid" style={{ marginBottom:'1.5rem' }}>
              <div className="stat-card" style={{ background:'rgba(124,58,237,0.15)', border:'1px solid rgba(124,58,237,0.3)' }}>
                <div className="stat-value" style={{ color:'#A78BFA' }}>{formatCOP(balData?.saldoIA||0)}</div>
                <div className="stat-label">Saldo IA disponible</div>
              </div>
              <div className="stat-card"><div className="stat-value" style={{ color:'#4ADE80' }}>{balData?.apuestasGanadas||0}</div><div className="stat-label">Apuestas ganadas</div></div>
              <div className="stat-card"><div className="stat-value" style={{ color:'var(--crimson)' }}>{balData?.apuestasPerdidas||0}</div><div className="stat-label">Apuestas perdidas</div></div>
              <div className="stat-card"><div className="stat-value light">{balData?.apuestas||0}</div><div className="stat-label">Total apuestas</div></div>
            </div>

            {msg && <div className={`alert ${msg.startsWith('Error')?'alert-warning':'alert-success'}`} style={{ marginBottom:'1rem' }}>{msg}</div>}

            <div className="tabs">
              <button className={`tab${tab==='saldo'?' active':''}`} onClick={()=>setTab('saldo')}>Apostar vs IA</button>
              <button className={`tab${tab==='historial'?' active':''}`} onClick={()=>setTab('historial')}>Historial</button>
              <button className={`tab${tab==='recargar'?' active':''}`} onClick={()=>setTab('recargar')}>Recargar saldo</button>
            </div>

            {/* Apostar */}
            {tab==='saldo' && (
              <div>
                {matchesUpcoming.length === 0
                  ? <div className="empty-state"><div className="empty-icon">⚽</div><h3>Sin partidos disponibles</h3><p>Ya apostaste en todos los partidos pendientes.</p></div>
                  : matchesUpcoming.slice(0,12).map(m => (
                    <div key={m.id} className="card" style={{ marginBottom:'0.75rem' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                        <div>
                          <div style={{ fontFamily:'var(--font-head)', fontSize:'0.72rem', letterSpacing:'1px', color:'var(--gold)', marginBottom:3 }}>{m.round} · {m.date}</div>
                          <div style={{ fontFamily:'var(--font-head)', fontSize:'1.1rem', color:'var(--text-on-card)' }}>{m.homeTeam} vs {m.awayTeam}</div>
                        </div>
                        {user.saldoIA > 0
                          ? <ApostaBet bet={m} onPlace={hacerApuesta} loading={saving} user={{ saldoIA: balData?.saldoIA||0 }} />
                          : <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Sin saldo</span>}
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {/* Historial */}
            {tab==='historial' && (
              <div className="card" style={{ padding:0, overflow:'hidden' }}>
                {bets.length === 0
                  ? <div style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>Sin apuestas registradas.</div>
                  : bets.map(b => (
                    <div key={b.id} style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10, padding:'0.875rem 1.25rem', borderBottom:'1px solid var(--off-white)' }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-on-card)' }}>{b.match?.homeTeam||'?'} vs {b.match?.awayTeam||'?'}</div>
                        <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:3 }}>
                          Apostado: <strong>{formatCOP(b.monto)}</strong>
                          {b.iaPrediccion && ` · IA predijo: ${b.iaPrediccion.home}–${b.iaPrediccion.away}`}
                          {b.userPts !== undefined && ` · Tus pts: ${b.userPts} vs IA: ${b.iaPts}`}
                        </div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <ResultBadge resultado={b.resultado} />
                        {b.resultado==='ganada' && <div style={{ fontSize:'0.72rem', color:'#16A34A', marginTop:4 }}>+{formatCOP(b.monto)}</div>}
                        {b.resultado==='perdida' && <div style={{ fontSize:'0.72rem', color:'var(--crimson)', marginTop:4 }}>-{formatCOP(b.monto)}</div>}
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {/* Recargar */}
            {tab==='recargar' && (
              <div className="card" style={{ maxWidth:480 }}>
                <div className="card-header"><h3 className="card-title">Recargar saldo IA</h3></div>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div>
                    <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>Monto a recargar (máx. {formatCOP(IA_BET.maximo_por_recarga)})</label>
                    <input type="number" min="1000" max={IA_BET.maximo_por_recarga} value={recargaMonto} onChange={e=>setRecargaMonto(e.target.value)}
                      style={{ width:'100%', background:'var(--off-white)', border:'1.5px solid var(--card-border)', borderRadius:6, padding:'10px 12px', fontFamily:'var(--font-body)', fontSize:'0.9rem', outline:'none', color:'var(--text-on-card)' }} />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>Método de pago</label>
                    {Object.values(METODOS_PAGO).map(m => {
                      const c = calcularTotal(parseInt(recargaMonto)||0, m.id);
                      return (
                        <div key={m.id} onClick={()=>setRecargaMetodo(m.id)}
                          style={{ border:`1.5px solid ${recargaMetodo===m.id?'var(--crimson)':'var(--card-border)'}`, borderRadius:7, padding:'10px 12px', marginBottom:6, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', background:recargaMetodo===m.id?'rgba(208,20,60,0.04)':'white' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <span style={{ fontSize:'1.1rem' }}>{m.icon}</span>
                            <div>
                              <div style={{ fontWeight:700, fontSize:'0.82rem', color:'var(--text-on-card)' }}>{m.label}</div>
                              {m.comision_pct>0 && <div style={{ fontSize:'0.68rem', color:'#D97706' }}>+comisión {(m.comision_pct*100).toFixed(1)}%+IVA</div>}
                            </div>
                          </div>
                          <div style={{ fontFamily:'var(--font-head)', fontSize:'1.1rem', color:'var(--crimson)' }}>{formatCOP(c.total)}</div>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={iniciarRecarga} disabled={saving||!recargaMonto} className="btn btn-gold" style={{ width:'100%', padding:'13px' }}>
                    {saving ? 'Procesando...' : `Recargar ${formatCOP(cal.total)}`}
                  </button>
                  {cal.comision>0 && <p style={{ textAlign:'center', fontSize:'0.72rem', color:'var(--text-muted)' }}>Incluye comisión Wompi: {formatCOP(cal.comision)}</p>}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
