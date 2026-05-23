import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from './_app';

const ROUNDS_ORDER = ['Grupo A', 'Grupo B', 'Grupo C', 'Grupo D', 'Grupo E', 'Grupo F', 'Grupo G', 'Grupo H', 'Octavos', 'Cuartos', 'Semifinal', 'Tercer Lugar', 'Final'];

function AdminMatchRow({ match, onUpdate }) {
  const [home, setHome] = useState(match.homeTeam);
  const [away, setAway] = useState(match.awayTeam);
  const [hs, setHs] = useState(match.homeScore ?? '');
  const [as_, setAs] = useState(match.awayScore ?? '');
  const [hp, setHp] = useState(match.homePens ?? '');
  const [ap, setAp] = useState(match.awayPens ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/matches/${match.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeTeam: home,
          awayTeam: away,
          homeScore: hs === '' ? null : hs,
          awayScore: as_ === '' ? null : as_,
          homePens: hp === '' ? null : hp,
          awayPens: ap === '' ? null : ap
        })
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate(data.match);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  const numInput = (val, setter) => (
    <input
      type="number" className="admin-score-input"
      value={val} onChange={e => setter(e.target.value)}
      min="0" max="30" placeholder="–"
    />
  );

  return (
    <div className="admin-match-row">
      <div className="teams">
        <input
          type="text"
          value={home}
          onChange={e => setHome(e.target.value)}
          style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontFamily: 'Nunito Sans, sans-serif', fontSize: '0.85rem', fontWeight: 600, padding: '4px 8px', width: 140, outline: 'none' }}
        />
        <span style={{ color: 'var(--text3)', margin: '0 6px' }}>vs</span>
        <input
          type="text"
          value={away}
          onChange={e => setAway(e.target.value)}
          style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontFamily: 'Nunito Sans, sans-serif', fontSize: '0.85rem', fontWeight: 600, padding: '4px 8px', width: 140, outline: 'none' }}
        />
        <span style={{ color: 'var(--text3)', fontSize: '0.75rem', marginLeft: 8 }}>{match.round}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {numInput(hs, setHs)}
        <span style={{ color: 'var(--text3)', fontWeight: 700 }}>–</span>
        {numInput(as_, setAs)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: 0.7 }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>Pen:</span>
        {numInput(hp, setHp)}
        <span style={{ color: 'var(--text3)' }}>–</span>
        {numInput(ap, setAp)}
      </div>
      <button
        className="btn btn-gold btn-sm"
        onClick={save}
        disabled={saving}
        style={{ whiteSpace: 'nowrap' }}
      >
        {saving ? '⏳' : saved ? '✅' : '💾 Guardar'}
      </button>
    </div>
  );
}

export default function Admin() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState([]);
  const [activeRound, setActiveRound] = useState('Todos');
  const [stats, setStats] = useState({ total: 0, played: 0, users: 0 });

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) router.push('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    Promise.all([
      fetch('/api/matches').then(r => r.json()),
      fetch('/api/leaderboard').then(r => r.json())
    ]).then(([mData, lData]) => {
      setMatches(mData.matches || []);
      const played = (mData.matches || []).filter(m => m.homeScore !== null).length;
      setStats({ total: mData.matches?.length || 0, played, users: lData.leaderboard?.length || 0 });
    });
  }, [user]);

  const handleUpdate = (updated) => {
    setMatches(prev => prev.map(m => m.id === updated.id ? updated : m));
  };

  if (!user?.isAdmin) return null;

  const rounds = ['Todos', ...ROUNDS_ORDER.filter(r => matches.some(m => m.round === r))];
  const filtered = activeRound === 'Todos' ? matches : matches.filter(m => m.round === activeRound);

  return (
    <Layout title="Panel Admin" description="Panel de administración de la Polla Mundialista">
      <div className="container page">
        <div className="page-header">
          <h1>⚙️ Panel de Administración</h1>
          <p>Actualiza los marcadores y equipos del torneo</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.users}</div>
            <div className="stat-label">Participantes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--green)' }}>{stats.played}</div>
            <div className="stat-label">Partidos Jugados</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--text2)' }}>{stats.total - stats.played}</div>
            <div className="stat-label">Pendientes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Partidos</div>
          </div>
        </div>

        <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
          ⚙️ Solo tú puedes ver esta página. Actualiza los marcadores reales y los nombres de equipos en las eliminatorias (cuando se definan los clasificados).
        </div>

        {/* Round tabs */}
        <div className="tabs" style={{ marginBottom: '1.5rem' }}>
          {rounds.map(r => (
            <button key={r} className={`tab${activeRound === r ? ' active' : ''}`} onClick={() => setActiveRound(r)}>
              {r}
            </button>
          ))}
        </div>

        {/* Matches */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0.75rem', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text3)' }}>
            <span>PARTIDO</span>
            <span style={{ textAlign: 'center' }}>MARCADOR</span>
            <span style={{ textAlign: 'center' }}>PENALES</span>
            <span></span>
          </div>
          {filtered.map(m => (
            <AdminMatchRow key={m.id} match={m} onUpdate={handleUpdate} />
          ))}
        </div>

        <div style={{ marginTop: '1.5rem' }} className="alert alert-info">
          💡 <strong>Cómo usar:</strong> Edita los nombres de los equipos cuando se definan los clasificados (ej: cambia "1A" por "Argentina"). Ingresa el marcador al tiempo regular. Si hubo penales, ingresa ese resultado también.
        </div>
      </div>
    </Layout>
  );
}
