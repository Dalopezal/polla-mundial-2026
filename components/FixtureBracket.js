import { calculatePoints } from '../lib/scoring';

function MatchSlot({ match, prediction, showPrediction, slotNum }) {
  if (!match) return <div style={{ height: 64, margin: '3px 5px' }} />;

  const hasResult = match.homeScore !== null && match.awayScore !== null;
  const homeWins  = hasResult && match.homeScore > match.awayScore;
  const awayWins  = hasResult && match.awayScore > match.homeScore;
  const pts       = prediction && hasResult ? calculatePoints(prediction, match) : null;
  const ptColor   = pts === 3 ? '#16A34A' : pts === 2 ? '#D97706' : pts === 1 ? '#6D28D9' : null;

  const isTBD = n => !n || n.startsWith('W(') || n.startsWith('L(') || /^\d[A-Z]/.test(n) || n.startsWith('3');

  return (
    <div style={{ position: 'relative', margin: '3px 5px' }}>
      {slotNum && (
        <div style={{
          position:'absolute', right:-9, top:'50%', transform:'translateY(-50%)',
          width:18, height:18, borderRadius:'50%',
          background:'#1A1A26', color:'#fff',
          fontSize:'0.58rem', fontWeight:800,
          display:'flex', alignItems:'center', justifyContent:'center',
          zIndex:2, border:'2px solid #9B1535', lineHeight:1
        }}>{slotNum}</div>
      )}
      {showPrediction && prediction && (
        <div style={{
          position:'absolute', top:-20, left:'50%', transform:'translateX(-50%)',
          background: ptColor ? `${ptColor}22` : 'rgba(0,0,0,0.55)',
          border:`1px solid ${ptColor || 'rgba(255,255,255,0.2)'}`,
          borderRadius:3, padding:'1px 7px',
          fontSize:'0.65rem', fontWeight:700, fontFamily:'Plus Jakarta Sans, sans-serif',
          color: ptColor || '#ddd', whiteSpace:'nowrap', zIndex:3
        }}>
          {prediction.homeScore ?? '?'}–{prediction.awayScore ?? '?'}
          {pts !== null && ` · ${pts}pts`}
        </div>
      )}
      <div className="bm-slot">
        <div className={`bm-team-row${homeWins ? ' winner-row' : ''}`}>
          <span className={`bm-name${isTBD(match.homeTeam) ? ' tbd' : homeWins ? ' winner-name' : ''}`}>
            {match.homeTeam || 'Por definir'}
          </span>
          {hasResult
            ? <div className={`bm-score${homeWins ? ' winner-s' : ''}`}>{match.homeScore}</div>
            : <div className="bm-score tbd-s">–</div>}
        </div>
        <div className={`bm-team-row${awayWins ? ' winner-row' : ''}`}>
          <span className={`bm-name${isTBD(match.awayTeam) ? ' tbd' : awayWins ? ' winner-name' : ''}`}>
            {match.awayTeam || 'Por definir'}
          </span>
          {hasResult
            ? <div className={`bm-score${awayWins ? ' winner-s' : ''}`}>{match.awayScore}</div>
            : <div className="bm-score tbd-s">–</div>}
        </div>
      </div>
    </div>
  );
}

function ColLabel({ label }) {
  return <div className="bracket-col-label">{label}</div>;
}

const SH = 70; // slot height

export default function FixtureBracket({ matches, predictions = [], showPredictions = false }) {
  const byId = {};
  matches.forEach(m => { byId[m.id] = m; });
  const predMap = {};
  predictions.forEach(p => { predMap[p.matchId] = p; });
  const r   = id => byId[id] || null;
  const pr  = id => showPredictions ? (predMap[id] || null) : null;

  const r32 = Array.from({ length: 16 }, (_, i) => r(`r${String(i+1).padStart(3,'0')}`));
  const r16 = Array.from({ length: 8  }, (_, i) => r(`o${String(i+1).padStart(3,'0')}`));
  const qf  = Array.from({ length: 4  }, (_, i) => r(`q${String(i+1).padStart(3,'0')}`));
  const sf  = [r('s001'), r('s002')];
  const tp  = r('t001');
  const fin = r('f001');

  const col = { display:'flex', flexDirection:'column' };
  const Gap = ({ h }) => <div style={{ height: h }} />;

  return (
    <div className="bracket-wrapper">
      <div style={{ minWidth: 1100, padding: '0 0.5rem', userSelect: 'none' }}>

        {/* Headers */}
        <div style={{ display:'grid', gridTemplateColumns:'160px 155px 148px 140px 80px 140px 148px 155px 160px', marginBottom:2 }}>
          <ColLabel label="Dieciseisavos" />
          <ColLabel label="Octavos" />
          <ColLabel label="Cuartos" />
          <ColLabel label="Semifinal" />
          <div style={{ margin:'0 5px 6px', display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
            <div style={{ background:'#8B1535', border:'1px solid rgba(255,255,255,0.2)', borderRadius:3, padding:'5px 4px', textAlign:'center', fontFamily:'Bebas Neue, sans-serif', fontSize:'0.6rem', letterSpacing:'2px', color:'#F0A500', width:'100%' }}>FINAL</div>
          </div>
          <ColLabel label="Semifinal" />
          <ColLabel label="Cuartos" />
          <ColLabel label="Octavos" />
          <ColLabel label="Dieciseisavos" />
        </div>

        {/* Bracket */}
        <div style={{ display:'grid', gridTemplateColumns:'160px 155px 148px 140px 80px 140px 148px 155px 160px' }}>

          {/* L R32 (slots 1-8) */}
          <div style={col}>
            {[0,1,2,3,4,5,6,7].map(i => (
              <div key={i}>
                <MatchSlot match={r32[i]} prediction={pr(`r${String(i+1).padStart(3,'0')}`)} showPrediction={showPredictions} slotNum={i+1} />
                {i % 2 === 0 && <Gap h={SH * 0.3} />}
                {i === 3 && <Gap h={SH * 0.8} />}
              </div>
            ))}
          </div>

          {/* L R16 (octavos) */}
          <div style={col}>
            <Gap h={SH * 0.65 + 3} />
            <MatchSlot match={r16[0]} prediction={pr('o001')} showPrediction={showPredictions} />
            <Gap h={SH * 1.4 + 6} />
            <MatchSlot match={r16[1]} prediction={pr('o002')} showPrediction={showPredictions} />
            <Gap h={SH * 1.4 + 6} />
            <MatchSlot match={r16[2]} prediction={pr('o003')} showPrediction={showPredictions} />
            <Gap h={SH * 1.4 + 6} />
            <MatchSlot match={r16[3]} prediction={pr('o004')} showPrediction={showPredictions} />
          </div>

          {/* L QF */}
          <div style={col}>
            <Gap h={SH * 2.1 + 12} />
            <MatchSlot match={qf[0]} prediction={pr('q001')} showPrediction={showPredictions} />
            <Gap h={SH * 4.2 + 24} />
            <MatchSlot match={qf[1]} prediction={pr('q002')} showPrediction={showPredictions} />
          </div>

          {/* L SF */}
          <div style={col}>
            <Gap h={SH * 4.5 + 32} />
            <MatchSlot match={sf[0]} prediction={pr('s001')} showPrediction={showPredictions} />
          </div>

          {/* CENTER */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
            <Gap h={SH * 5 + 50} />
            <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'0.58rem', letterSpacing:'2px', color:'#F0A500', marginBottom:3, textAlign:'center' }}>19/7</div>
            <MatchSlot match={fin}  prediction={pr('f001')} showPrediction={showPredictions} />
            <Gap h={18} />
            <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'0.52rem', letterSpacing:'1.5px', color:'rgba(255,255,255,0.35)', marginBottom:3, textAlign:'center' }}>3° · 18/7</div>
            <MatchSlot match={tp}   prediction={pr('t001')} showPrediction={showPredictions} />
          </div>

          {/* R SF */}
          <div style={col}>
            <Gap h={SH * 4.5 + 32} />
            <MatchSlot match={sf[1]} prediction={pr('s002')} showPrediction={showPredictions} />
          </div>

          {/* R QF */}
          <div style={col}>
            <Gap h={SH * 2.1 + 12} />
            <MatchSlot match={qf[2]} prediction={pr('q003')} showPrediction={showPredictions} />
            <Gap h={SH * 4.2 + 24} />
            <MatchSlot match={qf[3]} prediction={pr('q004')} showPrediction={showPredictions} />
          </div>

          {/* R R16 (octavos) */}
          <div style={col}>
            <Gap h={SH * 0.65 + 3} />
            <MatchSlot match={r16[4]} prediction={pr('o005')} showPrediction={showPredictions} />
            <Gap h={SH * 1.4 + 6} />
            <MatchSlot match={r16[5]} prediction={pr('o006')} showPrediction={showPredictions} />
            <Gap h={SH * 1.4 + 6} />
            <MatchSlot match={r16[6]} prediction={pr('o007')} showPrediction={showPredictions} />
            <Gap h={SH * 1.4 + 6} />
            <MatchSlot match={r16[7]} prediction={pr('o008')} showPrediction={showPredictions} />
          </div>

          {/* R R32 (slots 9-16) */}
          <div style={col}>
            {[8,9,10,11,12,13,14,15].map(i => (
              <div key={i}>
                <MatchSlot match={r32[i]} prediction={pr(`r${String(i+1).padStart(3,'0')}`)} showPrediction={showPredictions} slotNum={i+1} />
                {i % 2 === 0 && <Gap h={SH * 0.3} />}
                {i === 11 && <Gap h={SH * 0.8} />}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
