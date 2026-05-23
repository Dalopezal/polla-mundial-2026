import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from './_app';
import { PLANES, METODOS_PAGO, formatCOP } from '../lib/payments';

// Cálculo de comisión client-side (sin importar crypto)
function calcularTotalCliente(base, metodoPagoId) {
  const m = METODOS_PAGO[metodoPagoId];
  if (!m) return { base, comision: 0, total: base };
  const comBase  = base * m.comision_pct + (m.comision_fija || 0);
  const iva      = comBase * m.comision_iva;
  const comision = Math.ceil(comBase + iva);
  return { base, comision, total: base + comision };
}

// ── Widget de Wompi ────────────────────────────────────────
function WompiWidget({ wompi, onPaid }) {
  useEffect(() => {
    const s = document.createElement('script');
    s.src = 'https://checkout.wompi.co/widget.js';
    s.setAttribute('data-render', 'button');
    s.setAttribute('data-public-key',      wompi.publicKey);
    s.setAttribute('data-currency',        wompi.currency);
    s.setAttribute('data-amount-in-cents', String(wompi.amountInCents));
    s.setAttribute('data-reference',       wompi.reference);
    s.setAttribute('data-signature:integrity', wompi.signature);
    s.setAttribute('data-redirect-url',    wompi.redirectUrl);
    const container = document.getElementById('wompi-container');
    if (container) { container.innerHTML = ''; container.appendChild(s); }

    // Escuchar confirmación
    const handler = (e) => {
      if (e.data?.type === 'wompi:transaction' && e.data.status === 'APPROVED') {
        onPaid?.(e.data);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [wompi, onPaid]);

  return (
    <div style={{ display:'flex', justifyContent:'center', margin:'1rem 0' }}>
      <div id="wompi-container" />
    </div>
  );
}

// ── Paso 1: Selección de plan ──────────────────────────────
function StepPlan({ selected, onSelect }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
      {Object.values(PLANES).map(plan => (
        <div key={plan.id} onClick={() => onSelect(plan.id)}
          style={{
            border: `2px solid ${selected===plan.id ? plan.color : 'var(--card-border)'}`,
            borderRadius: 12, padding:'1.5rem', cursor:'pointer', transition:'all .15s',
            background: selected===plan.id ? `${plan.color}08` : 'var(--white)',
            position: 'relative', overflow:'hidden',
          }}>
          {plan.incluye_ia && (
            <div style={{ position:'absolute', top:12, right:-18, background: plan.color, color:'white', fontSize:'0.6rem', fontWeight:800, padding:'2px 24px', transform:'rotate(45deg)', letterSpacing:'0.5px' }}>IA</div>
          )}
          <div style={{ fontSize:'2rem', marginBottom:8 }}>{plan.icon}</div>
          <div style={{ fontFamily:'var(--font-head)', fontSize:'1.4rem', color:plan.color, marginBottom:4 }}>{plan.label}</div>
          <div style={{ fontFamily:'var(--font-head)', fontSize:'2rem', color:'var(--text-on-card)', marginBottom:8 }}>
            {formatCOP(plan.precio)}
          </div>
          <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:12 }}>{plan.descripcion}</div>
          <div style={{ borderTop:'1px solid var(--off-white)', paddingTop:10 }}>
            {[
              `✓ Predice los 104 partidos`,
              `✓ Tabla de posiciones y logros`,
              plan.incluye_ia && `✓ Saldo IA: ${formatCOP(plan.distribucion.ia)} para apostar`,
              plan.incluye_ia && `✓ Ranking Humanos vs IA`,
            ].filter(Boolean).map((f,i) => (
              <div key={i} style={{ fontSize:'0.78rem', color:'var(--text-on-card)', marginBottom:3 }}>{f}</div>
            ))}
          </div>
          <div style={{ marginTop:12, fontSize:'0.72rem', color:'var(--text-muted)', borderTop:'1px solid var(--off-white)', paddingTop:8 }}>
            Distribución: 🏆 Premio {formatCOP(plan.distribucion.premios)} · ⚙️ Admin {formatCOP(plan.distribucion.admin)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Paso 2: Tipo de participación ──────────────────────────
function StepParticipacion({ selected, onSelect }) {
  const opts = [
    { id:'individual', icon:'👤', label:'Individual', desc:'Compites en el ranking general. No ves grupos.' },
    { id:'grupo',      icon:'👥', label:'En grupo',   desc:'Compites solo con tu grupo de amigos.' },
    { id:'ambos',      icon:'🌐', label:'Ambos',      desc:'Compites individualmente Y en tu grupo. (Pago por separado)' },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {opts.map(o => (
        <div key={o.id} onClick={() => onSelect(o.id)}
          style={{ border:`2px solid ${selected===o.id?'var(--crimson)':'var(--card-border)'}`, borderRadius:8, padding:'1rem 1.25rem', cursor:'pointer', display:'flex', alignItems:'center', gap:12, background:selected===o.id?'rgba(208,20,60,0.04)':'var(--white)', transition:'all .15s' }}>
          <span style={{ fontSize:'1.5rem' }}>{o.icon}</span>
          <div>
            <div style={{ fontWeight:700, color:'var(--text-on-card)' }}>{o.label}</div>
            <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{o.desc}</div>
          </div>
          {selected===o.id && <div style={{ marginLeft:'auto', color:'var(--crimson)', fontWeight:800 }}>✓</div>}
        </div>
      ))}
    </div>
  );
}

// ── Paso 3: Método de pago ─────────────────────────────────
function StepMetodoPago({ planId, metodoPago, onSelect }) {
  const plan = PLANES[planId];
  if (!plan) return null;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {Object.values(METODOS_PAGO).map(m => {
        const cal = calcularTotalCliente(plan.precio, m.id);
        return (
          <div key={m.id} onClick={() => onSelect(m.id)}
            style={{ border:`2px solid ${metodoPago===m.id?'var(--crimson)':'var(--card-border)'}`, borderRadius:8, padding:'1rem 1.25rem', cursor:'pointer', display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center', gap:12, background:metodoPago===m.id?'rgba(208,20,60,0.04)':'var(--white)', transition:'all .15s' }}>
            <span style={{ fontSize:'1.5rem' }}>{m.icon}</span>
            <div>
              <div style={{ fontWeight:700, color:'var(--text-on-card)' }}>{m.label}</div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{m.descripcion}</div>
              {m.comision_pct > 0 && <div style={{ fontSize:'0.7rem', color:'#D97706', marginTop:2 }}>Comisión: {formatCOP(cal.comision)} ({(m.comision_pct*100).toFixed(1)}% + IVA)</div>}
              {m.id==='manual' && <div style={{ fontSize:'0.7rem', color:'#16A34A', marginTop:2 }}>Sin comisión. Validación manual por admin.</div>}
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:'var(--font-head)', fontSize:'1.2rem', color:'var(--crimson)' }}>{formatCOP(cal.total)}</div>
              {cal.comision > 0 && <div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>base: {formatCOP(cal.base)}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Paso 4: Manual payment form ────────────────────────────
function StepManual({ referencia, planId, metodoPago, onSubmit, loading }) {
  const [comprobante, setComprobante] = useState('');
  const [notas, setNotas]             = useState('');
  const plan = PLANES[planId];
  const cal  = calcularTotalCliente(plan?.precio || 0, metodoPago);

  const bankName  = process.env.NEXT_PUBLIC_BANCO_NOMBRE || 'Bancolombia';
  const bankAcc   = process.env.NEXT_PUBLIC_BANCO_NUMERO || 'Ver con el admin';
  const bankOwner = process.env.NEXT_PUBLIC_BANCO_TITULAR || 'Administrador';
  const nequi     = process.env.NEXT_PUBLIC_BANCO_NEQUI  || '';

  return (
    <div>
      <div style={{ background:'#FEF9EC', border:'1px solid #FDE68A', borderRadius:8, padding:'1.25rem', marginBottom:'1.5rem' }}>
        <div style={{ fontWeight:800, fontSize:'0.875rem', color:'#92400E', marginBottom:8 }}>📋 Datos para pago manual</div>
        <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'6px 12px', fontSize:'0.82rem', color:'#92400E' }}>
          <span style={{ fontWeight:700 }}>Banco:</span>      <span>{bankName}</span>
          <span style={{ fontWeight:700 }}>Cuenta:</span>     <span>{bankAcc}</span>
          <span style={{ fontWeight:700 }}>Titular:</span>    <span>{bankOwner}</span>
          {nequi && <><span style={{ fontWeight:700 }}>Nequi:</span><span>{nequi}</span></>}
          <span style={{ fontWeight:700 }}>Valor exacto:</span>
          <span style={{ fontFamily:'var(--font-head)', fontSize:'1.1rem' }}>{formatCOP(cal.total)}</span>
          <span style={{ fontWeight:700 }}>Referencia:</span>
          <span style={{ fontFamily:'monospace', fontSize:'0.78rem', background:'#FFF', padding:'2px 6px', borderRadius:4, border:'1px solid #FDE68A' }}>{referencia}</span>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div>
          <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>
            Número de comprobante / referencia bancaria *
          </label>
          <input type="text" value={comprobante} onChange={e=>setComprobante(e.target.value)}
            placeholder="Ej: 123456789 o referencia de transferencia"
            style={{ width:'100%', background:'var(--off-white)', border:'1.5px solid var(--card-border)', borderRadius:6, padding:'10px 12px', fontFamily:'var(--font-body)', fontSize:'0.9rem', outline:'none', color:'var(--text-on-card)' }} />
        </div>
        <div>
          <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>
            Notas adicionales (opcional)
          </label>
          <textarea value={notas} onChange={e=>setNotas(e.target.value)}
            placeholder="Hora del pago, nombre del pagador si es diferente..."
            rows={2}
            style={{ width:'100%', background:'var(--off-white)', border:'1.5px solid var(--card-border)', borderRadius:6, padding:'10px 12px', fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none', resize:'none', color:'var(--text-on-card)' }} />
        </div>
        <button onClick={() => onSubmit({ comprobante, notas })} disabled={!comprobante.trim() || loading}
          className="btn btn-gold" style={{ width:'100%', padding:'13px' }}>
          {loading ? 'Enviando...' : 'Confirmar que ya pagué'}
        </button>
      </div>
    </div>
  );
}

// ── PÁGINA PRINCIPAL ───────────────────────────────────────
export default function Pago() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [step,          setStep]         = useState(1); // 1=plan, 2=participacion, 3=metodo, 4=pagar
  const [planId,        setPlanId]       = useState('basico');
  const [participacion, setParticipacion]= useState('individual');
  const [metodoPago,    setMetodoPago]   = useState('wompi_pse');
  const [pagoData,      setPagoData]     = useState(null); // respuesta de /api/payment/initiate
  const [error,         setError]        = useState('');
  const [submitting,    setSubmitting]   = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user?.estado === 'activo') router.push('/dashboard');
  }, [user, loading, router]);

  const iniciarPago = async () => {
    setSubmitting(true); setError('');
    try {
      const r = await fetch('/api/payment/initiate', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ planId, metodoPagoId:metodoPago, tipoParticipacion:participacion })
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error); return; }
      setPagoData(d);
      setStep(4);
    } catch { setError('Error de conexión. Intenta de nuevo.'); }
    finally { setSubmitting(false); }
  };

  const enviarManual = async ({ comprobante, notas }) => {
    setSubmitting(true); setError('');
    try {
      const r = await fetch('/api/payment/manual', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ referencia:pagoData.referencia, comprobante, notas })
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error); return; }
      router.push('/pendiente');
    } catch { setError('Error al enviar comprobante.'); }
    finally { setSubmitting(false); }
  };

  const plan = PLANES[planId];
  const cal  = plan ? calcularTotalCliente(plan.precio, metodoPago) : null;

  const STEPS = ['Plan', 'Participación', 'Pago', 'Confirmar'];
  const isWompi = METODOS_PAGO[metodoPago]?.wompi;

  if (!user || user.estado === 'activo') return null;

  return (
    <>
      <Head>
        <title>Registro y Pago | Polla Mundialista 2026</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div style={{ minHeight:'100vh', background:'var(--maroon)', display:'flex', flexDirection:'column', alignItems:'center', padding:'2rem 1rem' }}>
        {/* Brand */}
        <Link href="/" style={{ textDecoration:'none', marginBottom:'2rem', display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ fontFamily:'var(--font-head)', fontSize:'1.3rem', letterSpacing:'2px', color:'white' }}>
            POLLA <span style={{ color:'var(--gold)' }}>MUNDIAL</span>
            <span style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.4)', marginLeft:4 }}>2026</span>
          </div>
        </Link>

        <div style={{ width:'100%', maxWidth:580 }}>
          {/* Step indicator */}
          <div style={{ display:'flex', gap:4, marginBottom:'1.5rem' }}>
            {STEPS.map((s,i) => (
              <div key={i} style={{ flex:1, display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:step>i+1?'var(--green)':step===i+1?'var(--gold)':'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:800, color:step>i+1||step===i+1?'white':'rgba(255,255,255,0.5)', flexShrink:0 }}>
                  {step>i+1?'✓':i+1}
                </div>
                <div style={{ fontSize:'0.68rem', color:step===i+1?'white':'rgba(255,255,255,0.4)', fontWeight:step===i+1?700:400, whiteSpace:'nowrap' }}>{s}</div>
                {i<STEPS.length-1 && <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.15)', marginLeft:4 }}/>}
              </div>
            ))}
          </div>

          <div style={{ background:'white', borderRadius:12, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }}>
            {/* Header */}
            <div style={{ background:'var(--banner)', padding:'1.25rem 1.5rem' }}>
              <div style={{ fontFamily:'var(--font-head)', fontSize:'1.3rem', letterSpacing:'1px', color:'white' }}>
                {step===1 && 'Elige tu plan'}
                {step===2 && 'Tipo de participación'}
                {step===3 && 'Método de pago'}
                {step===4 && (isWompi ? 'Paga con Wompi' : 'Pago manual')}
              </div>
              {cal && step>=3 && (
                <div style={{ marginTop:4, display:'flex', gap:12, fontSize:'0.75rem', color:'rgba(255,255,255,0.65)' }}>
                  <span>Base: {formatCOP(cal.base)}</span>
                  {cal.comision>0 && <span>Comisión: {formatCOP(cal.comision)}</span>}
                  <span style={{ color:'var(--gold)', fontWeight:700 }}>Total: {formatCOP(cal.total)}</span>
                </div>
              )}
            </div>

            <div style={{ padding:'1.5rem' }}>
              {error && <div style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:6, padding:'10px 14px', marginBottom:'1rem', fontSize:'0.82rem', color:'#991B1B' }}>{error}</div>}

              {step===1 && <StepPlan selected={planId} onSelect={setPlanId} />}
              {step===2 && <StepParticipacion selected={participacion} onSelect={setParticipacion} />}
              {step===3 && <StepMetodoPago planId={planId} metodoPago={metodoPago} onSelect={setMetodoPago} />}
              {step===4 && pagoData && (
                isWompi && pagoData.wompi
                  ? <WompiWidget wompi={pagoData.wompi} onPaid={()=>router.push('/pendiente?wompi=1')} />
                  : <StepManual referencia={pagoData.referencia} planId={planId} metodoPago={metodoPago} onSubmit={enviarManual} loading={submitting} />
              )}

              {/* Nav buttons */}
              {step < 4 && (
                <div style={{ display:'flex', gap:10, marginTop:'1.5rem' }}>
                  {step > 1 && <button onClick={()=>setStep(s=>s-1)} className="btn btn-dark" style={{ flex:1 }}>Atrás</button>}
                  {step < 3
                    ? <button onClick={()=>setStep(s=>s+1)} className="btn btn-primary" style={{ flex:2 }}>Continuar</button>
                    : <button onClick={iniciarPago} disabled={submitting} className="btn btn-gold" style={{ flex:2, padding:'13px' }}>
                        {submitting ? 'Procesando...' : `Pagar ${formatCOP(cal?.total || 0)}`}
                      </button>
                  }
                </div>
              )}
            </div>

            {/* Footer info */}
            <div style={{ padding:'0.875rem 1.5rem', borderTop:'1px solid var(--off-white)', background:'var(--off-white)', fontSize:'0.72rem', color:'var(--text-muted)', textAlign:'center' }}>
              Las comisiones de Wompi son asumidas por el usuario y se muestran en el total. · Pago manual sin comisión, sujeto a validación del admin.
            </div>
          </div>

          <div style={{ textAlign:'center', marginTop:'1rem' }}>
            <Link href="/" style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.78rem', textDecoration:'none' }}>← Volver al inicio</Link>
          </div>
        </div>
      </div>
    </>
  );
}
