/* Karian's Summoner · Bàn chơi ảo v7.0 (1v1 với Máy)
 * - Bàn chơi tĩnh: kéo thả thẻ, thảy xí ngầu, theo dõi ❤ / Khiên / trạng thái / ✦.
 * - Người chơi tự thao tác (có trợ lý tính sát thương khi gán xí ngầu), Máy tự chơi lượt của mình.
 * Dữ liệu: data/karian_data.json (luật v6.5 + 41 quái + 16 Công trình/Xe).
 */
'use strict';

/* ================= hằng số ================= */
const EL_ORDER = ['Water', 'Fire', 'Grass', 'Rock', 'Lightning'];
const EL_VI = { Water: 'Nước', Fire: 'Hỏa', Grass: 'Cỏ', Rock: 'Đất', Lightning: 'Điện' };
const COL = { Fire: '#ff7a45', Water: '#3f95f0', Grass: '#45b157', Rock: '#b0824f', Lightning: '#f0bf00' };
const DARK = { Fire: '#c8381a', Water: '#1b5fb4', Grass: '#24793a', Rock: '#74502c', Lightning: '#c28a00' };
const ST_KEYS = ['pain', 'stun', 'weak', 'rage'];
const ST_VI = { pain: 'Đau', stun: 'Choáng', weak: 'Yếu', rage: 'Hăng hái' };
const ST_FROM_VI = { 'Đau': 'pain', 'Choáng': 'stun', 'Yếu': 'weak', 'Hăng hái': 'rage' };
const ROW_VI = ['Trước', 'Giữa', 'Sau'];
const PIPS = { 1: [[50, 50]], 2: [[29, 29], [71, 71]], 3: [[27, 27], [50, 50], [73, 73]], 4: [[29, 29], [71, 29], [29, 71], [71, 71]], 5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]], 6: [[30, 25], [70, 25], [30, 50], [70, 50], [30, 75], [70, 75]] };
const TIERS = {
  van0: { name: 'Ván 0', desc: '3 quái in sẵn, 3 xí ngầu đúng màu đội, không khắc hệ, không trạng thái, không dự bị, không ✦.', firstDice: 2, noElem: true, noStatus: true, noEnergy: true, noReroll: true, teamDice: true, buildings: false, energyActs: false },
  starter: { name: 'Tập chơi', desc: '1 bộ khởi động 15 🍇 / người. Chưa dùng đổi màu & dời quái.', firstDice: 3, buildings: false, energyActs: false },
  standard: { name: 'Chuẩn', desc: 'Draft A: rút 2 thẻ mỗi chồng giá (8 thẻ), giữ đội ≤ 15 🍇. Đủ luật + Công trình (mở rộng).', firstDice: 3, buildings: true, energyActs: true }
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rnd = n => Math.floor(Math.random() * n);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sum = a => a.reduce((x, y) => x + y, 0);

/* ================= dữ liệu ================= */
let D = null; const MON = {}; const BLD = {};
const monImg = id => 'assets/cards/monsters/' + encodeURIComponent(id) + '.png';
const bldImg = id => 'assets/cards/buildings/' + encodeURIComponent(id) + '.png';
const BACK_M = 'assets/cards/back-monster.png', BACK_B = 'assets/cards/back-building.png';
const TOK = { pain: 'assets/tokens/pain.svg', stun: 'assets/tokens/stun.svg', weak: 'assets/tokens/weak.svg', rage: 'assets/tokens/rage.svg', shield: 'assets/tokens/shield.svg', energy: 'assets/tokens/energy.png' };
const elIcon = e => 'assets/icons/' + e + '.png';

/* ================= trạng thái ván ================= */
let S = null; let UID = 1;
const foe = o => (o === 'P' ? 'B' : 'P');
const side = o => S.sides[o];
const who = o => (o === 'P' ? 'Bạn' : 'Máy');
const rowOf = i => Math.floor(i / 3), colOf = i => i % 3;
const adjIdx = i => { const r = rowOf(i), c = colOf(i), a = []; if (r > 0) a.push(i - 3); if (r < 2) a.push(i + 3); if (c > 0) a.push(i - 1); if (c < 2) a.push(i + 1); return a; };
const isMon = x => !!x && x.kind === 'mon';
const monsOf = o => side(o).grid.map((u, i) => (isMon(u) ? i : -1)).filter(i => i >= 0);
const M = u => MON[u.id];
const hasKw = (u, k) => M(u).keywords.includes(k);
const isMelee = u => hasKw(u, 'Cận chiến');
const isTaunt = u => hasKw(u, 'Khiêu khích');
const pasKey = u => (M(u).passive ? M(u).passive.key : null);
const T = () => TIERS[S.tier];

function mkUnit(id) {
  const m = MON[id];
  return { kind: 'mon', uid: UID++, id, hp: m.hp, maxHp: m.hp, shield: 0, st: {}, thrUsed: false, spiritUsed: false, scored: false, giftUsed: false };
}

/* ================= nhật ký / UI phụ ================= */
function log(msg, o, cls) {
  const li = document.createElement('li');
  li.innerHTML = msg; if (o) li.classList.add(o); if (cls) li.classList.add(cls);
  const ol = $('#log'); ol.appendChild(li); ol.scrollTop = ol.scrollHeight;
}
let toastT = 0;
function toast(msg) { const t = $('#toast'); t.innerHTML = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2600); }
function banner(html) { const b = $('#banner'); if (!html) { b.hidden = true; b.innerHTML = ''; return; } b.innerHTML = html; b.hidden = false; }
function flash(o, i, heal) {
  const el = document.querySelector(`.cell[data-o="${o}"][data-i="${i}"]`); if (!el) return;
  const c = heal ? 'flash-heal' : 'flash'; el.classList.remove(c); void el.offsetWidth; el.classList.add(c);
}
const uName = u => `<b>${esc(M(u).name)}</b>`;

/* ================= xí ngầu ================= */
function dieSvg(n, el) {
  if (!n) return '';
  const six = n === 6, fill = six ? DARK[el] : COL[el], pip = (el === 'Lightning' && !six) ? '#221b45' : '#fff';
  return `<svg viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" rx="14" fill="${fill}"/>${PIPS[n].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="${pip}"/>`).join('')}</svg>`;
}
const d6 = () => 1 + rnd(6);

/** Tìm kỹ năng mà viên xí ngầu (el, face) kích hoạt trên quái u; trả về {skill, extra:[chỉ số viên phụ]} hoặc null */
function findSkill(u, die, dice) {
  const m = M(u); if (die.el !== m.element) return null;
  for (const sk of m.skills) {
    if (!sk.faces.includes(die.face)) continue;
    const mc = sk.multicolor;
    if (!mc || (Array.isArray(mc) && mc.length === 0)) return { skill: sk, extra: [] };
    const extra = [];
    if (mc === 'any6') {
      const j = dice.findIndex(d => d !== die && !d.used && d.face === 6);
      if (j < 0) continue; extra.push(j);
    } else {
      let ok = true;
      for (const [e, f] of mc) { const j = dice.findIndex((d, k) => d !== die && !d.used && !extra.includes(k) && d.el === e && d.face === f); if (j < 0) { ok = false; break; } extra.push(j); }
      if (!ok) continue;
    }
    return { skill: sk, extra };
  }
  return null;
}
/** quái trên sân có thể dùng viên này */
function activators(o, die, dice) {
  return monsOf(o).map(i => ({ i, u: side(o).grid[i] })).filter(x => !x.u.acted && !x.u.st.stun).map(x => ({ ...x, f: findSkill(x.u, die, dice) })).filter(x => x.f);
}

/* ================= sát thương & hiệu ứng ================= */
function elemMod(a, t) { if (T().noElem) return 0; if (D.rules.beats[a] === t) return 1; if (D.rules.beats[t] === a) return -1; return 0; }
function calcDmg(att, tgt, v, ctx) {
  let d = v + (ctx.rage ? 1 : 0) - (ctx.weak ? 1 : 0);
  if (att) { d += elemMod(M(att).element, M(tgt).element); if (tgt.st.pain && pasKey(att) === 'burnBonus') d += 1; }
  return Math.max(D.rules.element_mod.min_damage, d);
}
function heal(o, i, v) {
  const u = side(o).grid[i]; if (!isMon(u)) return 0;
  const n = Math.min(v, u.maxHp - u.hp); u.hp += n; if (n > 0) flash(o, i, true); return n;
}
function addShield(o, i, v) { const u = side(o).grid[i]; if (!isMon(u)) return; u.shield += v; flash(o, i, true); }
function setStatus(o, i, key) {
  if (T().noStatus) return false;
  const u = side(o).grid[i]; if (!isMon(u)) return false; u.st[key] = true; return true;
}

/** Gây sát thương lên ô (to, ti). direct=true: mất ❤ thẳng (không qua Khiên, không cộng trừ). */
async function damage(srcO, att, to, ti, v, ctx, direct) {
  const t = side(to).grid[ti]; if (!isMon(t)) return;
  let d = direct ? v : calcDmg(att, t, v, ctx);
  let abs = 0;
  if (!direct) { abs = Math.min(t.shield, d); t.shield -= abs; }
  const lost = d - abs; t.hp -= lost; ctx.dealt = true; flash(to, ti);
  const parts = []; if (!direct && att) { const em = elemMod(M(att).element, M(t).element); if (em) parts.push(em > 0 ? 'khắc +1' : 'bị khắc −1'); }
  if (abs) parts.push(`Khiên đỡ ${abs}`);
  log(`${att ? uName(att) + ' → ' : ''}${uName(t)}: −${lost} ❤${parts.length ? ' (' + parts.join(', ') + ')' : ''}`, srcO);
  // Gai: quái cận chiến đánh trúng mất 1 ❤
  if (!direct && att && isMelee(att) && pasKey(t) === 'thorns') {
    const ai = side(srcO).grid.indexOf(att);
    if (ai >= 0) { att.hp -= 1; flash(srcO, ai); log(`${uName(t)} (${M(t).passive.name}): ${uName(att)} mất 1 ❤`, to); if (att.hp <= 0) await ko(srcO, ai); }
  }
  if (t.hp <= 0) {
    await ko(to, ti);
    if (att && pasKey(att) === 'chain' && side(srcO).grid.includes(att) && !ctx.chained) {
      const c = monsOf(to); if (c.length) { ctx.chained = true; const j = aiPickEnemy(srcO, att, c, 2, ctx); log(`${uName(att)} (${M(att).passive.name}) lan 2 sát thương`, srcO); await damage(srcO, null, to, j, 2, { }, true); }
    }
  } else await checkThreshold(to, ti);
}
async function checkThreshold(o, i) {
  const u = side(o).grid[i]; if (!isMon(u)) return; const th = M(u).threshold;
  if (th && !u.thrUsed && u.hp <= th.at) { u.thrUsed = true; log(`${uName(u)} còn ≤${th.at} ❤ → <i>${esc(th.name)}</i>`, o); await runEffects(o, u, i, th.effects, aiChooser, th.name); }
}
async function ko(o, i) {
  const s = side(o), u = s.grid[i]; if (!isMon(u)) return; const m = M(u);
  // Tinh linh: lần đầu bị hạ, loại 1 dự bị để quay lại
  if (m.trait_bot && m.trait_bot.k === 'spirit' && !u.spiritUsed && s.reserve.length) {
    const r = s.reserve.slice().sort((a, b) => MON[a.id].price - MON[b.id].price)[0];
    s.reserve.splice(s.reserve.indexOf(r), 1); s.exiled.push(r);
    u.spiritUsed = true; u.hp = m.trait_bot.hp; u.shield = 0; u.st = {};
    log(`${uName(u)} (<i>${esc(m.trait_bot.n)}</i>) loại dự bị ${uName(r)} để quay lại với ${u.hp} ❤`, o); render(); return;
  }
  s.grid[i] = null; s.dead.push(u);
  if (!u.scored) { u.scored = true; side(foe(o)).trophies.push(u); }
  log(`💥 ${uName(u)} bị hạ! ${who(foe(o))} +${m.price} 🍇`, o);
  render();
  if (m.deathwish) { log(`${uName(u)} · Di nguyện <i>${esc(m.deathwish.name)}</i>`, o); await runEffects(o, u, i, m.deathwish.effects, aiChooser, m.deathwish.name, true); }
  checkEnd();
}

/* ---------- mục tiêu ---------- */
function reachable(attO, att) {
  const fo = foe(attO), ms = monsOf(fo); if (!ms.length) return [];
  if (att && isMelee(att)) { const r = Math.min(...ms.map(rowOf)); return ms.filter(i => rowOf(i) === r); }
  return ms;
}
function legalSingle(attO, att) {
  const R = reachable(attO, att); if (!att || hasKw(att, 'Xuyên')) return R;
  const g = side(foe(attO)).grid;
  return R.filter(i => isTaunt(g[i]) || !adjIdx(i).some(j => isMon(g[j]) && isTaunt(g[j]) && R.includes(j)));
}
function enemyOptions(code, attO, att, ctx) {
  const fo = foe(attO), g = side(fo).grid, ms = monsOf(fo), R = reachable(attO, att);
  const one = (ctx.tg.one || [])[0];
  switch (code) {
    case 'one': return { pick: 1, opts: legalSingle(attO, att).map(i => [i]) };
    case 'other': { let L = legalSingle(attO, att).filter(i => i !== one); if (!L.length) L = R.filter(i => i !== one); return { pick: 1, opts: L.map(i => [i]) }; }
    case 'anyE': return { pick: 1, opts: ms.map(i => [i]) };
    case 'adjE': return { auto: one == null ? [] : adjIdx(one).filter(j => isMon(g[j])) };
    case 'three': return ms.length <= 3 ? { auto: ms } : { pick: 3, opts: ms.map(i => [i]) };
    case 'row': { const rows = [...new Set((att && isMelee(att) ? R : ms).map(rowOf))]; return { pick: 1, opts: rows.map(r => [0, 1, 2].map(c => r * 3 + c).filter(j => isMon(g[j]))) }; }
    case 'col': { const cols = [...new Set(ms.map(colOf))]; return { pick: 1, opts: cols.map(c => [0, 1, 2].map(r => r * 3 + c).filter(j => isMon(g[j]))) }; }
    case 'cross': return { pick: 1, center: true, opts: R.map(i => [i, ...adjIdx(i).filter(j => isMon(g[j]))]) };
    case 'all': return { auto: ms };
  }
  return { auto: [] };
}
function allyOptions(code, o, src, si) {
  const g = side(o).grid, ms = monsOf(o), onField = g[si] === src;
  switch (code) {
    case 'self': return { auto: onField ? [si] : [] };
    case 'ally': return { pick: 1, opts: ms.map(i => [i]) };
    case 'front': { const f = ms.filter(i => rowOf(i) === 0); return { pick: 1, opts: (f.length ? f : ms).map(i => [i]) }; }
    case 'adj': return { auto: adjIdx(si).filter(j => isMon(g[j])) };
    case 'selfadj': return { auto: [...(onField ? [si] : []), ...adjIdx(si).filter(j => isMon(g[j]))] };
    case 'team': return { auto: ms };
  }
  return { auto: [] };
}
const ENEMY_CODES = ['one', 'other', 'anyE', 'adjE', 'three', 'row', 'col', 'cross', 'all'];

/** Chạy danh sách hiệu ứng của 1 kỹ năng. chooser(req) → Promise<mảng ô> */
async function runEffects(o, src, si, effects, chooser, label, fromDead) {
  const ctx = { rage: !!src.st.rage, weak: !!src.st.weak, dealt: false, tg: {} };
  const fo = foe(o);
  for (const e of effects) {
    if (S.over) return;
    if (e.k === 'rev') { await revive(o, e.v, chooser); continue; }
    const enemy = ENEMY_CODES.includes(e.t);
    let targets = ctx.tg[e.t];
    if (!targets) {
      const op = enemy ? enemyOptions(e.t, o, fromDead ? null : src, ctx) : allyOptions(e.t, o, src, si);
      if (op.auto) targets = op.auto;
      else if (!op.opts.length) targets = [];
      else targets = await chooser({ o, side: enemy ? fo : o, src, effect: e, opts: op.opts, pick: op.pick, center: op.center, label, ctx });
      ctx.tg[e.t] = targets;
    }
    targets = (targets || []).filter(i => isMon(side(enemy ? fo : o).grid[i]));
    if (!targets.length) { log(`${label}: không có mục tiêu cho “${esc(e.printed || e.t)}”`, o); continue; }
    if (e.k === 'd') { for (const i of targets) { await damage(o, fromDead ? null : src, fo, i, e.v, ctx); if (S.over) return; } if (fromDead) { /* Di nguyện: không tính khắc hệ */ } }
    else if (e.k === 'st') { if (T().noStatus) continue; const k = ST_FROM_VI[e.v]; targets.forEach(i => { if (setStatus(fo, i, k)) log(`${uName(side(fo).grid[i])} bị <b>${e.v}</b>`, o); }); }
    else if (e.k === 'h') { { const got = targets.map(i => [side(o).grid[i], heal(o, i, e.v)]).filter(x => x[1] > 0); log(got.length ? got.map(([u, n]) => `${uName(u)} +${n} ❤`).join(', ') : `${esc(label)}: không ai cần hồi ❤`, o); } }
    else if (e.k === 's') { targets.forEach(i => { addShield(o, i, e.v); log(`${uName(side(o).grid[i])} +${e.v} Khiên`, o); }); }
    else if (e.k === 'bf') { if (T().noStatus) continue; const k = ST_FROM_VI[e.v]; targets.forEach(i => { if (setStatus(o, i, k)) log(`${uName(side(o).grid[i])} được <b>${e.v}</b>`, o); }); }
    render();
  }
  if (ctx.dealt && !fromDead) { delete src.st.rage; delete src.st.weak; }
  render();
}
async function revive(o, hp, chooser) {
  const s = side(o), cands = s.dead.slice();
  const empty = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(i => !s.grid[i]);
  if (!cands.length || !empty.length || monsOf(o).length >= D.rules.team.on_field) { log('Hồi sinh: không có đồng đội bị hạ / ô trống', o); return; }
  const u = cands.sort((a, b) => M(b).price - M(a).price)[0];
  const cell = bestCellFor(o, u, empty);
  s.dead.splice(s.dead.indexOf(u), 1); u.hp = Math.min(hp, u.maxHp); u.shield = 0; u.st = {}; u.acted = false; s.grid[cell] = u;
  log(`✨ ${uName(u)} được hồi sinh với ${u.hp} ❤ (đối thủ vẫn giữ điểm hạ)`, o); render();
}

/* ================= AI chọn mục tiêu ================= */
function valueOf(req, i) {
  const e = req.effect, g = side(req.side).grid, u = g[i]; if (!isMon(u)) return -99;
  const m = M(u);
  if (req.side !== req.o) { // địch
    if (e.k === 'd') {
      const d = calcDmg(req.ctx && req.src && side(req.o).grid.includes(req.src) ? req.src : null, u, e.v, req.ctx || {});
      const eff = u.hp + u.shield; const kill = d >= eff;
      return Math.min(d, eff) * 2 + (kill ? 8 + m.price * 2 : 0) + (u.st.pain && !kill ? 1 : 0) + m.price * 0.3 - eff * 0.05;
    }
    if (e.k === 'st') { const k = ST_FROM_VI[e.v]; if (u.st[k]) return 0.1; return m.price + (k === 'stun' ? 1 : 0) + (k === 'pain' ? u.hp / 4 : 0); }
    return 1;
  }
  // đồng minh
  if (e.k === 'h') { const miss = u.maxHp - u.hp; return Math.min(e.v, miss) * 2 + (u.hp <= 3 ? 3 : 0) + (miss ? 0 : -5); }
  if (e.k === 's') return (rowOf(i) === 0 ? 2 : 0) + (isTaunt(u) ? 2 : 0) + Math.max(0, 6 - u.hp) * 0.6 - u.shield * 0.5;
  if (e.k === 'bf') return (u.acted ? -3 : 2) + (m.role_ai === 'DPS' ? 2 : 0) + (u.st.rage ? -4 : 0);
  return 1;
}
async function aiChooser(req) {
  if (req.pick > 1) { return req.opts.map(op => op[0]).sort((a, b) => valueOf(req, b) - valueOf(req, a)).slice(0, req.pick); }
  let best = req.opts[0], bv = -1e9;
  for (const op of req.opts) { const v = sum(op.map(i => valueOf(req, i))) + Math.random() * 0.01; if (v > bv) { bv = v; best = op; } }
  return best;
}
function aiPickEnemy(o, att, cands, v, ctx) {
  const req = { o, side: foe(o), src: att, effect: { k: 'd', v }, ctx };
  return cands.slice().sort((a, b) => valueOf(req, b) - valueOf(req, a))[0];
}

/* ================= người chơi chọn mục tiêu ================= */
let pendingPick = null;
function playerChooser(req) {
  if (req.opts.length === 1 && req.pick === 1) return Promise.resolve(req.opts[0]);
  return new Promise(resolve => {
    const chosen = [];
    pendingPick = { req, chosen, resolve };
    const eff = req.effect, kind = { d: `⚔ ${eff.v} sát thương`, h: `hồi ${eff.v} ❤`, s: `+${eff.v} Khiên`, st: `gây ${eff.v}`, bf: `${eff.v}` }[eff.k] || '';
    banner(`<span><b>${esc(req.label)}</b>: chọn ${req.pick > 1 ? req.pick + ' mục tiêu' : 'mục tiêu'} (${esc(eff.printed || '')}) · ${kind}</span>` +
      (req.pick > 1 ? `<button class="btn sm" data-pick="done">Xong</button>` : '') + `<button class="btn sm warn" data-pick="skip">Bỏ qua</button>`);
    render();
  });
}
function finishPick(res) { const p = pendingPick; pendingPick = null; banner(''); render(); p.resolve(res); }
function onPickCell(o, i) {
  const p = pendingPick; if (!p) return false;
  if (o !== p.req.side) { toast('Chọn ô được viền sáng.'); return true; }
  const op = p.req.opts.find(x => (p.req.pick === 1 && !p.req.center) ? x.includes(i) : x[0] === i);
  if (!op) { toast('Ô này không hợp lệ (Cận chiến / Khiêu khích / tầm đánh).'); return true; }
  if (p.req.pick === 1) { finishPick(op); return true; }
  if (!p.chosen.includes(i)) p.chosen.push(i);
  if (p.chosen.length >= p.req.pick) finishPick(p.chosen.slice()); else render();
  return true;
}

/* ================= vòng lượt ================= */
function startTurn(o) {
  const s = side(o); const tasks = [];
  s.dice = []; s.rolled = false; s.rerolled = false;
  monsOf(o).forEach(i => { const u = s.grid[i]; u.shield = 0; u.acted = false; });
  // Đau: mất 2 ❤ thẳng rồi bỏ token
  for (const i of monsOf(o)) { const u = s.grid[i]; if (u.st.pain) { delete u.st.pain; tasks.push(async () => { log(`${uName(u)} bị Đau: mất 2 ❤`, o); await damage(o, null, o, i, 2, {}, true); }); } }
  // Nội tại & đặc tính đầu lượt
  for (const i of monsOf(o)) {
    const u = s.grid[i], m = M(u);
    if (pasKey(u) === 'regenAlly') tasks.push(async () => { const ms = monsOf(o); if (!ms.length) return; const j = ms.sort((a, b) => (s.grid[a].hp - s.grid[a].maxHp) - (s.grid[b].hp - s.grid[b].maxHp))[0]; const n = heal(o, j, 1); if (n) log(`${uName(u)} (${m.passive.name}): ${uName(s.grid[j])} hồi 1 ❤`, o); });
    if (pasKey(u) === 'photo') tasks.push(async () => { const ii = s.grid.indexOf(u); if (ii < 0) return; [ii, ...adjIdx(ii).filter(j => isMon(s.grid[j]))].forEach(j => heal(o, j, 1)); log(`${uName(u)} (${m.passive.name}): mình & đồng đội kề hồi 1 ❤`, o); });
    if (m.trait_top && m.trait_top.k === 'steady' && rowOf(i) === 0) { u.shield += m.trait_top.sh; log(`${uName(u)} (${m.trait_top.n}): +${m.trait_top.sh} Khiên`, o); }
    if (m.trait_top && m.trait_top.k === 'lone' && !adjIdx(i).some(j => isMon(s.grid[j]))) { u.shield += m.trait_top.sh; log(`${uName(u)} (${m.trait_top.n}): +${m.trait_top.sh} Khiên`, o); }
  }
  return (async () => { for (const t of tasks) { if (S.over) return; await t(); } render(); })();
}
function endTurn(o) {
  const s = side(o);
  monsOf(o).forEach(i => { const u = s.grid[i]; delete u.st.stun; delete u.st.weak; delete u.st.rage; u.acted = false; });
  // viên dư → +1 ✦
  if (!T().noEnergy) {
    const left = s.dice.filter(d => !d.used && d.face).length;
    if (left) { const before = s.energy; s.energy = Math.min(D.rules.energy.cap, s.energy + left); log(`${who(o)}: ${left} viên dư → +${s.energy - before} ✦`, o); }
  }
  s.dice = []; s.rolled = false;
}
async function beginTurn() {
  if (S.over) return;
  const o = S.turn;
  log(`Vòng ${S.round}/${S.maxRounds} · Lượt ${who(o)}`, null, 't');
  S.busy = true; render();
  await startTurn(o); if (S.over) return;
  S.busy = false;
  if (o === 'B') { await botTurn(); if (!S.over) nextTurn(); }
  else { prepPlayerDice(); render(); }
}
function nextTurn() {
  if (S.over) return;
  endTurn(S.turn);
  if (S.turn !== S.first) { S.round++; if (S.round > S.maxRounds) { gameOver('Hết ' + S.maxRounds + ' vòng'); return; } }
  S.turn = foe(S.turn); S.firstTurn = false;
  beginTurn();
}
function checkEnd() {
  if (S.over) return;
  for (const o of ['P', 'B']) { const s = side(o); if (!monsOf(o).length && !s.reserve.length) { gameOver(`${who(o)} hết quái`); return; } }
}
function scoreOf(o) {
  const s = side(o);
  const ko = sum(s.trophies.map(u => M(u).price));
  const alive = sum(monsOf(o).map(i => M(s.grid[i]).price)) + sum(s.reserve.map(u => M(u).price));
  return { ko, alive, total: ko + alive, field: monsOf(o).length };
}
function gameOver(reason) {
  if (S.over) return; S.over = true; S.busy = false; banner(''); pendingPick = null;
  const p = scoreOf('P'), b = scoreOf('B');
  let res; if (p.total !== b.total) res = p.total > b.total ? 'Bạn thắng! 🎉' : 'Máy thắng!';
  else if (p.field !== b.field) res = (p.field > b.field ? 'Bạn thắng' : 'Máy thắng') + ' (nhiều quái trên sân hơn)'; else res = 'Hòa!';
  log(`🏁 Kết thúc (${reason}) — ${res}`, null, 't');
  render();
  openModal(`<h2>${res}</h2><p>${esc(reason)}.</p>
    <table class="score"><tr><th></th><th>🍇 quái đã hạ</th><th>🍇 quái còn sống</th><th>Tổng</th><th>Quái trên sân</th></tr>
    <tr><td><b>Bạn</b></td><td>${p.ko}</td><td>${p.alive}</td><td><b>${p.total}</b></td><td>${p.field}</td></tr>
    <tr><td><b>Máy</b></td><td>${b.ko}</td><td>${b.alive}</td><td><b>${b.total}</b></td><td>${b.field}</td></tr></table>
    <div class="foot"><button class="btn" data-close>Xem bàn</button><button class="btn primary" data-act="newgame">Ván mới</button></div>`);
}

/* ================= xí ngầu người chơi ================= */
function prepPlayerDice() {
  const s = side('P'); s.dice = []; s.rolled = false; s.rerolled = false;
  S.chooseColors = S.firstTurn && S.first === 'P' ? T().firstDice : 0;
  S.colorPick = [];
}
function diceColorsFor(o) {
  if (T().teamDice) return [...new Set([...side(o).grid, ...side(o).reserve].filter(isMon).map(u => M(u).element))];
  return EL_ORDER.slice();
}
function rollPlayer() {
  const s = side('P');
  let els;
  if (S.chooseColors) {
    if (S.colorPick.length !== S.chooseColors) { toast(`Lượt đầu: chọn đúng ${S.chooseColors} màu xí ngầu.`); return; }
    els = S.colorPick.slice();
  } else els = diceColorsFor('P');
  s.dice = els.map(el => ({ el, face: d6(), used: false, sel: false }));
  s.rolled = true; s.noReroll = !!S.chooseColors || T().noReroll; S.chooseColors = 0;
  log(`Bạn thảy: ${s.dice.map(d => EL_VI[d.el] + ' ' + d.face).join(' · ')}`, 'P');
  render(true);
}
function rerollSelected(paid) {
  const s = side('P'); const sel = s.dice.filter(d => d.sel && !d.used);
  if (!sel.length) { toast('Chạm để chọn viên muốn thảy lại.'); return; }
  if (paid) { if (sel.length !== 1) { toast('Trả 1 ✦ để thảy lại đúng 1 viên.'); return; } if (s.energy < 1) { toast('Không đủ ✦.'); return; } s.energy -= 1; }
  else { if (s.rerolled || s.noReroll) { toast('Đã hết lượt thảy lại miễn phí.'); return; } s.rerolled = true; }
  sel.forEach(d => { d.face = d6(); d.sel = false; d.anim = true; });
  log(`Bạn thảy lại${paid ? ' (1 ✦)' : ''}: ${sel.map(d => EL_VI[d.el] + ' ' + d.face).join(' · ')}`, 'P');
  render(true);
}
function recolorSelected(el) {
  const s = side('P'); const sel = s.dice.filter(d => d.sel && !d.used);
  if (sel.length !== 1) { toast('Chọn đúng 1 viên để đổi màu.'); return; }
  if (s.energy < 3) { toast('Đổi màu cần 3 ✦.'); return; }
  s.energy -= 3; log(`Bạn đổi màu viên ${EL_VI[sel[0].el]} ${sel[0].face} → ${EL_VI[el]} (3 ✦)`, 'P'); sel[0].el = el; sel[0].sel = false; render();
}
async function assignDie(di, ci) {
  if (S.busy || S.turn !== 'P' || S.over) return;
  const s = side('P'), die = s.dice[di], u = s.grid[ci];
  if (!die || die.used) return;
  if (!isMon(u)) { toast('Thả xí ngầu lên một quái của bạn.'); return; }
  if (die.el !== M(u).element) { toast(`Viên ${EL_VI[die.el]} chỉ kích hoạt quái hệ ${EL_VI[die.el]}.`); return; }
  if (u.st.stun) { toast(`${M(u).name} đang Choáng, không dùng được kỹ năng.`); return; }
  if (u.acted) { toast('Mỗi quái chỉ kích hoạt 1 lần mỗi lượt.'); return; }
  let f = findSkill(u, die, s.dice);
  // Thiên phú (Flarevix): 1 lần/trận đổi xí ngầu thành mặt 6
  const tb = M(u).trait_bot;
  if (tb && tb.k === 'gifted' && !u.giftUsed && die.face !== 6 && confirm(`${M(u).name} – ${tb.n}: đổi viên này thành mặt 6? (1 lần/trận)`)) { die.face = 6; u.giftUsed = true; f = findSkill(u, die, s.dice); log(`${uName(u)} dùng <i>${tb.n}</i>: xí ngầu thành mặt 6`, 'P'); }
  if (!f) { toast(`Mặt ${die.face} không kích hoạt kỹ năng nào của ${M(u).name}${die.face === 6 ? ' (thiếu xí ngầu phụ?)' : ''}.`); return; }
  die.used = true; f.extra.forEach(j => (s.dice[j].used = true)); u.acted = true; die.sel = false;
  S.busy = true; S.acting = { o: 'P', i: ci }; render();
  log(`${uName(u)} · <b>${esc(f.skill.name)}</b>${f.skill.tier === 'U' ? ' ★' : ''} (${EL_VI[die.el]} ${die.face})`, 'P');
  await runEffects('P', u, ci, f.skill.effects, playerChooser, f.skill.name);
  S.busy = false; S.acting = null; render();
}
function endPlayerTurn() {
  if (S.busy || S.turn !== 'P' || S.over) return;
  const s = side('P');
  if (!s.rolled) { if (!confirm('Bạn chưa thảy xí ngầu. Kết thúc lượt?')) return; }
  const usable = s.dice.filter(d => !d.used && activators('P', d, s.dice).length);
  if (usable.length && !confirm(`Còn ${usable.length} viên gán được (luật: viên gán được phải dùng). Vẫn kết thúc lượt?`)) return;
  nextTurn();
}

/* ================= MÁY ================= */
function bestCellFor(o, u, empty) {
  const m = M(u), g = side(o).grid; const ranged = !isMelee(u);
  const pref = m.role_ai === 'Tanker' ? [1, 0, 2, 4] : m.role_ai === 'Support' ? [4, 7, 3, 5, 6, 8] : ranged ? [4, 3, 5, 7, 6, 8] : [0, 2, 1, 3, 5, 4];
  const tank = g.findIndex(x => isMon(x) && isTaunt(x));
  const scored = empty.map(i => ({ i, v: (pref.includes(i) ? 10 - pref.indexOf(i) : 0) + (tank >= 0 && adjIdx(tank).includes(i) ? 3 : 0) + (isMelee(u) ? 0 : rowOf(i)) }));
  return scored.sort((a, b) => b.v - a.v)[0].i;
}
function botPickField(units, n) {
  // ưu tiên 1 Đỡ đòn, hệ khác nhau, giá cao
  const pool = units.slice(); const out = [];
  const tank = pool.filter(u => M(u).role_ai === 'Tanker').sort((a, b) => M(b).price - M(a).price)[0];
  if (tank) { out.push(tank); pool.splice(pool.indexOf(tank), 1); }
  while (out.length < n && pool.length) {
    pool.sort((a, b) => {
      const sc = u => (out.some(x => M(x).element === M(u).element) ? -5 : 0) + M(u).price + (M(u).role_ai === 'Support' && !out.some(x => M(x).role_ai === 'Support') ? 2 : 0);
      return sc(b) - sc(a);
    });
    out.push(pool.shift());
  }
  return out;
}
function summon(o, u, cell, quiet) {
  const s = side(o); s.reserve.splice(s.reserve.indexOf(u), 1); s.grid[cell] = u;
  if (!quiet) log(`${who(o)} gọi ${uName(u)} ra ô ${ROW_VI[rowOf(cell)]}-${colOf(cell) + 1}`, o);
  const tt = M(u).trait_top;
  if (tt && tt.k === 'build' && !quiet) { adjIdx(cell).filter(j => isMon(s.grid[j])).forEach(j => heal(o, j, tt.heal)); log(`${uName(u)} (${tt.n}): đồng đội kề hồi ${tt.heal} ❤`, o); }
}
function botSummon() {
  const s = side('B'); let did = false;
  while (monsOf('B').length < D.rules.team.on_field && s.reserve.length) {
    const empty = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(i => !s.grid[i]); if (!empty.length) break;
    const pick = botPickField(s.reserve, 1)[0];
    summon('B', pick, bestCellFor('B', pick, empty)); did = true;
  }
  return did;
}
function skillValue(sk) { return sum(sk.effects.map(e => (e.k === 'd' ? e.v * ({ row: 2, col: 2, cross: 2.2, all: 2.6, three: 2.6, adjE: 1.5 }[e.t] || 1) : e.k === 'h' ? e.v * (e.t === 'team' ? 1.6 : 0.8) : e.k === 's' ? e.v * (e.t === 'team' ? 1.5 : 0.7) : 1.2))); }
function planBot(dice) {
  // gán từng viên cho quái tốt nhất
  const plan = [];
  const order = dice.map((d, k) => k).sort((a, b) => dice[b].face - dice[a].face); // viên 6 (có thể cần xí ngầu phụ) trước
  for (const k of order) {
    const d = dice[k]; if (d.used) continue;
    const acts = activators('B', d, dice).filter(a => !plan.some(p => p.i === a.i));
    if (!acts.length) continue;
    const best = acts.sort((a, b) => skillValue(b.f.skill) - skillValue(a.f.skill))[0];
    d.used = true; best.f.extra.forEach(j => (dice[j].used = true));
    plan.push({ i: best.i, u: best.u, skill: best.f.skill, die: d });
  }
  dice.forEach(d => (d.used = false));
  return plan;
}
async function botTurn() {
  const s = side('B');
  await sleep(500);
  if (botSummon()) { render(); await sleep(500); }
  // thảy
  let els = diceColorsFor('B');
  if (S.firstTurn && S.first === 'B') {
    const fieldEls = [...new Set(monsOf('B').map(i => M(s.grid[i]).element))];
    els = shuffle(fieldEls.concat(shuffle(EL_ORDER.filter(e => !fieldEls.includes(e))))).slice(0, T().firstDice);
  }
  s.dice = els.map(el => ({ el, face: d6(), used: false }));
  s.rolled = true; render(true);
  log(`Máy thảy: ${s.dice.map(d => EL_VI[d.el] + ' ' + d.face).join(' · ')}`, 'B');
  await sleep(800);
  const fieldEls = new Set(monsOf('B').map(i => M(s.grid[i]).element));
  const wasted = () => { const used = new Set(); planBot(s.dice).forEach(p => { used.add(p.die); }); return s.dice.filter(d => !used.has(d) && fieldEls.has(d.el)); };
  // thảy lại 1 lần (miễn phí)
  if (!(S.firstTurn && S.first === 'B') && !T().noReroll) {
    const w = wasted().concat(s.dice.filter(d => fieldEls.has(d.el) && d.face <= 2 && !wasted().includes(d) && Math.random() < 0.3));
    if (w.length) { w.forEach(d => { d.face = d6(); d.anim = true; }); log(`Máy thảy lại: ${w.map(d => EL_VI[d.el] + ' ' + d.face).join(' · ')}`, 'B'); render(true); await sleep(700); }
    // trả 1 ✦ thảy lại khi ✦ đầy
    const w2 = wasted();
    if (w2.length && s.energy >= 3 && !T().noEnergy) { s.energy -= 1; w2[0].face = d6(); w2[0].anim = true; log(`Máy trả 1 ✦ thảy lại ${EL_VI[w2[0].el]} → ${w2[0].face}`, 'B'); render(true); await sleep(600); }
  }
  // đổi màu (3 ✦): viên dư không có quái hệ đó → đổi sang hệ có thể dùng
  if (T().energyActs && s.energy >= 3) {
    const plan0 = planBot(s.dice); const usedDice = new Set(plan0.map(p => p.die));
    const spare = s.dice.find(d => !usedDice.has(d) && !fieldEls.has(d.el));
    if (spare) {
      const acted = new Set(plan0.map(p => p.i));
      for (const e of fieldEls) {
        const test = { el: e, face: spare.face, used: false };
        if (activators('B', test, s.dice).some(a => !acted.has(a.i)) && !s.dice.some(d => d.el === e && !usedDice.has(d))) {
          log(`Máy trả 3 ✦ đổi màu viên ${EL_VI[spare.el]} ${spare.face} → ${EL_VI[e]}`, 'B'); spare.el = e; s.energy -= 3; render(true); await sleep(600); break;
        }
      }
    }
  }
  // thi triển
  const plan = planBot(s.dice);
  const prio = p => (p.skill.effects.some(e => e.k === 'bf') ? 0 : p.skill.effects.some(e => e.k === 'd') ? 1 : 2);
  plan.sort((a, b) => prio(a) - prio(b));
  for (const p of plan) {
    if (S.over) return;
    const ci = s.grid.indexOf(p.u); if (ci < 0 || p.u.st.stun) continue;
    const f = findSkill(p.u, p.die, s.dice); if (!f) continue;
    p.die.used = true; f.extra.forEach(j => (s.dice[j].used = true)); p.u.acted = true;
    S.acting = { o: 'B', i: ci }; render();
    log(`${uName(p.u)} · <b>${esc(f.skill.name)}</b>${f.skill.tier === 'U' ? ' ★' : ''} (${EL_VI[p.die.el]} ${p.die.face})`, 'B');
    await sleep(650);
    await runEffects('B', p.u, ci, f.skill.effects, aiChooser, f.skill.name);
    S.acting = null; render(); await sleep(650);
    if (botSummon()) { render(); await sleep(400); }
  }
  if (S.over) return;
  // +2 Khiên (2 ✦) cho quái nguy hiểm
  if (T().energyActs && s.energy >= 2) {
    const low = monsOf('B').map(i => ({ i, u: s.grid[i] })).filter(x => x.u.hp + x.u.shield <= 4).sort((a, b) => a.u.hp - b.u.hp)[0];
    if (low) { s.energy -= 2; addShield('B', low.i, 2); log(`Máy trả 2 ✦: ${uName(low.u)} +2 Khiên`, 'B'); render(); await sleep(500); }
  }
  await sleep(400);
}

/* ================= kéo thả / thao tác ================= */
let picked = null; // chọn-rồi-chạm (thay kéo thả trên điện thoại): {type:'res'|'die'|'cell'|'bld', ...}
function canPlace() { return S.phase === 'place' || (S.phase === 'play' && S.turn === 'P' && !S.busy && !S.over); }
function dropOn(o, i, data) {
  if (!S || S.over) return;
  if (data.type === 'die') { if (o === 'P') assignDie(data.di, i); return; }
  if (o !== 'P') return;
  const s = side('P'), g = s.grid;
  if (!canPlace()) { toast('Chỉ đặt / gọi quái trong lượt của bạn.'); return; }
  if (data.type === 'res') {
    const u = s.reserve.find(x => x.uid === data.uid); if (!u) return;
    if (g[i]) { toast('Ô đã có thẻ.'); return; }
    if (monsOf('P').length >= D.rules.team.on_field) { toast('Sân tối đa 3 quái.'); return; }
    if (S.phase === 'place') { s.reserve.splice(s.reserve.indexOf(u), 1); g[i] = u; }
    else summon('P', u, i);
  } else if (data.type === 'cell') {
    const from = data.i; if (from === i) return; const u = g[from]; if (!u) return;
    if (g[i]) { if (S.phase !== 'place') { toast('Chỉ dời sang ô trống.'); return; } g[from] = g[i]; g[i] = u; }
    else {
      if (S.phase === 'play') {
        if (u.kind === 'bld') { if (!(BLD[u.id].kind === 'vehicle' && !u.moved)) { toast(BLD[u.id].kind === 'vehicle' ? 'Xe chỉ đi 1 ô miễn phí mỗi lượt.' : 'Nhà không di chuyển.'); return; } if (!adjIdx(from).includes(i)) { toast('Xe đi 1 ô (kề).'); return; } u.moved = true; }
        else {
          if (!T().energyActs) { toast(`Tầng ${T().name} chưa dùng “dời quái”.`); return; }
          if (s.energy < 2) { toast('Dời 1 quái cần 2 ✦.'); return; }
          if (!confirm(`Trả 2 ✦ để dời ${M(u).name}?`)) return; s.energy -= 2; log(`Bạn trả 2 ✦ dời ${uName(u)}`, 'P');
        }
      }
      g[i] = u; g[from] = null;
    }
  } else if (data.type === 'bld') {
    if (g[i]) { toast('Công trình đặt vào ô trống.'); return; }
    const b = s.bldHand.find(x => x.uid === data.uid); if (!b) return;
    const kind = BLD[b.id].kind;
    const cnt = g.filter(x => x && x.kind === 'bld' && BLD[x.id].kind === kind).length;
    if (kind === 'house' && cnt >= D.rules.buildings.max_houses) { toast('Tối đa 2 Nhà.'); return; }
    if (kind === 'vehicle' && cnt >= D.rules.buildings.max_vehicles) { toast('Tối đa 1 Xe.'); return; }
    s.bldHand.splice(s.bldHand.indexOf(b), 1); g[i] = b; log(`Bạn đặt Công trình <b>${esc(BLD[b.id].name)}</b>`, 'P');
  }
  render();
}
function bindDnD() {
  document.addEventListener('dragstart', e => {
    const t = e.target.closest('[data-drag]'); if (!t) return;
    e.dataTransfer.setData('text/plain', t.dataset.drag); e.dataTransfer.effectAllowed = 'move';
  });
  document.addEventListener('dragover', e => { const c = e.target.closest('.cell'); if (c) { e.preventDefault(); c.classList.add('over'); } });
  document.addEventListener('dragleave', e => { const c = e.target.closest('.cell'); if (c) c.classList.remove('over'); });
  document.addEventListener('drop', e => {
    const c = e.target.closest('.cell'); if (!c) return; e.preventDefault(); c.classList.remove('over');
    let data; try { data = JSON.parse(e.dataTransfer.getData('text/plain')); } catch (_) { return; }
    picked = null; dropOn(c.dataset.o, +c.dataset.i, data);
  });
}

/* ================= điều chỉnh thủ công ================= */
function adjust(o, i, act) {
  const u = side(o).grid[i]; if (!u) return;
  if (u.kind === 'bld') {
    if (act === 'cnt-') u.counter = Math.max(0, u.counter - 1); else if (act === 'cnt+') u.counter++;
    else if (act === 'use') { side(o).grid[i] = null; side(o).bldUsed.push(u); log(`Bạn dùng ${BLD[u.id].kind === 'vehicle' ? 'Xe' : 'Công trình'} <b>${esc(BLD[u.id].name)}</b> (${esc(BLD[u.id].text_vn)})`, 'P'); }
    render(); return;
  }
  if (act === 'hp-') { u.hp -= 1; flash(o, i); if (u.hp <= 0) { ko(o, i); return; } checkThreshold(o, i); }
  else if (act === 'hp+') { if (u.hp < u.maxHp) { u.hp++; flash(o, i, true); } }
  else if (act === 'sh-') u.shield = Math.max(0, u.shield - 1);
  else if (act === 'sh+') u.shield++;
  else if (act.startsWith('st:')) { const k = act.slice(3); if (u.st[k]) delete u.st[k]; else u.st[k] = true; }
  else if (act === 'ko') { if (confirm(`Hạ ${M(u).name}?`)) { u.hp = 0; ko(o, i); return; } }
  render();
}

/* ================= render ================= */
let viewSel = null;
function render(animDice) {
  if (!S) return;
  renderStatus(); renderGrid('B'); renderGrid('P'); renderTray(animDice); renderInfo('P'); renderInfo('B'); renderHand(); renderViewer();
}
function renderStatus() {
  const p = scoreOf('P'), b = scoreOf('B');
  $('#status').innerHTML = `<span class="pill">${esc(T().name)}</span><span class="pill">Vòng ${Math.min(S.round, S.maxRounds)}/${S.maxRounds}</span>` +
    (S.phase === 'place' ? `<span class="pill turnP">Đặt quân</span>` : S.over ? `<span class="pill">Kết thúc</span>` : `<span class="pill ${S.turn === 'P' ? 'turnP' : 'turnB'}">Lượt: ${who(S.turn)}</span>`) +
    `<span class="pill">🍇 Bạn ${p.total} · Máy ${b.total}</span>`;
}
function tokensHtml(u) {
  let h = '';
  if (u.shield) h += `<span class="t" title="Khiên ${u.shield}"><img src="${TOK.shield}" alt="Khiên"><b>${u.shield}</b></span>`;
  ST_KEYS.forEach(k => { if (u.st[k]) h += `<span class="t" title="${ST_VI[k]}"><img src="${TOK[k]}" alt="${ST_VI[k]}"></span>`; });
  return `<div class="tok">${h}</div>`;
}
function renderGrid(o) {
  const s = side(o), g = s.grid; const el = $('#grid' + o);
  const order = o === 'B' ? [6, 7, 8, 3, 4, 5, 0, 1, 2] : [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const pp = pendingPick, hi = new Set();
  if (pp && pp.req.side === o) pp.req.opts.forEach(op => (pp.req.pick === 1 && !pp.req.center ? op : [op[0]]).forEach(i => hi.add(i)));
  el.innerHTML = order.map(i => {
    const u = g[i]; let inner = '';
    const cls = ['cell'];
    if (hi.has(i)) cls.push(o === pp.req.o ? 'ally-target' : 'target');
    if (pp && pp.chosen.includes(i) && pp.req.side === o) cls.push('picked');
    if (S.acting && S.acting.o === o && S.acting.i === i) cls.push('acting');
    if (picked && picked.type === 'cell' && o === 'P' && picked.i === i) cls.push('picked');
    if (isMon(u)) {
      const hidden = S.phase === 'place' && o === 'B';
      const drag = o === 'P' && !S.over ? `draggable="true" data-drag='${JSON.stringify({ type: 'cell', i })}'` : '';
      inner = `<div class="unit ${u.st.stun ? 'stunned' : ''}" ${drag} data-view="${o}:${i}">
        <img src="${hidden ? BACK_M : monImg(u.id)}" alt="${esc(M(u).name)}">
        ${hidden ? '' : tokensHtml(u)}
        ${hidden ? '' : `<div class="ov"><div class="hpbar"><button data-adj="hp-" title="−1 ❤">−</button><span>❤ ${u.hp}/${u.maxHp}</span><button data-adj="hp+" title="+1 ❤">+</button></div><div class="hpline"><i style="width:${Math.max(0, u.hp / u.maxHp * 100)}%"></i></div></div>`}
      </div>`;
    } else if (u && u.kind === 'bld') {
      const b = BLD[u.id];
      const drag = o === 'P' ? `draggable="true" data-drag='${JSON.stringify({ type: 'cell', i })}'` : '';
      inner = `<div class="unit" ${drag} data-view="${o}:${i}"><img src="${bldImg(u.id)}" alt="${esc(b.name)}">
        <div class="bldctl">${b.kind === 'house' ? `<button data-adj="cnt-">−</button><span>🎲 ${u.counter}</span><button data-adj="cnt+">+</button>` : `<button data-adj="use">Dùng xe</button>`}</div></div>`;
    } else inner = `<div class="empty-hint">${o === 'P' && (S.phase === 'place' || S.turn === 'P') ? ROW_VI[rowOf(i)] : ''}</div>`;
    return `<div class="${cls.join(' ')}" data-o="${o}" data-i="${i}">${inner}</div>`;
  }).join('');
}
function renderTray(animDice) {
  const el = $('#tray');
  if (S.phase === 'place') {
    el.innerHTML = `<span class="note">Kéo ${D.rules.team.on_field} quái từ <b>vách che</b> (bên phải) vào lưới của bạn. Hàng <b>Trước</b> gần đối thủ nhất. Hai bên lật thẻ cùng lúc.</span>
      <button class="btn primary" data-act="ready">Sẵn sàng · Lật thẻ</button>`; return;
  }
  if (S.over) { el.innerHTML = `<span class="note">Ván đã kết thúc.</span><button class="btn primary" data-act="newgame">Ván mới</button>`; return; }
  const o = S.turn, s = side(o);
  const dice = s.dice.map((d, k) => {
    const blank = o === 'P' && !d.used && !activators('P', d, s.dice).length;
    const drag = o === 'P' && !d.used ? `draggable="true" data-drag='${JSON.stringify({ type: 'die', di: k })}'` : '';
    const anim = (animDice && d.anim !== false) ? ' rolling' : ''; d.anim = false;
    return `<div class="die${d.sel ? ' sel' : ''}${d.used ? ' used' : ''}${anim}" style="background:${COL[d.el]}" ${drag} data-die="${k}" title="${EL_VI[d.el]} · mặt ${d.face} — kéo lên quái hệ ${EL_VI[d.el]} để thi triển, chạm để chọn thảy lại${blank ? ' (không gán được → +1 ✦ cuối lượt)' : ''}">${dieSvg(d.face, d.el)}<img class="eic" src="${elIcon(d.el)}" alt=""></div>`;
  }).join('');
  if (o === 'B') { el.innerHTML = `<span class="note"><b>Máy</b> đang chơi…</span><div class="dice">${dice}</div>`; return; }
  let acts = '';
  if (!s.rolled) {
    if (S.chooseColors) {
      acts = `<span class="note">Lượt đầu: chọn <b>${S.chooseColors} màu</b>, không thảy lại.</span><div class="colorpick">${EL_ORDER.map(e => `<label><input type="checkbox" data-color="${e}" ${S.colorPick.includes(e) ? 'checked' : ''}><img src="${elIcon(e)}" alt="">${EL_VI[e]}</label>`).join('')}</div>`;
    }
    acts += `<button class="btn primary" data-act="roll" ${S.busy ? 'disabled' : ''}>🎲 Thảy xí ngầu</button>`;
  } else {
    const canRe = !s.rerolled && !s.noReroll;
    acts = `<button class="btn" data-act="reroll" ${canRe && !S.busy ? '' : 'disabled'}>Thảy lại viên đã chọn${canRe ? ' (1 lần)' : ''}</button>`;
    if (!T().noEnergy) acts += `<button class="btn sm" data-act="reroll1" ${s.energy >= 1 && !S.busy ? '' : 'disabled'}>Thảy lại 1 viên · 1 ✦</button>`;
    if (T().energyActs) acts += `<select class="btn sm" data-act="recolor" ${s.energy >= 3 && !S.busy ? '' : 'disabled'}><option value="">Đổi màu · 3 ✦</option>${EL_ORDER.map(e => `<option value="${e}">→ ${EL_VI[e]}</option>`).join('')}</select>`;
  }
  acts += `<button class="btn warn" data-act="endturn" ${S.busy ? 'disabled' : ''}>Kết thúc lượt</button>`;
  el.innerHTML = `<div class="dice">${dice}</div><div class="acts">${acts}</div>`;
}
function energyHtml(n) { return `<span class="energy" title="Năng lượng ${n}/3">${[0, 1, 2].map(k => `<img src="${TOK.energy}" class="${k < n ? 'on' : ''}" alt="">`).join('')}</span>`; }
function renderInfo(o) {
  const s = side(o), sc = scoreOf(o);
  const ctl = o === 'P' && !T().noEnergy ? `<button class="btn sm" data-energy="-">−</button><button class="btn sm" data-energy="+">+</button>` : '';
  const extra = o === 'P' && T().energyActs && S.phase === 'play' ? `<button class="btn sm" data-act="shield2" ${s.energy >= 2 && S.turn === 'P' && !S.busy ? '' : 'disabled'}>+2 Khiên · 2 ✦</button>` : '';
  const trophies = s.trophies.map(u => `<img src="${monImg(u.id)}" title="${esc(M(u).name)} · ${M(u).price}🍇" data-view="t:${u.uid}" alt="">`).join('') || '<span class="muted">—</span>';
  const res = o === 'B' ? s.reserve.map(() => `<img src="${BACK_M}" alt="dự bị">`).join('') || '<span class="muted">—</span>' : '';
  $('#info' + o).innerHTML = `<div class="who"><h3>${o === 'P' ? 'Bạn' : '🤖 Máy'}</h3><span class="pill">🍇 ${sc.total}</span></div>
    <div class="meters">${T().noEnergy ? '' : energyHtml(s.energy) + ctl}${extra}</div>
    ${o === 'B' ? `<div class="lbl">Dự bị (úp) · ${s.reserve.length}</div><div class="mini-cards">${res}</div>` : ''}
    <div class="lbl">Chiến lợi phẩm (quái đã hạ) · ${sc.ko} 🍇</div><div class="mini-cards">${trophies}</div>`;
}
function renderHand() {
  const s = side('P');
  $('#hand').innerHTML = s.reserve.map(u => `<div class="hcard${picked && picked.uid === u.uid ? ' picked' : ''}" draggable="true" data-drag='${JSON.stringify({ type: 'res', uid: u.uid })}' data-res="${u.uid}" data-view="r:${u.uid}"><img src="${monImg(u.id)}" alt="${esc(M(u).name)}"></div>`).join('') || '<span class="muted">Hết dự bị.</span>';
  if (S.buildings) {
    const deck = S.bldDeck.length;
    $('#bldArea').innerHTML = `<h3 style="margin-top:8px">Công trình & Xe <small>(mở rộng)</small></h3>
      <div class="handcards">${s.bldHand.map(b => `<div class="hcard" draggable="true" data-drag='${JSON.stringify({ type: 'bld', uid: b.uid })}' data-bldh="${b.uid}" data-view="b:${b.uid}"><img src="${bldImg(b.id)}" alt="${esc(BLD[b.id].name)}"></div>`).join('')}
      <div class="hcard back" title="Chồng Công trình: ${deck} lá"><img src="${BACK_B}" alt=""></div></div>
      <button class="btn sm" data-act="drawbld" ${deck && s.energy >= 2 && S.turn === 'P' && S.phase === 'play' && !S.busy ? '' : 'disabled'}>Rút Công trình · 2 ✦</button>`;
  } else $('#bldArea').innerHTML = '';
}
function findView(key) {
  if (!key) return null; const [a, b] = key.split(':');
  if (a === 'P' || a === 'B') { const u = side(a).grid[+b]; return u ? { u, o: a, i: +b } : null; }
  const uid = +b, all = ['P', 'B'].flatMap(o => [...side(o).reserve, ...side(o).trophies, ...side(o).bldHand]);
  const u = all.find(x => x.uid === uid); return u ? { u } : null;
}
function renderViewer() {
  const v = findView(viewSel), el = $('#viewer');
  if (!v) { el.innerHTML = '<p class="muted">Rê chuột / chạm vào một thẻ để xem lớn. Mỗi ô có nút −/+ ❤; chi tiết Khiên & trạng thái chỉnh ở đây.</p>'; return; }
  const u = v.u;
  if (u.kind === 'bld') { const b = BLD[u.id]; el.innerHTML = `<img class="big" src="${bldImg(u.id)}" alt=""><p><b>${esc(b.name)}</b> · ${b.kind === 'house' ? 'Nhà' : 'Xe'} — ${esc(b.text_vn)}</p>`; return; }
  const hidden = v.o === 'B' && S.phase === 'place';
  if (hidden) { el.innerHTML = `<img class="big" src="${BACK_M}" alt="">`; return; }
  const m = M(u);
  let ctl = '';
  if (v.o) {
    ctl = `<div class="ctl"><b>❤</b><div class="row"><button class="btn sm" data-vadj="hp-">−</button><b>${u.hp}/${u.maxHp}</b><button class="btn sm" data-vadj="hp+">+</button><button class="btn sm warn" data-vadj="ko">Hạ</button></div>
      <b>Khiên</b><div class="row"><button class="btn sm" data-vadj="sh-">−</button><b>${u.shield}</b><button class="btn sm" data-vadj="sh+">+</button></div>
      <b>Trạng thái</b><div class="row">${ST_KEYS.map(k => `<button class="btn sm" data-vadj="st:${k}" style="${u.st[k] ? 'background:var(--sunlt)' : ''}"><img src="${TOK[k]}" style="width:14px;vertical-align:-2px" alt="">${ST_VI[k]}</button>`).join('')}</div></div>`;
  }
  el.innerHTML = `<img class="big" src="${monImg(u.id)}" alt="${esc(m.name)}">
    <p style="margin:0 0 6px"><b>${esc(m.name)}</b> · ${EL_VI[m.element]} · ${esc(m.role5)} · ${m.price} 🍇${u.acted ? ' · <i>đã kích hoạt lượt này</i>' : ''}</p>${ctl}`;
}

/* ================= sự kiện ================= */
function bindUI() {
  document.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('[data-close]')) { closeModal(); return; }
    const pk = t.closest('[data-pick]');
    if (pk && pendingPick) { if (pk.dataset.pick === 'skip') finishPick([]); else finishPick(pendingPick.chosen.slice()); return; }
    const act = t.closest('[data-act]'); if (act && act.tagName !== 'SELECT') { doAct(act.dataset.act); return; }
    const adj = t.closest('[data-adj]'); if (adj) { const c = adj.closest('.cell'); adjust(c.dataset.o, +c.dataset.i, adj.dataset.adj); return; }
    const vadj = t.closest('[data-vadj]'); if (vadj) { const v = findView(viewSel); if (v && v.o) adjust(v.o, v.i, vadj.dataset.vadj); return; }
    const en = t.closest('[data-energy]'); if (en) { const s = side('P'); s.energy = Math.max(0, Math.min(3, s.energy + (en.dataset.energy === '+' ? 1 : -1))); render(); return; }
    const dieEl = t.closest('[data-die]');
    if (dieEl && S && S.turn === 'P') { const d = side('P').dice[+dieEl.dataset.die]; if (d && !d.used) { d.sel = !d.sel; picked = d.sel ? { type: 'die', di: +dieEl.dataset.die } : null; render(); } return; }
    const cell = t.closest('.cell');
    if (cell && S) {
      const o = cell.dataset.o, i = +cell.dataset.i;
      if (pendingPick) { onPickCell(o, i); return; }
      viewSel = side(o).grid[i] ? `${o}:${i}` : viewSel;
      if (picked) {
        const pk2 = picked;
        if (pk2.type === 'die') { side('P').dice.forEach(d => (d.sel = false)); picked = null; dropOn(o, i, pk2); return; }
        if (pk2.type === 'cell' && o === 'P' && pk2.i !== i) { picked = null; dropOn(o, i, pk2); return; }
        if (pk2.type === 'res' || pk2.type === 'bld') { picked = null; dropOn(o, i, pk2); return; }
        picked = null;
      } else if (o === 'P' && side('P').grid[i] && (S.phase === 'place' || (S.turn === 'P' && !S.busy))) picked = { type: 'cell', i };
      render(); return;
    }
    const res = t.closest('[data-res]'); if (res) { const uid = +res.dataset.res; picked = picked && picked.uid === uid ? null : { type: 'res', uid }; viewSel = 'r:' + uid; render(); return; }
    const bh = t.closest('[data-bldh]'); if (bh) { const uid = +bh.dataset.bldh; picked = { type: 'bld', uid }; viewSel = 'b:' + uid; render(); return; }
    const view = t.closest('[data-view]'); if (view) { viewSel = view.dataset.view; renderViewer(); }
  });
  document.addEventListener('change', e => {
    const c = e.target.closest('[data-color]');
    if (c) { const el = c.dataset.color; if (c.checked) { if (S.colorPick.length >= S.chooseColors) { c.checked = false; toast(`Chỉ chọn ${S.chooseColors} màu.`); return; } S.colorPick.push(el); } else S.colorPick = S.colorPick.filter(x => x !== el); return; }
    const rc = e.target.closest('[data-act="recolor"]'); if (rc && rc.value) recolorSelected(rc.value);
  });
  document.addEventListener('mouseover', e => {
    const v = e.target.closest('[data-view]'); if (!v || !S || v.dataset.view === viewSel) return;
    viewSel = v.dataset.view; renderViewer();
  });
  $('#btnNew').onclick = () => setupModal();
  $('#btnRules').onclick = () => rulesModal();
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal' && S && S.phase !== 'setup') closeModal(); });
  $('#wheel').addEventListener('dblclick', () => $('#wheel').classList.toggle('min'));
}
function doAct(a) {
  switch (a) {
    case 'roll': if (!S.busy) rollPlayer(); break;
    case 'reroll': rerollSelected(false); break;
    case 'reroll1': rerollSelected(true); break;
    case 'endturn': endPlayerTurn(); break;
    case 'ready': startGame(); break;
    case 'newgame': closeModal(); setupModal(); break;
    case 'shield2': {
      const s = side('P'); if (s.energy < 2) return;
      S.busy = true;
      playerChooser({ o: 'P', side: 'P', effect: { k: 's', v: 2, printed: '1 quái mình' }, opts: monsOf('P').map(i => [i]), pick: 1, label: 'Năng lượng', ctx: {} }).then(r => {
        S.busy = false; if (r && r.length) { s.energy -= 2; addShield('P', r[0], 2); log(`Bạn trả 2 ✦: ${uName(s.grid[r[0]])} +2 Khiên`, 'P'); } render();
      });
      break;
    }
    case 'drawbld': {
      const s = side('P'); if (s.energy < 2 || !S.bldDeck.length) return;
      s.energy -= 2; const id = S.bldDeck.pop(); s.bldHand.push({ kind: 'bld', uid: UID++, id, counter: BLD[id].activations, moved: false });
      log(`Bạn trả 2 ✦ rút Công trình <b>${esc(BLD[id].name)}</b>`, 'P'); render(); break;
    }
  }
}

/* ================= modal: thiết lập ván ================= */
function openModal(html) { $('#modalCard').innerHTML = html; $('#modal').hidden = false; }
function closeModal() { $('#modal').hidden = true; }
let setup = null;
function setupModal() {
  setup = { tier: 'starter', set: D.starter_sets[0].id, picks: [], draft: null, buildings: true, first: 'random', van0: 0 };
  drawSetup();
}
function draftA() { // chia theo giá: rút 2 thẻ mỗi chồng
  const piles = {}; D.monsters.forEach(m => (piles[m.price] = piles[m.price] || []).push(m.id));
  Object.values(piles).forEach(shuffle);
  const hand = o => Object.keys(piles).sort().flatMap(p => piles[p].splice(0, 2));
  return { P: hand('P'), B: hand('B') };
}
function drawSetup() {
  const st = setup;
  const tierBtns = Object.entries(TIERS).map(([k, t]) => `<button class="opt" data-tier="${k}" aria-pressed="${st.tier === k}"><b>${t.name}</b><small>${t.desc}</small></button>`).join('');
  let team = '';
  if (st.tier === 'van0') {
    team = `<h4>Đội của bạn (Máy dùng đội còn lại)</h4><div class="opts">${D.van0.map((t, k) => `<button class="opt" data-van0="${k}" aria-pressed="${st.van0 === k}"><b>Đội ${esc(t.name)}</b><small>${t.members.join(' · ')}</small></button>`).join('')}</div>`;
  } else if (st.tier === 'starter') {
    team = `<h4>Bộ khởi động của bạn (Máy chọn ngẫu nhiên 1 bộ khác)</h4><div class="opts">${D.starter_sets.map(s => `<button class="opt" data-set="${s.id}" aria-pressed="${st.set === s.id}"><b>${esc(s.name)}</b><small>${esc(s.theme)}</small><br><small>${s.members.join(' · ')}</small></button>`).join('')}</div>`;
  } else {
    if (!st.draft) st.draft = draftA();
    const tot = sum(st.picks.map(id => MON[id].price));
    team = `<h4>Draft A · 8 thẻ bạn rút được — chọn ${D.rules.team.min_monsters}–${D.rules.team.max_monsters} quái, tổng ≤ ${D.rules.modes['1v1'].fund} 🍇 <span class="pill">${tot} / ${D.rules.modes['1v1'].fund} 🍇 · ${st.picks.length} quái</span> <button class="btn sm" data-redraft>Rút lại</button></h4>
      <div class="pickgrid">${st.draft.P.map(id => `<div class="pc ${st.picks.includes(id) ? 'on' : (tot + MON[id].price > 15 ? 'off' : '')}" data-pickm="${id}"><img src="${monImg(id)}" alt="${id}"></div>`).join('')}</div>
      <label style="display:block;margin-top:8px"><input type="checkbox" data-bld ${st.buildings ? 'checked' : ''}> Dùng bản mở rộng Công trình & Xe (cho bạn; Máy chưa dùng)</label>`;
  }
  openModal(`<h2>Ván mới · 1v1 với Máy</h2>
    <h4>Tầng chơi</h4><div class="opts">${tierBtns}</div>${team}
    <h4>Ai đi trước?</h4><div class="opts">${[['random', 'Ngẫu nhiên'], ['P', 'Bạn'], ['B', 'Máy']].map(([k, n]) => `<button class="opt" data-first="${k}" aria-pressed="${st.first === k}"><b>${n}</b></button>`).join('')}</div>
    <div class="foot">${S && S.phase !== 'setup' ? '<button class="btn" data-close>Hủy</button>' : ''}<button class="btn primary" data-go>Bắt đầu đặt quân →</button></div>`);
  const mc = $('#modalCard');
  mc.onclick = e => {
    const t = e.target;
    const b = t.closest('[data-tier]'); if (b) { st.tier = b.dataset.tier; drawSetup(); return; }
    const s2 = t.closest('[data-set]'); if (s2) { st.set = s2.dataset.set; drawSetup(); return; }
    const v0 = t.closest('[data-van0]'); if (v0) { st.van0 = +v0.dataset.van0; drawSetup(); return; }
    const f = t.closest('[data-first]'); if (f) { st.first = f.dataset.first; drawSetup(); return; }
    if (t.closest('[data-redraft]')) { st.draft = draftA(); st.picks = []; drawSetup(); return; }
    const pm = t.closest('[data-pickm]'); if (pm) { const id = pm.dataset.pickm; const k = st.picks.indexOf(id); if (k >= 0) st.picks.splice(k, 1); else { if (sum(st.picks.map(x => MON[x].price)) + MON[id].price > 15) { toast('Vượt quỹ 15 🍇.'); return; } if (st.picks.length >= 6) { toast('Tối đa 6 quái.'); return; } st.picks.push(id); } drawSetup(); return; }
    const bl = t.closest('[data-bld]'); if (bl) { st.buildings = bl.checked; return; }
    if (t.closest('[data-go]')) {
      if (st.tier === 'standard' && st.picks.length < 3) { toast('Chọn ít nhất 3 quái.'); return; }
      closeModal(); newGame(st);
    }
  };
}
function botDraft(cards) {
  // chọn đội ≤ 15: thử nhiều tổ hợp, ưu tiên giá trị, có Đỡ đòn, đa hệ
  let best = null, bv = -1;
  const n = cards.length;
  for (let mask = 1; mask < (1 << n); mask++) {
    const ids = cards.filter((_, k) => mask & (1 << k)); if (ids.length < 3 || ids.length > 6) continue;
    const cost = sum(ids.map(id => MON[id].price)); if (cost > 15) continue;
    const ms = ids.map(id => MON[id]);
    const v = cost * 2 + sum(ms.map(m => m.fair_sim)) + (ms.some(m => m.role_ai === 'Tanker') ? 4 : 0) + new Set(ms.map(m => m.element)).size * 1.5 + (ms.some(m => m.role_ai === 'Support') ? 2 : 0) + Math.random();
    if (v > bv) { bv = v; best = ids; }
  }
  return best || cards.slice(0, 3);
}
function newGame(st) {
  UID = 1;
  const tier = st.tier;
  let pIds, bIds, bName;
  if (tier === 'van0') { pIds = D.van0[st.van0].members; bIds = D.van0[1 - st.van0].members; bName = 'Đội ' + D.van0[1 - st.van0].name; }
  else if (tier === 'starter') { pIds = D.starter_sets.find(s => s.id === st.set).members; const others = D.starter_sets.filter(s => s.id !== st.set); const bs = others[rnd(others.length)]; bIds = bs.members; bName = bs.name; }
  else { pIds = st.picks.slice(); bIds = botDraft(st.draft.B); bName = 'Draft'; }
  const mkSide = ids => ({ grid: Array(9).fill(null), reserve: ids.map(mkUnit), dead: [], exiled: [], trophies: [], energy: 0, dice: [], rolled: false, bldHand: [], bldUsed: [] });
  S = { tier, phase: 'place', round: 1, maxRounds: D.rules.modes['1v1'].rounds, turn: 'P', first: st.first === 'random' ? (Math.random() < 0.5 ? 'P' : 'B') : st.first,
    sides: { P: mkSide(pIds), B: mkSide(bIds) }, over: false, busy: false, firstTurn: true, buildings: tier === 'standard' && st.buildings, bldDeck: shuffle(D.buildings.map(b => b.id)), chooseColors: 0, colorPick: [] };
  viewSel = null; picked = null; pendingPick = null; banner('');
  $('#log').innerHTML = '';
  log(`Ván mới · tầng <b>${TIERS[tier].name}</b>. Máy dùng: <b>${esc(bName)}</b>.`, null, 't');
  // Máy đặt quân úp
  const B = side('B');
  botPickField(B.reserve, Math.min(3, B.reserve.length)).forEach(u => { const empty = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(i => !B.grid[i]); summon('B', u, bestCellFor('B', u, empty), true); });
  render();
}
function startGame() {
  const P = side('P');
  const need = Math.min(D.rules.team.on_field, P.reserve.length + monsOf('P').length);
  if (monsOf('P').length < need) { toast(`Đặt đủ ${need} quái vào lưới trước.`); return; }
  if (TIERS[S.tier].noEnergy) { /* Ván 0: không dự bị, không ✦ */ }
  if (S.tier === 'van0') { P.reserve = []; side('B').reserve = []; }
  S.phase = 'play'; S.turn = S.first;
  const second = foe(S.first);
  if (!T().noEnergy) side(second).energy = 1;
  log(`Lật thẻ! ${who(S.first)} đi trước${T().noEnergy ? '' : `; ${who(second)} +1 ✦`}.`, null);
  ['P', 'B'].forEach(o => monsOf(o).forEach(i => log(`${who(o)}: ${uName(side(o).grid[i])} ở ${ROW_VI[rowOf(i)]}-${colOf(i) + 1}`, o)));
  beginTurn();
}
function rulesModal() {
  const refs = ['Luật nhanh', 'Trạng thái - từ khóa', 'Kỹ năng đặc biệt', 'Đặc tính', '5 vai trò', 'Chọn đội · Draft', 'Ván 0 · ván đầu tiên', 'Công trình - Xe ①', 'Công trình - Xe ②'];
  openModal(`<h2>Luật nhanh v6.5</h2>
    <p><b>Lượt 5 bước:</b> Đầu lượt (bỏ Khiên, Đau −2 ❤, nội tại) → Thảy 5 xí ngầu (thảy lại 1 lần) → Gán xí ngầu (viên hệ X kích hoạt 1 quái hệ X theo mặt) → Thi triển → Cuối lượt (bỏ Choáng/Yếu/Hăng hái; viên dư +1 ✦, giữ tối đa 3).</p>
    <p><b>Trên bàn này:</b> kéo xí ngầu lên quái để thi triển; ô viền đỏ là mục tiêu hợp lệ (Cận chiến chỉ đánh hàng gần nhất, Khiêu khích che đồng đội kề, Xuyên bỏ qua Khiêu khích). Nút −/+ trên thẻ để chỉnh ❤ tay; Khiên & trạng thái chỉnh ở khung xem thẻ. Nhấp đúp vòng khắc hệ để thu gọn.</p>
    <div class="rules">${refs.map(r => `<img src="assets/cards/reference/${encodeURIComponent(r)}.png" alt="${esc(r)}" loading="lazy">`).join('')}</div>
    <div class="foot"><button class="btn primary" data-close>Đóng</button></div>`);
}

/* ================= vòng khắc hệ ================= */
function drawWheel() {
  const cx = 50, cy = 52, R = 34;
  const pts = EL_ORDER.map((_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
  let s = `<svg viewBox="0 0 100 106"><defs><marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5 0 10z" fill="#221b45"/></marker></defs>`;
  EL_ORDER.forEach((k, i) => { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % 5], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), u = [dx / L, dy / L], o = 11; s += `<line x1="${x1 + u[0] * o}" y1="${y1 + u[1] * o}" x2="${x2 - u[0] * o}" y2="${y2 - u[1] * o}" stroke="#221b45" stroke-width="2.4" marker-end="url(#ar)"/>`; });
  EL_ORDER.forEach((k, i) => { const [x, y] = pts[i]; s += `<image href="${elIcon(k)}" x="${x - 10}" y="${y - 10}" width="20" height="20"/><text x="${x}" y="${y + (y > 55 ? 17 : -12)}" text-anchor="middle" font-size="8" font-weight="800" font-family="Baloo 2,sans-serif" fill="#221b45">${EL_VI[k]}</text>`; });
  s += `<text x="50" y="50" text-anchor="middle" font-size="7" font-weight="800" font-family="Baloo 2,sans-serif" fill="#221b45">A → B</text><text x="50" y="57" text-anchor="middle" font-size="5" font-weight="700" fill="#4a4370">khắc +1 · bị −1</text></svg>`;
  $('#wheel').innerHTML = s;
}

/* ================= khởi động ================= */
async function boot() {
  drawWheel(); bindUI(); bindDnD();
  try {
    const r = await fetch('data/karian_data.json'); if (!r.ok) throw new Error(r.status);
    D = await r.json();
  } catch (err) {
    openModal(`<h2>Không tải được dữ liệu</h2><p>Không đọc được <code>data/karian_data.json</code> (${esc(err.message)}).</p><p>Trình duyệt chặn đọc file khi mở trực tiếp <code>index.html</code>. Hãy chạy một server tĩnh trong thư mục dự án, ví dụ:</p><pre>python3 -m http.server 8000</pre><p>rồi mở <code>http://localhost:8000</code> — hoặc dùng bản GitHub Pages.</p>`);
    return;
  }
  D.monsters.forEach(m => (MON[m.id] = m)); D.buildings.forEach(b => (BLD[b.id] = b));
  setupModal();
}
boot();
