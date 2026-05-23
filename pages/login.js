import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from './_app';

export default function Login() {
  const [form, setForm] = useState({ email:'', password:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      login(data.user); router.push('/dashboard');
    } catch { setError('Error de conexión. Intenta de nuevo.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Head>
        <title>Iniciar Sesión | Polla Mundialista</title>
        <meta name="description" content="Inicia sesión en tu cuenta de la Polla Mundialista." />
      </Head>
      <div className="auth-page">
        <div className="auth-card">
          <Link href="/" className="auth-brand">
            <div style={{ width:28, height:28, background:'var(--crimson)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="white" strokeWidth="1.5"/><path d="M8 3.5v2.2m0 4.6v2.2M3.5 8h2.2m4.6 0h2.2" stroke="white" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </div>
            <span className="auth-brand-text">POLLA <span>MUNDIAL</span></span>
          </Link>

          <h2>Bienvenido</h2>
          <p>Ingresa tus datos para continuar</p>

          {error && <div className="alert alert-warning-card" style={{ marginBottom:'1rem' }}><strong>Atención:</strong> {error}</div>}

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input type="email" name="email" className="form-input" placeholder="tu@email.com" value={form.email} onChange={handle} required autoComplete="email" />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input type="password" name="password" className="form-input" placeholder="Tu contraseña" value={form.password} onChange={handle} required autoComplete="current-password" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width:'100%' }} disabled={loading}>
              {loading ? 'Entrando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'0.875rem' }}>
            ¿No tienes cuenta?{' '}
            <Link href="/register" style={{ color:'var(--crimson)', fontWeight:700 }}>Regístrate gratis</Link>
          </p>
        </div>
      </div>
    </>
  );
}
