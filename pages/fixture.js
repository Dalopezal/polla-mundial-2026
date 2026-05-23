import { useState } from 'react';
import Layout from '../components/Layout';
import FixtureBracket from '../components/FixtureBracket';
import { getMatchStatus, statusLabel, formatMatchDate } from '../lib/matchStatus';

const GROUPS_2026 = ['Grupo A','Grupo B','Grupo C','Grupo D','Grupo E','Grupo F','Grupo G','Grupo H','Grupo I','Grupo J','Grupo K','Grupo L'];

function GroupTable({ matches, group }) {
  const teams = {};
  const gm = matches.filter(m => m.round === group);

  gm.forEach(m => {
    if (!teams[m.homeTeam]) teams[m.homeTeam] = { name:m.homeTeam, pts:0, pj:0, pg:0, pe:0, pp:0, gf:0, gc:0 };
    if (!teams[m.awayTeam]) teams[m.awayTeam] = { name:m.awayTeam, pts:0, pj:0, pg:0, pe:0, pp:0, gf:0, gc:0 };
    if (m.homeScore !== null && m.awayScore !== null) {
      const h=teams[m.homeTeam], a=teams[m.awayTeam];
      h.pj++; a.pj++; h.gf+=m.homeScore; h.gc+=m.awayScore; a.gf+=m.awayScore; a.gc+=m.homeScore;
      if (m.homeScore>m.awayScore)      { h.pts+=3; h.pg++; a.pp++; }
      else if (m.homeScore<m.awayScore) { a.pts+=3; a.pg++; h.pp++; }
      else                              { h.pts++; a.pts++; h.pe++; a.pe++; }
    }
  });

  const sorted = Object.values(teams).sort((a,b) => b.pts!==a.pts ? b.pts-a.pts : (b.gf-b.gc)-(a.gf-a.gc) || b.gf-a.gf);
  const groupLetter = group.split(' ')[1];

  return (
    <div className="card" style={{ padding:0, overflow:'hidden' }}>
      <div style={{ background:'var(--banner)', padding:'8px 14px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontFamily:'var(--font-head)', fontSize:'0.9rem', letterSpacing:'1.5px', color:'var(--gold)' }}>GRUPO {groupLetter}</span>
        <span style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.3)' }}>{sorted[0]?.name || '?'} · {sorted[1]?.name || '?'}</span>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.78rem' }}>
        <thead>
          <tr style={{ borderBottom:'1px solid var(--off-white)' }}>
            {['#','Selección','PJ','PG','PE','PP','GF','GC','DG','PTS'].map(h => (
              <th key={h} style={{ padding:'5px 8px', color:'var(--text-muted)', fontWeight:700, textAlign:h==='Selección'?'left':'center', textTransform:'uppercase', letterSpacing:'0.5px', fontSize:'0.65rem' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((t,i) => (
            <tr key={t.name} style={{ borderBottom:i<sorted.length-1?'1px solid var(--off-white)':'none', background:i<2?'rgba(240,165,0,0.04)':'transparent' }}>
              <td style={{ padding:'7px 8px', textAlign:'center', color:i<2?'var(--gold)':'var(--text-muted)', fontWeight:700 }}>{i+1}</td>
              <td style={{ padding:'7px 8px', fontWeight:600, whiteSpace:'nowrap', color:'var(--text-on-card)' }}>
                {i<2 && <span style={{ marginRight:4, fontSize:'0.65rem' }}>✓</span>}{t.name}
              </td>
              {[t.pj,t.pg,t.pe,t.pp,t.gf,t.gc,t.gf-t.gc].map((v,j) => (
                <td key={j} style={{ padding:'7px 8px', textAlign:'center', color:'var(--text-muted)' }}>{v}</td>
              ))}
              <td style={{ padding:'7px 8px', textAlign:'center', fontFamily:'var(--font-head)', fontWeight:700, color:'var(--crimson)', fontSize:'0.9rem' }}>{t.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MatchRow({ match }) {
  const status = getMatchStatus(match);
  const sl = statusLabel(status);
  const hasResult = match.homeScore !== null;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:'0.5rem', alignItems:'center', padding:'0.625rem 0', borderBottom:'1px solid var(--off-white)', opacity:status==='past_pending'?0.72:1 }}>
      <span style={{ textAlign:'right', fontWeight:700, fontSize:'0.82rem', color:hasResult&&match.homeScore>match.awayScore?'var(--crimson)':'var(--text-on-card)' }}>{match.homeTeam}</span>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, minWidth:95 }}>
        <span style={{ fontFamily:'var(--font-head)', textAlign:'center', fontSize:'1rem', color:hasResult?'var(--text-on-card)':'#BBB', letterSpacing:1 }}>
          {hasResult ? `${match.homeScore}  –  ${match.awayScore}` : formatMatchDate(match.date).slice(0,8)}
        </span>
        <span style={{ fontSize:'0.58rem', fontWeight:700, color:sl.color, letterSpacing:'0.5px', textTransform:'uppercase', background:sl.bg, padding:'1px 6px', borderRadius:3 }}>{sl.text}</span>
        {match.venue && <span style={{ fontSize:'0.58rem', color:'var(--text-muted)' }}>📍 {match.venue}</span>}
      </div>
      <span style={{ fontWeight:700, fontSize:'0.82rem', color:hasResult&&match.awayScore>match.homeScore?'var(--crimson)':'var(--text-on-card)' }}>{match.awayTeam}</span>
    </div>
  );
}

export default function Fixture({ matches }) {
  const [view, setView] = useState('groups');
  const [activeGroup, setActiveGroup] = useState('Grupo A');

  const knockoutMatches = matches.filter(m => !m.round.startsWith('Grupo'));
  const groupMatches    = matches.filter(m =>  m.round.startsWith('Grupo'));
  const currentGroupMatches = groupMatches.filter(m => m.round === activeGroup);

  return (
    <Layout title="Fixture Mundial 2026" description="Fixture completo del Mundial 2026 USA·Canadá·México. Grupos, eliminatorias, fechas y sedes de los 104 partidos.">
      <div className="container page">
        <div className="page-header">
          <h1>Fixture Mundial 2026</h1>
          <p>104 partidos · 48 selecciones · 16 sedes · 11 jun – 19 jul 2026</p>
        </div>

        {/* View tabs */}
        <div className="tabs">
          <button className={`tab${view==='groups'?'  active':''}`} onClick={() => setView('groups')}>Grupos</button>
          <button className={`tab${view==='bracket'?' active':''}`} onClick={() => setView('bracket')}>Eliminatorias</button>
        </div>

        {/* GROUP VIEW */}
        {view === 'groups' && (
          <>
            {/* Group selector */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:'1.5rem' }}>
              {GROUPS_2026.map(g => (
                <button key={g} onClick={()=>setActiveGroup(g)}
                  className={`filter-chip${activeGroup===g?' active':''}`}>
                  {g.replace('Grupo ','')}
                </button>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              {/* Group table */}
              <GroupTable matches={groupMatches} group={activeGroup} />

              {/* Group matches */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Partidos · {activeGroup}</h3>
                </div>
                {currentGroupMatches.map(m => <MatchRow key={m.id} match={m} />)}
                {currentGroupMatches.length === 0 && <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', padding:'1rem 0' }}>Sin partidos.</p>}
              </div>
            </div>

            {/* All 12 group standings */}
            <div style={{ marginTop:'2rem' }}>
              <h2 style={{ fontFamily:'var(--font-head)', fontSize:'1.3rem', letterSpacing:'1px', color:'white', marginBottom:'1rem' }}>Todas las Tablas</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))', gap:'0.875rem' }}>
                {GROUPS_2026.map(g => <GroupTable key={g} matches={groupMatches} group={g} />)}
              </div>
            </div>
          </>
        )}

        {/* BRACKET VIEW */}
        {view === 'bracket' && (
          <div className="card" style={{ padding:'1.25rem 0.5rem', overflow:'hidden' }}>
            <FixtureBracket matches={knockoutMatches} />
          </div>
        )}
      </div>
    </Layout>
  );
}

export async function getServerSideProps() {
  const { db } = await import('../lib/db');
  return { props: { matches: db.matches.getAll() } };
}
