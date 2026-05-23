import Layout from '../components/Layout';
import { useAuth } from './_app';
import { getUserLevel } from '../lib/userLevels';

const MEDALS = ['🥇','🥈','🥉'];

export default function Leaderboard({ leaderboard, lastUpdated }) {
  const { user } = useAuth();
  const myEntry = user ? leaderboard.find(e => e.id === user.id) : null;
  const myRank  = myEntry ? leaderboard.indexOf(myEntry) + 1 : null;

  const avgPts  = leaderboard.length ? (leaderboard.reduce((s,e)=>s+e.totalPoints,0)/leaderboard.length).toFixed(1) : 0;

  return (
    <Layout title="Tabla de Posiciones" description="Tabla de posiciones en vivo de la Polla Mundialista 2026. Niveles, rachas y estilos de predicción.">
      <div className="container page">
        <div className="page-header">
          <h1>Tabla de Posiciones</h1>
          <p>Actualizada automáticamente · {leaderboard.length} participantes</p>
        </div>

        {myEntry && (
          <div className="alert alert-success" style={{ marginBottom:'1.5rem' }}>
            Tu posición: <strong>#{myRank}</strong> con <strong>{myEntry.totalPoints} puntos</strong>
            {myRank===1 && ' 👑 ¡Vas primero!'}
          </div>
        )}

        <div className="stats-grid" style={{ marginBottom:'2rem' }}>
          <div className="stat-card"><div className="stat-value">{leaderboard.length}</div><div className="stat-label">Participantes</div></div>
          <div className="stat-card"><div className="stat-value gold">{leaderboard[0]?.totalPoints ?? 0}</div><div className="stat-label">Puntaje líder</div></div>
          <div className="stat-card"><div className="stat-value light">{avgPts}</div><div className="stat-label">Promedio pts</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color:'#4ADE80' }}>{leaderboard.reduce((s,e)=>s+e.exactScores,0)}</div><div className="stat-label">Exactos totales</div></div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">⏳</div><h3>Sin participantes</h3><p>Invita amigos para que se registren.</p></div>
        ) : (
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ padding:'0.875rem 1.5rem', borderBottom:'1px solid var(--off-white)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h2 style={{ fontFamily:'var(--font-head)', fontSize:'1.1rem', letterSpacing:'0.5px', color:'var(--text-on-card)' }}>Clasificación General</h2>
              <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Actualizado: {new Date(lastUpdated).toLocaleTimeString('es-CO')}</span>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table className="lb-table">
                <thead>
                  <tr>
                    <th style={{ width:48 }}>#</th>
                    <th>Participante</th>
                    <th className="center">PTS</th>
                    <th className="center">Nivel</th>
                    <th className="center">🎯 Exactos</th>
                    <th className="center">✨ Total G</th>
                    <th className="center">👍 Parcial</th>
                    <th className="center">Jugados</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((e,i) => {
                    const isMe = user && e.id === user.id;
                    const level = getUserLevel(e.totalPoints);
                    return (
                      <tr key={e.id} className={`lb-row${isMe?' is-me':''}`}>
                        <td>
                          <div className={`lb-rank rank-${i+1}`}>{i<3 ? MEDALS[i] : i+1}</div>
                        </td>
                        <td>
                          <div className="lb-name">
                            {e.name}
                            {isMe && <span style={{ fontSize:'0.68rem', background:'var(--gold)', color:'#000', borderRadius:3, padding:'1px 5px', marginLeft:6, fontWeight:800 }}>TÚ</span>}
                          </div>
                        </td>
                        <td className="lb-pts">{e.totalPoints}</td>
                        <td className="center">
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:level.color }}>{level.icon} {level.label}</span>
                        </td>
                        <td className="center"><span className="stat-chip chip-green">{e.exactScores}</span></td>
                        <td className="center"><span className="stat-chip chip-amber">{e.totalGoals}</span></td>
                        <td className="center"><span className="stat-chip chip-purple">{e.partials}</span></td>
                        <td className="center"><span className="stat-chip chip-gray">{e.played}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ marginTop:'1.5rem', display:'flex', gap:'1rem', flexWrap:'wrap', fontSize:'0.75rem', color:'rgba(255,255,255,0.5)' }}>
          <span>Leyenda: 🎯 Exacto = 3pts · ✨ Total goles = 2pts · 👍 Parcial = 1pt</span>
          <span>Niveles: ⚽ Novato → 📊 Analista → 🔮 Experto → 🏆 Gurú Mundialista</span>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps() {
  const { db } = await import('../lib/db');
  const { calculateLeaderboard } = await import('../lib/scoring');
  const users = db.users.getAll();
  const matches = db.matches.getAll();
  const predictions = db.predictions.getAll();
  const leaderboard = calculateLeaderboard(users, matches, predictions);
  return { props: { leaderboard, lastUpdated: new Date().toISOString() } };
}
