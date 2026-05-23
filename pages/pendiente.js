import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from './_app';
import { useRouter } from 'next/router';

export default function Pendiente() {
  const { user } = useAuth();
  const router = useRouter();
  const { ref, wompi } = router.query;
  const [checking, setChecking] = useState(false);
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!user) return;
    if (user.estado === 'activo') { router.push('/dashboard'); return; }
    // Polling si viene de Wompi
    if (wompi) {
      const interval = setInterval(async () => {
        const r = await fetch('/api/auth/me');
        const d = await r.json();
        if (d.user?.estado === 'activo') {
          clearInterval(interval);
          router.push('/dashboard');
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [user, wompi, router]);

  useEffect(() => {
    const i = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(i);
  }, []);

  const isWompi  = !!wompi;
  const isManual = user?.estado === 'pendiente_aprobacion';

  return (
    <>
      <Head><title>Activación pendiente | Polla Mundialista 2026</title></Head>
      <div style={{ minHeight:'100vh', background:'var(--maroon)', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
        <div style={{ background:'white', borderRadius:12, padding:'2.5rem', maxWidth:440, width:'100%', textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }}>
          {isWompi ? (
            <>
              <div style={{ fontSize:'3rem', marginBottom:'1rem', animation:'spin 1.5s linear infinite', display:'inline-block' }}>⏳</div>
              <h2 style={{ fontFamily:'var(--font-head)', fontSize:'1.6rem', color:'var(--maroon)', marginBottom:'0.5rem', letterSpacing:'0.5px' }}>Verificando pago{dots}</h2>
              <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', lineHeight:1.6, marginBottom:'1.5rem' }}>
                Wompi está confirmando tu transacción. Esto puede tomar unos segundos. Tu cuenta se activará automáticamente.
              </p>
              <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, padding:'12px', fontSize:'0.8rem', color:'#1E40AF' }}>
                No cierres esta página. Serás redirigido automáticamente.
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📋</div>
              <h2 style={{ fontFamily:'var(--font-head)', fontSize:'1.6rem', color:'var(--maroon)', marginBottom:'0.5rem', letterSpacing:'0.5px' }}>
                {isManual ? '¡Comprobante recibido!' : 'Cuenta en revisión'}
              </h2>
              <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', lineHeight:1.6, marginBottom:'1.5rem' }}>
                {isManual
                  ? 'El administrador validará tu pago manual en breve y activará tu cuenta. Recibirás acceso completo una vez aprobado.'
                  : 'Tu solicitud de registro está pendiente de validación por el administrador.'}
              </p>
              <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:8, padding:'12px', fontSize:'0.8rem', color:'#92400E', marginBottom:'1.5rem', textAlign:'left' }}>
                <strong>¿Qué sigue?</strong>
                <ol style={{ marginTop:6, paddingLeft:16, lineHeight:2 }}>
                  <li>El admin revisa tu comprobante</li>
                  <li>Si es válido, activa tu cuenta</li>
                  <li>Recibes acceso completo a la polla</li>
                </ol>
              </div>

              {!isManual && (
                <div style={{ marginBottom:'1.5rem' }}>
                  <p style={{ color:'var(--text-muted)', fontSize:'0.8rem', marginBottom:8 }}>¿Aún no enviaste tu comprobante?</p>
                  <Link href="/pago" className="btn btn-primary" style={{ width:'100%', display:'block', textAlign:'center' }}>
                    Completar pago
                  </Link>
                </div>
              )}
            </>
          )}

          <div style={{ marginTop:'1.5rem', fontSize:'0.72rem', color:'var(--text-muted)' }}>
            ¿Tienes dudas? Contacta al administrador.
          </div>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </>
  );
}
