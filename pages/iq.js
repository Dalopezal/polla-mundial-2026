import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from './_app';
import { PERSONALITIES } from '../lib/userLevels';

function RadarChart({ scores }) {
  const entries = Object.entries(scores);
  const cx = 110, cy = 110, r = 80;
  const n = entries.length;

  const point = (i, val) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const pct = Math.min(val, 100) / 100;
    return { x: cx + r * pct * Math.cos(angle), y: cy + r * pct * Math.sin(angle) };
  };

  const pts = entries.map(([, val], i) => point(i, val));
  const polyPts = pts.map(p => `${p.x},${p.y}`).join(' ');

  const labelPt = (i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + (r + 22) * Math.cos(angle), y: cy + (r + 22) * Math.sin(angle) };
  };

  const ICONS = { analytic:'🧠', risky:'🎲', conservative:'🛡', emotional:'🔥' };

  return (
    <svg viewBox="0 0 220 220" style={{ width: '100%', maxWidth: 220, margin: '0 auto', display: 'block' }}>
      {[20, 40, 60, 80, 100].map(pct => {
        const pts2 = entries.map((_, i) => point(i, pct));
        return <polygon key={pct} points={pts2.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none" stroke="#E5E7EB" strokeWidth="0.8" />;
      })}
      {entries.map((_, i) => {
        const p = point(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#E5E7EB" strokeWidth="0.8" />;
      })}
      <polygon points={polyPts} fill="rgba(208,20,60,0.2)" stroke="var(--crimson)" strokeWidth="2" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={4} fill="var(--crimson)" />)}
      {entries.map(([key], i) => {
        const lp = labelPt(i);
        return <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
          fontSize="12" fill="#6B7280">{ICONS[key]}</text>;
      })}
    </svg>
  );
}

function IQGauge({ iq }) {
  const pct = Math.min(iq / 200, 1);
  const startAngle = -Math.PI * 0.8;
  const endAngle = Math.PI * 0.8;
  const sweepAngle = endAngle - startAngle;
  const currentAngle = startAngle + sweepAngle * pct;

  const toXY = (angle, radius) => ({
    x: 100 + radius * Math.cos(angle),
    y: 100 + radius * Math.sin(angle),
  });

  const bg1 = toXY(startAngle, 70); const bg2 = toXY(endAngle, 70);
  const fg1 = toXY(startAngle, 70); const fg2 = toXY(currentAngle, 70);
  const needle = toXY(currentAngle, 60);

  const color = iq >= 150 ? '#16A34A' : iq >= 100 ? '#F0A500' : iq >= 60 ? '#1D4ED8' : '#6B7280';
  const rating = iq >= 150 ? 'Genio' : iq >= 100 ? 'Experto' : iq >= 60 ? 'Aprendiz' : 'Iniciante';

  return (
    <div style={{ textAlign: 'center' }}>
      <svg viewBox="0 0 200 120" style={{ width: '100%', maxWidth: 200, margin: '0 auto', display: 'block' }}>
        <path d={`M ${bg1.x} ${bg1.y} A 70 70 0 1 1 ${bg2.x} ${bg2.y}`}
          fill="none" stroke="#E5E7EB" strokeWidth="12" strokeLinecap="round" />
        <path d={`M ${fg1.x} ${fg1.y} A 70 70 0 ${pct > 0.5 ? 1 : 0} 1 ${fg2.x} ${fg2.y}`}
          fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
        <line x1="100" y1="100" x2={needle.x} y2={needle.y}
          stroke={color} strokeWidth="3" strokeLinecap="round" />
        <circle cx="100" cy="100" r="5" fill={color} />
        <text x="100" y="88" textAnchor="middle" fontSize="22" fontWeight="800" fill={color}>{iq}</text>
        <text x="100" y="102" textAnchor="middle" fontSize="10" fill="#6B7280">{rating}</text>
      </svg>
    </div>
  );
}

function StatBar({ label, value, max = 100, color = 'var(--crimson)' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: 5 }}>
        <span style={{ color: 'var(--text-on-card)' }}>{label}</span>
        <span style={{ color }}>{value}{typeof value === 'number' ? '%' : ''}</span>
      </div>
      <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .8s ease' }} />
      </div>
    </div>
  );
}

export default function IQPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    setFetching(true);
    fetch('/api/user-meta')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [user]);

  if (!user || fetching || !data) {
    return (
      <Layout title="Nivel de acierto">
        <div className="container page" style={{ textAlign: 'center', paddingTop: '5rem' }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--crimson)', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 1rem' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </Layout>
    );
  }

  const { iq, personality, level, streak, achievements } = data;
  const personalityDef = PERSONALITIES[personality?.type] || PERSONALITIES.analytic;

  return (
    <Layout title="Nivel de acierto" description="Descubre tu Qué tan bueno eres prediciendo y tu estilo de predicción.">
      <div className="container page">
        <div className="page-header">
          <h1>Qué tan bueno eres prediciendo</h1>
          <p>Descubre tu estilo de juego y cuánto aciertas en tus pronósticos</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>

          {/* IQ Score */}
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="card-header"><h3 className="card-title" style={{ margin: '0 auto' }}>Tu puntuación de predicción</h3></div>
            <IQGauge iq={iq?.iq || 0} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
              {[
                { label: 'Precisión', val: `${iq?.accuracy || 0}%` },
                { label: 'Exactos', val: `${iq?.exactRate || 0}%` },
                { label: 'Partidos', val: iq?.total || 0 },
                { label: 'Tendencia', val: `${iq?.trend > 0 ? '+' : ''}${iq?.trend || 0}%` },
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--off-white)', borderRadius: 6, padding: '8px 10px' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem', color: 'var(--text-on-card)', marginTop: 2 }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Personality */}
          <div className="card">
            <div className="card-header"><h3 className="card-title">Tu Estilo de Predicción</h3></div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 70, height: 70, background: `${personalityDef.bg}`, border: `2px solid ${personalityDef.color}40`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                {personalityDef.icon}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', letterSpacing: '1px', color: personalityDef.color }}>{personalityDef.label}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 3 }}>{personalityDef.desc}</div>
              </div>
              <div style={{ background: personalityDef.bg, border: `1px solid ${personalityDef.color}30`, borderRadius: 8, padding: '8px 20px' }}>
                <span style={{ fontFamily: 'var(--font-head)', fontSize: '1.8rem', color: personalityDef.color }}>{personality?.pct || 0}%</span>
                <span style={{ fontSize: '0.75rem', color: personalityDef.color, marginLeft: 4 }}>{personalityDef.label.toLowerCase()}</span>
              </div>

              {personality?.score && (
                <div style={{ width: '100%' }}>
                  <RadarChart scores={personality.score} />
                </div>
              )}
            </div>
          </div>

          {/* Level & Streak */}
          <div className="card">
            <div className="card-header"><h3 className="card-title">Nivel & Racha</h3></div>

            {/* Level */}
            <div style={{ padding: '1rem', background: 'var(--off-white)', borderRadius: 8, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: '2.5rem' }}>{level?.icon}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.4rem', color: level?.color || 'var(--text-on-card)', letterSpacing: '0.5px' }}>{level?.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{level?.desc}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>{data.pts} pts totales</div>
                </div>
              </div>
            </div>

            {/* Streaks */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[
                { label: 'Racha actual', val: streak?.currentStreak || 0, icon: '🔥', note: 'seguidas' },
                { label: 'Mejor racha', val: streak?.maxStreak || 0, icon: '⚡', note: 'récord' },
                { label: 'Exactos seguidos', val: streak?.currentExactStreak || 0, icon: '🎯', note: 'actuales' },
                { label: 'Mejor exactos', val: streak?.maxExactStreak || 0, icon: '💎', note: 'récord' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--off-white)', borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: 2 }}>{s.icon}</div>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', color: 'var(--crimson)' }}>{s.val}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{s.label}<br />{s.note}</div>
                </div>
              ))}
            </div>

            {/* IQ breakdown */}
            <StatBar label="Precisión general" value={iq?.accuracy || 0} color="var(--crimson)" />
            <StatBar label="Tasa de exactos" value={iq?.exactRate || 0} color="#F0A500" />
            <StatBar label="Acierto en apuestas arriesgadas" value={iq?.riskScore || 0} color="#7C3AED" />
          </div>
        </div>

        {/* Achievements */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Logros Desbloqueados</h3>
            <span style={{ background: 'var(--off-white)', borderRadius: 4, padding: '3px 10px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {achievements?.length || 0} / 12
            </span>
          </div>

          {(!achievements || achievements.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🏅</div>
              <p style={{ fontSize: '0.875rem' }}>Aún no has desbloqueado logros. ¡Empieza a predecir!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {achievements.map(a => (
                <div key={a.id} style={{
                  background: a.rarity === 'epic' ? '#FEF9EC' : a.rarity === 'rare' ? '#EFF6FF' : 'var(--off-white)',
                  border: `1px solid ${a.rarity === 'epic' ? '#FDE68A' : a.rarity === 'rare' ? '#BFDBFE' : 'var(--card-border)'}`,
                  borderRadius: 8, padding: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: 10
                }}>
                  <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{a.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-on-card)' }}>{a.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{a.desc}</div>
                    {a.rarity === 'epic' && <span style={{ display: 'inline-block', marginTop: 4, background: '#FDE68A', color: '#92400E', fontSize: '0.6rem', fontWeight: 800, padding: '1px 6px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Épico</span>}
                    {a.rarity === 'rare' && <span style={{ display: 'inline-block', marginTop: 4, background: '#BFDBFE', color: '#1E40AF', fontSize: '0.6rem', fontWeight: 800, padding: '1px 6px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Raro</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
