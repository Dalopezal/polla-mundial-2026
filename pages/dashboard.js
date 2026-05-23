import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from './_app';
import { calculatePoints, getPointLabel } from '../lib/scoring';
import { getMatchStatus, statusLabel, formatMatchDate, daysUntilDeadline, DEADLINE_ISO } from '../lib/matchStatus';
import { LEVELS, PERSONALITIES } from '../lib/userLevels';

function StatusDot({ status }) {
  const sl = statusLabel(status);
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:sl.dot, display:'inline-block', animation:sl.pulse?'pulseDot 1.4s ease-in-out infinite':'none' }}/>
      <span style={{ fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.5px', textTransform:'uppercase', color:sl.color }}>{sl.text}</span>
      <style>{`@keyframes pulseDot{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </span>
  );
}

// Comments/Bets modal
function BetsModal({ match, onClose }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetch(`/api/comments?matchId=${match.id}`).then(r => r.json()).then(setData).catch(() => {});
  }, [match.id]);

  const postComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    await fetch(`/api/comments?matchId=${match.id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text:comment, type:'comment' }) });
    const r = await fetch(`/api/comments?matchId=${match.id}`);
    setData(await r.json());
    setComment('');
    setPosting(false);
  };

  const react = async (predUserId, reaction) => {
    await fetch(`/api/comments?matchId=${match.id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'reaction', predUserId, reaction }) });
    const r = await fetch(`/api/comments?matchId=${match.id}`);
    setData(await r.json());
  };

  const REACTIONS = ['🔥','😮','🤣','💀','🎯','👏','🤡','💪'];
  const hasResult = match.homeScore !== null;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={onClose}>
      <div style={{ background:'white', borderRadius:12, width:'100%', maxWidth:520, maxHeight:'80vh', overflow:'hidden', display:'flex', flexDirection:'column' }} onClick={e=>e.stopPropagation()}>
        <div style={{ background:'var(--banner)', padding:'1rem 1.25rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:'var(--font-head)', fontSize:'1rem', letterSpacing:'0.5px', color:'var(--gold)' }}>{match.round}</div>
            <div style={{ fontFamily:'var(--font-head)', fontSize:'1.2rem', color:'white', letterSpacing:'0.5px' }}>{match.homeTeam} vs {match.awayTeam}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', fontSize:'1.5rem', cursor:'pointer', lineHeight:1 }}>×</button>
        </div>
        <div style={{ flex:1, overflow:'auto', padding:'1rem 1.25rem', background:'var(--off-white)' }}>
          <div style={{ fontFamily:'var(--font-head)', fontSize:'0.8rem', letterSpacing:'1px', color:'var(--text-muted)', marginBottom:'0.75rem', textTransform:'uppercase' }}>
            Pronósticos de todos ({data?.bets?.length || 0})
          </div>
          {data?.bets?.map(bet => (
            <div key={bet.userId} style={{ background:'white', borderRadius:8, padding:'0.875rem', marginBottom:'0.625rem', border:'1px solid var(--card-border)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <div style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-on-card)' }}>
                  {bet.userId === user?.id ? `${bet.userName} (tú)` : bet.userName}
                </div>
                <div style={{ fontFamily:'var(--font-head)', fontSize:'1.3rem', color: hasResult ? (
                  bet.homeScore === match.homeScore && bet.awayScore === match.awayScore ? '#16A34A' :
                  bet.homeScore !== null ? 'var(--crimson)' : '#9CA3AF'
                ) : 'var(--text-on-card)' }}>
                  {bet.homeScore !== null ? `${bet.homeScore}–${bet.awayScore}` : '?–?'}
                </div>
              </div>
              {user && bet.userId !== user.id && (
                <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                  {REACTIONS.map(r => (
                    <button key={r} onClick={() => react(bet.userId, r)} style={{ background:'none', border:'1px solid var(--card-border)', borderRadius:4, padding:'2px 6px', fontSize:'0.875rem', cursor:'pointer', transition:'all .15s', ...(bet.reactions?.[r] ? { background:'#FEF3C7', borderColor:'#FDE68A' } : {}) }}>
                      {r}{bet.reactions?.[r] ? ` ${bet.reactions[r]}` : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {data?.bets?.length === 0 && <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', textAlign:'center', padding:'1rem' }}>Sin pronósticos aún.</p>}

          <div style={{ fontFamily:'var(--font-head)', fontSize:'0.8rem', letterSpacing:'1px', color:'var(--text-muted)', margin:'1rem 0 0.75rem', textTransform:'uppercase' }}>
            Comentarios ({data?.comments?.length || 0})
          </div>
          {data?.comments?.map(c => (
            <div key={c.id} style={{ background:'white', borderRadius:8, padding:'0.75rem', marginBottom:'0.5rem', border:'1px solid var(--card-border)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ fontWeight:700, fontSize:'0.78rem', color:'var(--crimson)' }}>{c.userName}</span>
                <span style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' })}</span>
              </div>
              <p style={{ fontSize:'0.82rem', color:'var(--text-on-card)', lineHeight:1.5 }}>{c.text}</p>
            </div>
          ))}
        </div>
        {user && (
          <div style={{ padding:'0.875rem 1.25rem', borderTop:'1px solid var(--card-border)', background:'white', display:'flex', gap:8 }}>
            <input value={comment} onChange={e=>setComment(e.target.value)} onKeyDown={e=>e.key==='Enter'&&postComment()}
              placeholder="Comenta este partido... (Enter para enviar)"
              maxLength={280}
              style={{ flex:1, background:'var(--off-white)', border:'1.5px solid var(--card-border)', borderRadius:6, padding:'8px 12px', fontFamily:'var(--font-body)', fontSize:'0.875rem', outline:'none', color:'var(--text-on-card)' }} />
            <button onClick={postComment} disabled={posting||!comment.trim()} className="btn btn-primary btn-sm">
              {posting ? '...' : 'Enviar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({ match, prediction, onSave, globalLocked, onOpenBets }) {
  const [home,setHome]   = useState(prediction?.homeScore ?? '');
  const [away,setAway]   = useState(prediction?.awayScore ?? '');
  const [saving,setSaving] = useState(false);
  const [saved,setSaved]   = useState(false);
  const [dirty,setDirty]   = useState(false);
  const [err,setErr]       = useState('');

  useEffect(() => { setHome(prediction?.homeScore ?? ''); setAway(prediction?.awayScore ?? ''); setDirty(false); setSaved(false); }, [prediction]);

  const status = getMatchStatus(match);
  const isEditable = !globalLocked && status === 'upcoming';

  const change = setter => e => {
    const v = e.target.value;
    if (v === '' || (Number(v) >= 0 && Number(v) <= 30)) { setter(v); setDirty(true); setSaved(false); setErr(''); }
  };

  const save = async () => {
    if (!dirty || !isEditable) return;
    setSaving(true); setErr('');
    try {
      const r = await fetch('/api/predictions', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ matchId:match.id, homeScore:home===''?null:home, awayScore:away===''?null:away }) });
      const d = await r.json();
      if (!r.ok) { setErr(d.error); return; }
      onSave(d.prediction); setSaved(true); setDirty(false);
    } catch { setErr('Error de red.'); } finally { setSaving(false); }
  };

  const hasResult = match.homeScore !== null;
  const hasPred   = prediction?.homeScore !== null && prediction?.awayScore !== null;
  const pts       = hasPred && hasResult ? calculatePoints(prediction, match) : null;
  const ptInfo    = pts !== null ? getPointLabel(pts) : null;
  const ptsBg     = pts===3?'#DCFCE7':pts===2?'#FEF3C7':'#EDE9FE';
  const ptsTc     = pts===3?'#166534':pts===2?'#92400E':'#5B21B6';

  return (
    <div className="match-card">
      <div className="match-card-header">
        <span className="match-round">{match.round}</span>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {match.venue && <span style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.35)' }}>📍{match.venue}</span>}
          <StatusDot status={status} />
        </div>
      </div>
      <div style={{ padding:'4px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between' }}>
        <span style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.4)' }}>{formatMatchDate(match.date)}</span>
      </div>

      <div className="match-body">
        <div className="match-teams">
          <div className={`team-name home${hasResult&&match.homeScore>match.awayScore?' winner':''}`}>{match.homeTeam}</div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
            {hasResult ? (
              <div className="result-display">
                <span className={`result-score${match.homeScore>match.awayScore?' winner-score':''}`}>{match.homeScore}</span>
                <span className="result-dash">–</span>
                <span className={`result-score${match.awayScore>match.homeScore?' winner-score':''}`}>{match.awayScore}</span>
              </div>
            ) : isEditable ? (
              <div className="score-inputs">
                <input type="number" inputMode="numeric" className="score-input" min="0" max="30" placeholder="?" value={home} onChange={change(setHome)} onBlur={save} />
                <span className="score-sep">–</span>
                <input type="number" inputMode="numeric" className="score-input" min="0" max="30" placeholder="?" value={away} onChange={change(setAway)} onBlur={save} />
              </div>
            ) : (
              <div className="result-display">
                <span className="result-score" style={{ color:hasPred?'var(--text-on-card)':'#CCC' }}>{hasPred?prediction.homeScore:'–'}</span>
                <span className="result-dash">–</span>
                <span className="result-score" style={{ color:hasPred?'var(--text-on-card)':'#CCC' }}>{hasPred?prediction.awayScore:'–'}</span>
              </div>
            )}
            {match.homePens !== null && <span style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>Pen. {match.homePens}–{match.awayPens}</span>}
          </div>
          <div className={`team-name away${hasResult&&match.awayScore>match.homeScore?' winner':''}`}>{match.awayTeam}</div>
        </div>
      </div>

      <div className="match-footer">
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          {ptInfo && hasResult && <span className="pts-badge" style={{ background:ptsBg, color:ptsTc, border:`1px solid ${ptsTc}30` }}>{ptInfo.label} · +{pts}</span>}
          {status==='past_pending' && <span style={{ fontSize:'0.7rem', color:'#D97706', fontWeight:600 }}>Esperando resultado</span>}
          {hasResult && hasPred && <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>Tu apuesta: <strong style={{ color:'var(--text-on-card)' }}>{prediction.homeScore}–{prediction.awayScore}</strong></span>}
          {!hasPred && !hasResult && status==='upcoming' && !globalLocked && <span style={{ fontSize:'0.7rem', color:'#9CA3AF' }}>Sin pronóstico</span>}
        </div>
        <div style={{ display:'flex', gap:5 }}>
          <button onClick={() => onOpenBets(match)} style={{ background:'none', border:'1px solid var(--card-border)', borderRadius:'var(--radius-sm)', padding:'4px 10px', fontSize:'0.7rem', fontWeight:700, cursor:'pointer', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.3px' }}>
            Ver apuestas
          </button>
          {isEditable && (
            <button onClick={save} disabled={saving||!dirty} className={`save-btn${saved?' saved':''}`}>
              {saving ? '···' : saved ? 'Guardado' : 'Guardar'}
            </button>
          )}
        </div>
      </div>
      {err && <div style={{ padding:'6px 14px', background:'#FEF2F2', borderTop:'1px solid #FEE2E2', fontSize:'0.75rem', color:'#991B1B' }}>{err}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [matches,     setMatches]     = useState([]);
  const [predictions, setPredictions] = useState({});
  const [activeRound, setActiveRound] = useState('Todos');
  const [activeStatus,setActiveStatus]= useState('Todos');
  const [search,      setSearch]      = useState('');
  const [toast,       setToast]       = useState(null);
  const [deadlinePassed, setDeadlinePassed] = useState(false);
  const [deadlineISO, setDeadlineISO] = useState(DEADLINE_ISO);
  const [betsModal,   setBetsModal]   = useState(null);
  const [userMeta,    setUserMeta]    = useState(null);
  const [stats, setStats] = useState({ pts:0, exact:0, played:0, pending:0 });

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

  const loadData = useCallback(async () => {
    const [mRes, pRes] = await Promise.all([fetch('/api/matches'), fetch('/api/predictions')]);
    const [mData, pData] = await Promise.all([mRes.json(), pRes.json()]);
    setMatches(mData.matches || []);
    setDeadlinePassed(pData.deadlinePassed || false);
    if (pData.deadline) setDeadlineISO(pData.deadline);
    const predMap = {};
    (pData.predictions || []).forEach(p => { predMap[p.matchId] = p; });
    setPredictions(predMap);
  }, []);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  // Load user meta (level, streak, etc.)
  useEffect(() => {
    if (!user) return;
    fetch('/api/user-meta').then(r => r.json()).then(setUserMeta).catch(() => {});
  }, [user, predictions]);

  useEffect(() => {
    let pts=0, exact=0, played=0, pending=0;
    matches.forEach(m => {
      const p = predictions[m.id];
      const st = getMatchStatus(m);
      if (st==='past_pending') pending++;
      if (!p || m.homeScore===null || p.homeScore===null) return;
      played++;
      const score = calculatePoints(p, m);
      pts += score;
      if (score === 3) exact++;
    });
    setStats({ pts, exact, played, pending });
  }, [matches, predictions]);

  const handleSave = pred => {
    setPredictions(prev => ({ ...prev, [pred.matchId]: pred }));
    showToast('Pronóstico guardado');
  };

  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const rounds = [...new Set(matches.map(m => m.round))];
  const counts = matches.reduce((acc, m) => { acc[getMatchStatus(m)] = (acc[getMatchStatus(m)]||0)+1; return acc; }, {});
  const filtered = matches.filter(m => {
    const st = getMatchStatus(m);
    if (activeRound !== 'Todos' && m.round !== activeRound) return false;
    if (activeStatus !== 'Todos') {
      const map = {'Próximos':'upcoming','En curso':'live','Finalizados':'finished','Pendientes':'past_pending'};
      if (st !== map[activeStatus]) return false;
    }
    if (search) { const q = search.toLowerCase(); if (!m.homeTeam.toLowerCase().includes(q) && !m.awayTeam.toLowerCase().includes(q)) return false; }
    return true;
  });

  if (!user) return null;

  const level = userMeta ? (LEVELS.find(l => userMeta.pts >= l.min && (LEVELS[LEVELS.indexOf(l)+1]?.min > userMeta.pts || !LEVELS[LEVELS.indexOf(l)+1])) || LEVELS[LEVELS.length-1]) : null;
  const personality = userMeta?.personality ? PERSONALITIES[userMeta.personality.type] : null;

  const deadlineDate = new Date(deadlineISO).toLocaleDateString('es-CO', { day:'numeric', month:'long', year:'numeric' });

  return (
    <Layout title="Mis Pronósticos" description="Gestiona tus pronósticos para el Mundial 2026">
      {betsModal && <BetsModal match={betsModal} onClose={() => setBetsModal(null)} />}
      <div className="container page">
        <div className="page-header">
          <h1>Mis Pronósticos</h1>
          <p>Los puntos se calculan automáticamente cuando el administrador carga el resultado oficial.</p>
        </div>

        {/* User level + personality strip */}
        {userMeta && (
          <div style={{ background:'var(--banner)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'var(--radius)', padding:'1rem 1.5rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'1.5rem', flexWrap:'wrap' }}>
            {userMeta.level && (() => { const l = LEVELS.find(x => x.id === userMeta.level.id) || LEVELS[0]; return (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:'1.5rem' }}>{l.icon}</span>
                <div>
                  <div style={{ fontFamily:'var(--font-head)', fontSize:'1rem', color:l.color, letterSpacing:'0.5px' }}>{l.label}</div>
                  <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.45)' }}>{l.desc}</div>
                </div>
              </div>
            );})()}
            {personality && (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:'1.3rem' }}>{personality.icon}</span>
                <div>
                  <div style={{ fontFamily:'var(--font-head)', fontSize:'0.9rem', color:personality.color, letterSpacing:'0.3px' }}>{personality.label} {userMeta.personality?.pct}%</div>
                  <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.4)' }}>{personality.desc}</div>
                </div>
              </div>
            )}
            {userMeta.streak?.currentStreak > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:'1.2rem' }}>🔥</span>
                <div>
                  <div style={{ fontFamily:'var(--font-head)', fontSize:'1rem', color:'var(--gold)' }}>Racha {userMeta.streak.currentStreak}</div>
                  <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.4)' }}>resultados correctos seguidos</div>
                </div>
              </div>
            )}
            {(userMeta.achievements?.length || 0) > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:'1.2rem' }}>🏅</span>
                <div>
                  <div style={{ fontFamily:'var(--font-head)', fontSize:'1rem', color:'#FCD34D' }}>{userMeta.achievements.length} logros</div>
                  <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.4)' }}>desbloqueados</div>
                </div>
              </div>
            )}
            <a href="/iq" style={{ marginLeft:'auto', color:'rgba(255,255,255,0.5)', fontSize:'0.75rem', fontWeight:700, textDecoration:'none', textTransform:'uppercase', letterSpacing:'0.5px' }}>Ver mi IQ →</a>
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-value gold">{stats.pts}</div><div className="stat-label">Puntos</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color:'#4ADE80' }}>{stats.exact}</div><div className="stat-label">Exactos</div></div>
          <div className="stat-card"><div className="stat-value light">{stats.played}</div><div className="stat-label">Jugados</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color:'#FCD34D' }}>{stats.pending}</div><div className="stat-label">Pendientes</div></div>
        </div>

        {/* Deadline banner */}
        {deadlinePassed ? (
          <div style={{ background:'rgba(220,38,38,0.1)', border:'2px solid var(--crimson)', borderRadius:'var(--radius-sm)', padding:'0.875rem 1.25rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:10 }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="#EF4444" style={{ flexShrink:0 }}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5zm-.75 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>
            <div>
              <strong style={{ color:'#FCA5A5', fontSize:'0.875rem' }}>Pronósticos cerrados</strong>
              <p style={{ color:'rgba(252,165,165,0.7)', fontSize:'0.78rem', marginTop:2 }}>Fecha límite: {deadlineDate}. Puedes ver resultados pero no editar.</p>
            </div>
          </div>
        ) : (
          <div className="alert alert-info" style={{ marginBottom:'1.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink:0 }}><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
            Fecha límite: <strong>{deadlineDate}</strong>. Partidos pasados no se pueden editar.
          </div>
        )}

        {/* Filters */}
        <div className="filter-bar">
          <input type="text" className="search-input" placeholder="Buscar equipo..." value={search} onChange={e=>setSearch(e.target.value)} />
          {['Todos','Próximos','En curso','Finalizados','Pendientes'].map(s => {
            const map = {'Próximos':'upcoming','En curso':'live','Finalizados':'finished','Pendientes':'past_pending'};
            const count = s==='Todos' ? matches.length : (counts[map[s]]||0);
            return (
              <button key={s} className={`filter-chip${activeStatus===s?' active':''}`} onClick={()=>setActiveStatus(s)}>
                {s}{count>0 && <span style={{ marginLeft:4, background:'rgba(255,255,255,0.12)', borderRadius:3, padding:'0 4px', fontSize:'0.62rem' }}>{count}</span>}
              </button>
            );
          })}
        </div>

        <div className="tabs">
          {['Todos',...rounds].map(r => (
            <button key={r} className={`tab${activeRound===r?' active':''}`} onClick={()=>setActiveRound(r)}>{r.replace('Grupo ','')}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div>
            <h3>Sin resultados</h3>
            <p>Prueba otro filtro o búsqueda.</p>
          </div>
        ) : (
          <div className="matches-grid">
            {filtered.map(match => (
              <MatchCard key={match.id} match={match} prediction={predictions[match.id]||null} onSave={handleSave} globalLocked={deadlinePassed} onOpenBets={setBetsModal} />
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/></svg>
          {toast.msg}
        </div>
      )}
    </Layout>
  );
}
