import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../pages/_app';
import { useState } from 'react';

const Icon = ({ d, size=18 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
    <path d={d}/>
  </svg>
);

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const p = router.pathname;
  const [menuOpen, setMenuOpen] = useState(false);

  const navLink = (href, label) => (
    <li><Link href={href} className={p===href?'active':''}>{label}</Link></li>
  );

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <div className="navbar-ball">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8.5" stroke="white" strokeWidth="1.5"/>
              <path d="M10 4.5 L13 7 L12 11 L8 11 L7 7 Z" fill="white" opacity="0.85"/>
              <path d="M10 15.5 L10 11 M4.5 7.5 L7 7 M13 7 L15.5 7.5" stroke="white" strokeWidth="1" strokeLinecap="round"/>
            </svg>
          </div>
          POLLA <span className="accent">MUNDIAL</span>
          <span style={{ fontSize:'0.58rem', color:'rgba(255,255,255,0.3)', letterSpacing:0, fontFamily:'var(--font-body)', fontWeight:600, marginLeft:2 }}>2026</span>
        </Link>

        <ul className="navbar-links">
          {navLink('/fixture',      'Fixture')}
          {navLink('/leaderboard',  'Tabla')}
          {navLink('/asistente',    'Asistente IA')}
          {navLink('/estadisticas', 'Estadísticas')}
          {navLink('/simulador',    'Simulador')}
          {navLink('/analytics',    'Analytics')}
          {user && navLink('/iq',         'Mi IQ')}
          {user && navLink('/dashboard',  'Pronósticos')}
          {user?.isAdmin && navLink('/admin', 'Admin')}
          {user?.isAdmin && navLink('/admin/pagos', 'Pagos')}
          {user?.incluye_ia && navLink('/saldo', 'Saldo IA')}
        </ul>

        <div className="navbar-user">
          {user ? (
            <>
              <div className="user-chip">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M1.5 13c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {user.name}
                {user.isAdmin && <span className="admin-tag">Admin</span>}
                {user.incluye_ia && user.saldoIA > 0 && (
                  <span style={{ background:'rgba(124,58,237,0.3)', color:'#C4B5FD', fontSize:'0.62rem', fontWeight:800, padding:'1px 5px', borderRadius:3 }}>
                    IA ${(user.saldoIA/1000).toFixed(0)}k
                  </span>
                )}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={logout}>Salir</button>
            </>
          ) : (
            <>
              <Link href="/login"    className="btn btn-ghost btn-sm">Entrar</Link>
              <Link href="/register" className="btn btn-gold btn-sm">Unirse</Link>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Nav */}
      <nav className="mobile-nav">
        <ul className="mobile-nav-links">
          <li><Link href="/" className={p==='/'?'active':''}>
            <span className="mn-icon"><Icon d="M10 2L2 8v10h5v-6h6v6h5V8z"/></span>Inicio
          </Link></li>
          <li><Link href="/fixture" className={p==='/fixture'?'active':''}>
            <span className="mn-icon"><Icon d="M10 1l2.39 7.26H19l-5.19 3.77 1.98 6.1L10 14.27l-5.79 3.86 1.98-6.1L1 8.26h6.61z"/></span>Fixture
          </Link></li>
          <li><Link href="/asistente" className={p==='/asistente'?'active':''}>
            <span className="mn-icon"><Icon d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></span>IA
          </Link></li>
          <li><Link href="/leaderboard" className={p==='/leaderboard'?'active':''}>
            <span className="mn-icon"><Icon d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></span>Tabla
          </Link></li>
          {user
            ? <li><Link href="/dashboard" className={p==='/dashboard'?'active':''}>
                <span className="mn-icon"><Icon d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></span>Mis
              </Link></li>
            : <li><Link href="/register" className={p==='/register'?'active':''}>
                <span className="mn-icon"><Icon d="M10 2a4 4 0 100 8 4 4 0 000-8zM3 18a7 7 0 0114 0H3z"/></span>Unirse
              </Link></li>
          }
        </ul>
      </nav>
    </>
  );
}
