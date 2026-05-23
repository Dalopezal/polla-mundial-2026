import '../styles/globals.css';
import { createContext, useContext, useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Páginas que NO requieren usuario activo
const PUBLIC_PATHS = ['/', '/login', '/register', '/fixture', '/leaderboard', '/estadisticas', '/simulador', '/analytics', '/asistente'];
const PAYMENT_PATHS = ['/pago', '/pendiente']; // accesibles con usuario no activo

export default function App({ Component, pageProps }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Redirigir usuarios no activos
  useEffect(() => {
    if (loading || !user) return;
    const path = router.pathname;
    const isPublic  = PUBLIC_PATHS.includes(path);
    const isPayment = PAYMENT_PATHS.includes(path);
    const isAdmin   = path.startsWith('/admin');

    if (user.estado === 'pendiente_pago' && !isPublic && !isPayment) {
      router.push('/pago');
    } else if (user.estado === 'pendiente_aprobacion' && !isPublic && !isPayment) {
      router.push('/pendiente');
    } else if (user.isAdmin && path === '/pago') {
      // Admin no necesita pagar
      router.push('/dashboard');
    }
  }, [user, loading, router.pathname]);

  const login  = (userData) => setUser(userData);
  const logout = async () => {
    await fetch('/api/auth/logout', { method:'POST' });
    setUser(null);
    window.location.href = '/';
  };
  const refreshUser = async () => {
    const r = await fetch('/api/auth/me');
    const d = await r.json();
    if (d.user) setUser(d.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {!loading && <Component {...pageProps} />}
    </AuthContext.Provider>
  );
}
