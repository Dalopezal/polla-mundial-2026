import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../_app';
import { formatCOP } from '../../lib/payments';

const ESTADO_LABELS = {
  pendiente:           { label:'Pendiente',          bg:'#FEF3C7', color:'#92400E' },
  pendiente_validacion:{ label:'Comprobante enviado', bg:'#EFF6FF', color:'#1E40AF' },
  aprobado:            { label:'Aprobado',            bg:'#DCFCE7', color:'#166534' },
  rechazado:           { label:'Rechazado',           bg:'#FEF2F2', color:'#991B1B' },
  monto_incorrecto:    { label:'Monto incorrecto',    bg:'#FEF2F2', color:'#991B1B' },
};

function EstadoBadge({ estado }) {
  const s = ESTADO_LABELS[estado] || { label:estado, bg:'#F3F4F6', color:'#6B7280' };
  return <span style={{ background:s.bg, color:s.color, fontSize:'0.72rem', fontWeight:700, padding:'3px 10px', borderRadius:4, textTransform:'uppercase', letterSpacing:'0.3px' }}>{s.label}</span>;
}

export default function AdminPagos() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [resumen,  setResumen]  = useState(null);
  const [filtro,   setFiltro]   = useState('todos');
  const [notas,    setNotas]    = useState({});
  const [saving,   setSaving]   = useState({});
  const [msg,      setMsg]      = useState('');

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) router.push('/');
  }, [user, loading, router]);

  const loadData = async () => {
    const r = await fetch(`/api/admin/payments?estado=${filtro}`);
    const d = await r.json();
    setPayments(d.payments || []);
    setResumen(d.resumen || null);
  };

  useEffect(() => { if (user?.isAdmin) loadData(); }, [user, filtro]);

  const accion = async (paymentId, accionTipo) => {
    setSaving(s => ({ ...s, [paymentId]: true })); setMsg('');
    const r = await fetch('/api/admin/payments', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ paymentId, accion:accionTipo, notas:notas[paymentId]||'' })
    });
    const d = await r.json();
    setSaving(s => ({ ...s, [paymentId]: false }));
    if (!r.ok) { setMsg(`Error: ${d.error}`); return; }
    setMsg(accionTipo==='aprobar'?'✅ Usuario activado exitosamente':'❌ Pago rechazado');
    loadData();
  };

  if (!user?.isAdmin) return null;

  const pendientes = payments.filter(p=>p.estado==='pendiente'||p.estado==='pendiente_validacion').length;

  return (
    <Layout title="Admin · Pagos">
      <div className="container page">
        <div className="page-header">
          <h1>Panel de Pagos</h1>
          <p>Gestiona solicitudes de registro y validación de pagos</p>
        </div>

        {/* Resumen financiero */}
        {resumen && (
          <div className="stats-grid" style={{ marginBottom:'1.5rem' }}>
            <div className="stat-card">
              <div className="stat-value gold">{formatCOP(resumen.fondoPremios)}</div>
              <div className="stat-label">🏆 Fondo de premios</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color:'#4ADE80' }}>{formatCOP(resumen.fondoAdmin)}</div>
              <div className="stat-label">⚙️ Comisión admin</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color:'#A78BFA' }}>{formatCOP(resumen.saldoIA)}</div>
              <div className="stat-label">🤖 Saldo IA total</div>
            </div>
            <div className="stat-card">
              <div className="stat-value light">{resumen.totalUsuarios}</div>
              <div className="stat-label">👥 Usuarios activos</div>
            </div>
          </div>
        )}

        {/* Premios estimados */}
        {resumen && resumen.fondoPremios > 0 && (
          <div className="card" style={{ marginBottom:'1.5rem' }}>
            <div className="card-header"><h3 className="card-title">🏆 Distribución de Premios (estimada)</h3></div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.875rem' }}>
              {[
                { lugar:'1° Lugar', pct:0.60, color:'#B8860B', icon:'🥇' },
                { lugar:'2° Lugar', pct:0.30, color:'#708090', icon:'🥈' },
                { lugar:'3° Lugar', pct:0.10, color:'#8B4513', icon:'🥉' },
              ].map(p => (
                <div key={p.lugar} style={{ background:'var(--off-white)', borderRadius:8, padding:'1rem', textAlign:'center' }}>
                  <div style={{ fontSize:'1.5rem' }}>{p.icon}</div>
                  <div style={{ fontFamily:'var(--font-head)', fontSize:'1.4rem', color:p.color, marginTop:4 }}>
                    {formatCOP(Math.floor(resumen.fondoPremios * p.pct))}
                  </div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:2 }}>{p.lugar} · {(p.pct*100).toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {msg && <div className={`alert ${msg.startsWith('Error')?'alert-warning-card':'alert-success-card'}`} style={{ marginBottom:'1rem' }}>{msg}</div>}

        {/* Filtros */}
        <div className="tabs">
          {[['todos','Todos'],['pendiente_validacion',`Con comprobante (${pendientes})`],['pendiente','Pendientes'],['aprobado','Aprobados'],['rechazado','Rechazados']].map(([id,lbl]) => (
            <button key={id} className={`tab${filtro===id?' active':''}`} onClick={()=>setFiltro(id)}>{lbl}</button>
          ))}
        </div>

        {/* Tabla de pagos */}
        {payments.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📋</div><h3>Sin solicitudes</h3><p>No hay pagos en este estado.</p></div>
        ) : (
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            {payments.map((p, i) => (
              <div key={p.id} style={{ padding:'1.25rem', borderBottom:i<payments.length-1?'1px solid var(--off-white)':'none' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10, marginBottom:10 }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontWeight:700, fontSize:'0.95rem', color:'var(--text-on-card)' }}>{p.userName}</span>
                      <EstadoBadge estado={p.estado} />
                      <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{p.planLabel} · {p.metodoPagoLabel}</span>
                    </div>
                    <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>
                      {p.userEmail} · {new Date(p.creadoEn).toLocaleString('es-CO')}
                    </div>
                    {p.comprobante && (
                      <div style={{ marginTop:6, background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:6, padding:'6px 10px', fontSize:'0.8rem', color:'#1E40AF' }}>
                        <strong>Comprobante:</strong> {p.comprobante}
                        {p.notas && <span style={{ marginLeft:8, color:'#1D4ED8' }}>· {p.notas}</span>}
                      </div>
                    )}
                    <div style={{ display:'flex', gap:12, marginTop:6, fontSize:'0.78rem' }}>
                      <span>Base: <strong>{formatCOP(p.valorBase)}</strong></span>
                      {p.comision>0 && <span>Comisión: <strong>{formatCOP(p.comision)}</strong></span>}
                      <span>Total: <strong style={{ color:'var(--crimson)' }}>{formatCOP(p.valorTotal)}</strong></span>
                      <span style={{ color:'var(--text-muted)' }}>Ref: <code style={{ fontSize:'0.72rem' }}>{p.referencia}</code></span>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:'var(--font-head)', fontSize:'1.4rem', color:'var(--text-on-card)' }}>{formatCOP(p.valorTotal)}</div>
                    <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>
                      Premio: {formatCOP(p.distribucion?.premios||0)} · Admin: {formatCOP(p.distribucion?.admin||0)}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                {(p.estado === 'pendiente' || p.estado === 'pendiente_validacion') && (
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                    <input type="text" placeholder="Notas (opcional)" value={notas[p.id]||''} onChange={e=>setNotas(n=>({...n,[p.id]:e.target.value}))}
                      style={{ flex:1, minWidth:180, background:'var(--off-white)', border:'1px solid var(--card-border)', borderRadius:6, padding:'7px 10px', fontFamily:'var(--font-body)', fontSize:'0.82rem', outline:'none', color:'var(--text-on-card)' }} />
                    <button onClick={()=>accion(p.id,'aprobar')} disabled={saving[p.id]} className="btn btn-primary btn-sm">
                      {saving[p.id]?'...':'✅ Aprobar'}
                    </button>
                    <button onClick={()=>accion(p.id,'rechazar')} disabled={saving[p.id]} className="btn btn-danger btn-sm">
                      {saving[p.id]?'...':'❌ Rechazar'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
