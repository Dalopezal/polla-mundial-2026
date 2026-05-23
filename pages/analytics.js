import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { PERSONALITIES, LEVELS } from '../lib/userLevels';

function MiniBar({ val, max, color }) {
  return (
    <div style={{ flex: 1, height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${max ? (val / max) * 100 : 0}%`, height: '100%', background: color, borderRadius: 3 }} />
    </div>
  );
}

function StatChip({ label, value, color = 'var(--crimson)' }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '1rem 1.25rem' }}>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('overview');

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout title="Dashboard Analítico">
      <div className="container page" style={{ textAlign: 'center', paddingTop: '5rem' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--crimson)', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 1rem' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>Calculando analítica...</p>
      </div>
    </Layout>
  );

  if (!data) return (
    <Layout title="Dashboard Analítico">
      <div className="container page">
        <div className="empty-state"><div className="empty-icon">📊</div><h3>Sin datos</h3><p>Regresa cuando haya más actividad en la polla.</p></div>
      </div>
    </Layout>
  );

  const g = data.globalStats;
  const personalityColors = { analytic: '#1D4ED8', risky: '#D97706', conservative: '#16A34A', emotional: 'var(--crimson)' };
  const levelColors = { novato: '#6B7280', analista: '#2563EB', experto: '#7C3AED', guru: '#B8860B' };

  return (
    <Layout title="Dashboard Analítico" description="Estadísticas condensadas de todos los participantes de la Polla Mundialista 2026.">
      <div className="container page">
        <div className="page-header">
          <h1>Dashboard Analítico</h1>
          <p>Vista global de todos los participantes · Actualizado en tiempo real</p>
        </div>

        {/* Global stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.875rem', marginBottom: '1.5rem' }}>
          <StatChip label="Participantes" value={g.totalUsers} color="var(--gold)" />
          <StatChip label="Pronósticos" value={g.totalPredictions} color="var(--crimson)" />
          <StatChip label="Partidos Jugados" value={`${g.playedMatches}/${g.totalMatches}`} color="#16A34A" />
          <StatChip label="Pts Promedio" value={g.avgPtsPerUser} color="#7C3AED" />
          <StatChip label="Comentarios" value={g.totalComments} color="#F0A500" />
          <StatChip label="Usuarios IA" value={g.aiUsers} color="#60A5FA" />
        </div>

        {/* View tabs */}
        <div className="tabs" style={{ marginBottom: '1.5rem' }}>
          {[['overview', '📊 General'], ['users', '👥 Usuarios'], ['matches', '⚽ Partidos'], ['distribution', '🎨 Distribuciones']].map(([id, label]) => (
            <button key={id} className={`tab${view === id ? ' active' : ''}`} onClick={() => setView(id)}>{label}</button>
          ))}
        </div>

        {/* OVERVIEW */}
        {view === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {/* Top 5 leaderboard */}
            <div className="card">
              <div className="card-header"><h3 className="card-title">🏆 Top 5 Clasificación</h3></div>
              {data.leaderboard.slice(0, 5).map((u, i) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 4 ? '1px solid var(--off-white)' : 'none' }}>
                  <span style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', width: 24, color: i < 3 ? ['#B8860B', '#708090', '#8B4513'][i] : 'var(--text-muted)', textAlign: 'center' }}>
                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                  </span>
                  <span style={{ flex: 1, fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-on-card)' }}>{u.name}</span>
                  <span style={{ fontFamily: 'var(--font-head)', fontSize: '1.2rem', color: 'var(--crimson)' }}>{u.totalPoints}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>pts</span>
                </div>
              ))}
            </div>

            {/* Top IQ */}
            <div className="card">
              <div className="card-header"><h3 className="card-title">🧠 Mejores predictores</h3></div>
              {data.topIQ.map((u, i) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < data.topIQ.length - 1 ? '1px solid var(--off-white)' : 'none' }}>
                  <span style={{ fontFamily: 'var(--font-head)', fontSize: '0.9rem', width: 20, color: 'var(--text-muted)', textAlign: 'center' }}>{i + 1}</span>
                  <span style={{ flex: 1, fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-on-card)' }}>{u.name}</span>
                  <MiniBar val={u.iq} max={200} color="#7C3AED" />
                  <span style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', color: '#7C3AED', minWidth: 36, textAlign: 'right' }}>{u.iq}</span>
                </div>
              ))}
            </div>

            {/* Top streaks */}
            <div className="card">
              <div className="card-header"><h3 className="card-title">🔥 Mejores Rachas</h3></div>
              {data.topStreaks.map((u, i) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < data.topStreaks.length - 1 ? '1px solid var(--off-white)' : 'none' }}>
                  <span style={{ fontSize: '1rem', width: 20, textAlign: 'center' }}>{i === 0 ? '🔥' : i === 1 ? '⚡' : '✨'}</span>
                  <span style={{ flex: 1, fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-on-card)' }}>{u.name}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: 4 }}>máx</span>
                  <span style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', color: 'var(--crimson)' }}>{u.maxStreak}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>| actual: {u.currentStreak}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USERS */}
        {view === 'users' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="lb-table">
                <thead>
                  <tr>
                    <th>Jugador</th>
                    <th className="center">Pts</th>
                    <th className="center">Nivel</th>
                    <th className="center">IQ</th>
                    <th className="center">Precisión</th>
                    <th className="center">Racha</th>
                    <th className="center">Estilo</th>
                    <th className="center">Logros</th>
                  </tr>
                </thead>
                <tbody>
                  {data.userStats.sort((a, b) => b.pts - a.pts).map(u => {
                    const p = PERSONALITIES[u.personality] || PERSONALITIES.analytic;
                    const l = LEVELS.find(x => x.id === u.level) || LEVELS[0];
                    return (
                      <tr key={u.id} className="lb-row">
                        <td><div className="lb-name">{u.name}</div></td>
                        <td className="lb-pts">{u.pts}</td>
                        <td className="center">
                          <span style={{ fontWeight: 700, color: l.color, fontSize: '0.82rem' }}>{l.icon} {l.label}</span>
                        </td>
                        <td className="center">
                          <span className="stat-chip" style={{ background: '#EDE9FE', color: '#5B21B6' }}>{u.iq}</span>
                        </td>
                        <td className="center">
                          <span className="stat-chip chip-green">{u.accuracy}%</span>
                        </td>
                        <td className="center">
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: u.currentStreak > 2 ? 'var(--crimson)' : 'var(--text-muted)' }}>
                            {u.currentStreak > 0 ? `🔥 ${u.currentStreak}` : u.maxStreak > 0 ? `max ${u.maxStreak}` : '-'}
                          </span>
                        </td>
                        <td className="center">
                          <span style={{ fontSize: '1rem' }}>{p.icon}</span>
                          <span style={{ fontSize: '0.7rem', color: p.color, marginLeft: 3, fontWeight: 700 }}>{u.personalityPct}%</span>
                        </td>
                        <td className="center">
                          <span className="stat-chip chip-amber">{u.achievementsCount}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MATCHES */}
        {view === 'matches' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="card">
              <div className="card-header"><h3 className="card-title">😤 Partidos más difíciles de predecir</h3></div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>Menor % de aciertos entre los participantes</p>
              {data.matchInsights.hardest.map((m, i) => (
                <div key={m.id} style={{ padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--off-white)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-on-card)' }}>{m.homeTeam} vs {m.awayTeam}</span>
                    <span style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', color: 'var(--crimson)' }}>{m.result}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>{m.round}</span>
                    <span>{m.accuracy}% aciertos ({m.correct}/{m.totalPredictions})</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-header"><h3 className="card-title">✅ Partidos más predecibles</h3></div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>Mayor % de aciertos entre los participantes</p>
              {data.matchInsights.easiest.map((m, i) => (
                <div key={m.id} style={{ padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--off-white)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-on-card)' }}>{m.homeTeam} vs {m.awayTeam}</span>
                    <span style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', color: '#16A34A' }}>{m.result}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>{m.round}</span>
                    <span>{m.accuracy}% aciertos ({m.correct}/{m.totalPredictions})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DISTRIBUTIONS */}
        {view === 'distribution' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div className="card">
              <div className="card-header"><h3 className="card-title">Estilos de predicción</h3></div>
              {Object.entries(data.personalityDist).map(([type, count]) => {
                const p = PERSONALITIES[type] || PERSONALITIES.analytic;
                const total = Object.values(data.personalityDist).reduce((s, v) => s + v, 0);
                return (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--off-white)' }}>
                    <span style={{ fontSize: '1.2rem' }}>{p.icon}</span>
                    <span style={{ flex: 1, fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-on-card)' }}>{p.label}</span>
                    <MiniBar val={count} max={total} color={p.color} />
                    <span style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', color: p.color, minWidth: 28, textAlign: 'right' }}>{count}</span>
                  </div>
                );
              })}
            </div>
            <div className="card">
              <div className="card-header"><h3 className="card-title">Distribución de niveles</h3></div>
              {LEVELS.map(l => {
                const count = data.levelDist[l.id] || 0;
                const total = Object.values(data.levelDist).reduce((s, v) => s + v, 0);
                return (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--off-white)' }}>
                    <span style={{ fontSize: '1.1rem' }}>{l.icon}</span>
                    <span style={{ flex: 1, fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-on-card)' }}>{l.label}</span>
                    <MiniBar val={count} max={total} color={l.color} />
                    <span style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', color: l.color, minWidth: 28, textAlign: 'right' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
