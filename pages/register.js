import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from './_app';
import bcrypt from 'bcryptjs';

export default function Register() {
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden'); return; }
    if (form.password.length < 6) { setError('Contraseña mínimo 6 caracteres'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name:form.name, email:form.email, password:form.password }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      login(data.user);
      // Si el usuario es admin, ir al dashboard directamente
      // Si no, ir al flujo de pago
      if (data.user.isAdmin) { router.push('/dashboard'); }
      else { router.push('/pago'); }
    } catch { setError('Error de conexión.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Head>
        <title>Registrarse | Polla Mundialista 2026</title>
        <meta name="description" content="Regístrate en la Polla Mundialista 2026. Elige tu plan y compite con tus amigos." />
      </Head>
      <div className="auth-page">
        <div className="auth-card">
          <Link href="/" className="auth-brand">
            <div style={{ width:28, height:28, background:'var(--crimson)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="white" strokeWidth="1.5"/></svg>
            </div>
            <span className="auth-brand-text">POLLA <span>MUNDIAL</span></span>
          </Link>

          <h2>Crea tu cuenta</h2>
          <p>Después del registro podrás elegir tu plan y método de pago</p>

          {error && <div className="alert alert-warning-card" style={{ marginBottom:'1rem' }}>{error}</div>}

          <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:7, padding:'0.875rem', marginBottom:'1.25rem', fontSize:'0.8rem', color:'#1E40AF' }}>
            <strong>Paso 1 de 2:</strong> Crea tu cuenta · <strong>Paso 2:</strong> Elige plan y paga
            <div style={{ marginTop:4, color:'#1D4ED8' }}>
              📦 Plan básico: $30.000 COP · 🤖 Con IA: $50.000 COP
            </div>
          </div>

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input type="text" name="name" className="form-input" placeholder="Tu nombre" value={form.name} onChange={handle} required maxLength={40} />
            </div>
            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input type="email" name="email" className="form-input" placeholder="tu@email.com" value={form.email} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input type="password" name="password" className="form-input" placeholder="Mínimo 6 caracteres" value={form.password} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar contraseña</label>
              <input type="password" name="confirm" className="form-input" placeholder="Repite tu contraseña" value={form.confirm} onChange={handle} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width:'100%' }} disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta y continuar →'}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'0.875rem' }}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" style={{ color:'var(--crimson)', fontWeight:700 }}>Inicia sesión</Link>
          </p>
        </div>
      </div>
    </>
  );
}
