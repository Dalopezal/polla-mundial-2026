import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
function ensureDir() { if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true }); }
function readJSON(f, def=[]) {
  ensureDir();
  const p=path.join(dataDir,f);
  if (!fs.existsSync(p)) return def;
  try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch { return def; }
}
function writeJSON(f,d) {
  ensureDir();
  fs.writeFileSync(path.join(dataDir,f), JSON.stringify(d,null,2),'utf8');
}

export const db = {
  users: {
    getAll:      ()   => readJSON('users.json'),
    findById:    (id) => readJSON('users.json').find(u=>u.id===id)||null,
    findByEmail: (em) => readJSON('users.json').find(u=>u.email.toLowerCase()===em.toLowerCase())||null,
    create: (user) => { const u=readJSON('users.json'); u.push(user); writeJSON('users.json',u); return user; },
    update: (id,upd) => {
      const u=readJSON('users.json'); const i=u.findIndex(x=>x.id===id);
      if(i===-1) return null; u[i]={...u[i],...upd}; writeJSON('users.json',u); return u[i];
    }
  },
  matches: {
    getAll:   ()   => readJSON('matches.json'),
    findById: (id) => readJSON('matches.json').find(m=>m.id===id)||null,
    update: (id,upd) => {
      const m=readJSON('matches.json'); const i=m.findIndex(x=>x.id===id);
      if(i===-1) return null; m[i]={...m[i],...upd}; writeJSON('matches.json',m); return m[i];
    }
  },
  predictions: {
    getAll:      ()         => readJSON('predictions.json'),
    findByUser:  (uid)      => readJSON('predictions.json').filter(p=>p.userId===uid),
    findByMatch: (mid)      => readJSON('predictions.json').filter(p=>p.matchId===mid),
    findOne:     (uid,mid)  => readJSON('predictions.json').find(p=>p.userId===uid&&p.matchId===mid)||null,
    upsert: (uid,mid,data) => {
      const preds=readJSON('predictions.json');
      const idx=preds.findIndex(p=>p.userId===uid&&p.matchId===mid);
      const now=new Date().toISOString();
      if(idx!==-1){preds[idx]={...preds[idx],...data,updatedAt:now};}
      else{preds.push({userId:uid,matchId:mid,...data,createdAt:now,updatedAt:now});}
      writeJSON('predictions.json',preds);
      return preds.find(p=>p.userId===uid&&p.matchId===mid);
    }
  },
  userMeta: {
    getAll:   ()   => readJSON('user_meta.json',{}),
    findById: (id) => { const a=readJSON('user_meta.json',{}); return a[id]||null; },
    upsert: (id,upd) => {
      const a=readJSON('user_meta.json',{});
      a[id]={...(a[id]||{}),...upd,updatedAt:new Date().toISOString()};
      writeJSON('user_meta.json',a); return a[id];
    }
  },
  comments: {
    getAll:      ()    => readJSON('comments.json'),
    findByMatch: (mid) => readJSON('comments.json').filter(c=>c.matchId===mid),
    add: (comment) => {
      const c=readJSON('comments.json'); c.push({...comment,createdAt:new Date().toISOString()});
      writeJSON('comments.json',c); return comment;
    },
    upsertReaction: (matchId,predUserId,reactorId,reaction) => {
      const c=readJSON('comments.json');
      const key=`rxn_${matchId}_${predUserId}_${reactorId}`;
      const i=c.findIndex(x=>x.id===key); const now=new Date().toISOString();
      if(i!==-1){c[i]={...c[i],reaction,updatedAt:now};}
      else{c.push({id:key,type:'reaction',matchId,predUserId,reactorId,reaction,createdAt:now});}
      writeJSON('comments.json',c);
    }
  },
  // ── PAGOS ──────────────────────────────────────────────
  payments: {
    getAll:       ()     => readJSON('payments.json'),
    findById:     (id)   => readJSON('payments.json').find(p=>p.id===id)||null,
    findByUser:   (uid)  => readJSON('payments.json').filter(p=>p.userId===uid),
    findByRef:    (ref)  => readJSON('payments.json').find(p=>p.referencia===ref)||null,
    findPending:  ()     => readJSON('payments.json').filter(p=>p.estado==='pendiente'),
    create: (payment) => {
      const p=readJSON('payments.json'); p.push({...payment,creadoEn:new Date().toISOString()});
      writeJSON('payments.json',p); return payment;
    },
    update: (id,upd) => {
      const p=readJSON('payments.json'); const i=p.findIndex(x=>x.id===id);
      if(i===-1) return null; p[i]={...p[i],...upd,actualizadoEn:new Date().toISOString()};
      writeJSON('payments.json',p); return p[i];
    }
  },
  // ── GRUPOS ─────────────────────────────────────────────
  groups: {
    getAll:   ()        => readJSON('groups.json'),
    findById: (id)      => readJSON('groups.json').find(g=>g.id===id)||null,
    findByCode: (code)  => readJSON('groups.json').find(g=>g.codigo===code)||null,
    create: (group) => {
      const g=readJSON('groups.json'); g.push({...group,creadoEn:new Date().toISOString()});
      writeJSON('groups.json',g); return group;
    },
    update: (id,upd) => {
      const g=readJSON('groups.json'); const i=g.findIndex(x=>x.id===id);
      if(i===-1) return null; g[i]={...g[i],...upd}; writeJSON('groups.json',g); return g[i];
    }
  },
  // ── APUESTAS IA ────────────────────────────────────────
  aiBets: {
    getAll:       ()     => readJSON('ai_bets.json'),
    findByUser:   (uid)  => readJSON('ai_bets.json').filter(b=>b.userId===uid),
    findByMatch:  (mid)  => readJSON('ai_bets.json').filter(b=>b.matchId===mid),
    findOne:      (uid,mid) => readJSON('ai_bets.json').find(b=>b.userId===uid&&b.matchId===mid)||null,
    create: (bet) => {
      const b=readJSON('ai_bets.json'); b.push({...bet,creadoEn:new Date().toISOString()});
      writeJSON('ai_bets.json',b); return bet;
    },
    update: (id,upd) => {
      const b=readJSON('ai_bets.json'); const i=b.findIndex(x=>x.id===id);
      if(i===-1) return null; b[i]={...b[i],...upd,actualizadoEn:new Date().toISOString()};
      writeJSON('ai_bets.json',b); return b[i];
    }
  },
  // ── ESTADÍSTICAS GLOBALES ──────────────────────────────
  stats: {
    getFondoPremios: () => {
      const payments = readJSON('payments.json');
      const aprobados = payments.filter(p=>p.estado==='aprobado');
      return aprobados.reduce((s,p)=>s+(p.distribucion?.premios||0),0);
    },
    getResumen: () => {
      const payments = readJSON('payments.json');
      const aprobados = payments.filter(p=>p.estado==='aprobado');
      return {
        totalRecaudado: aprobados.reduce((s,p)=>s+p.valorBase,0),
        fondoPremios:   aprobados.reduce((s,p)=>s+(p.distribucion?.premios||0),0),
        fondoAdmin:     aprobados.reduce((s,p)=>s+(p.distribucion?.admin||0),0),
        saldoIA:        aprobados.reduce((s,p)=>s+(p.distribucion?.ia||0),0),
        totalUsuarios:  aprobados.length,
      };
    }
  }
};
