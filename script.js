/* Karian's Summoner · Bàn chơi ảo v7.0 (1v1 với Máy)
 * - Bàn chơi tĩnh: kéo thả thẻ, thảy xí ngầu, theo dõi ❤ / Khiên / trạng thái / ✦.
 * - Người chơi tự thao tác (có trợ lý tính sát thương khi gán xí ngầu), Máy tự chơi lượt của mình.
 * Dữ liệu: data/karian_data.json (luật v6.5 + 41 quái + 16 Công trình/Xe).
 */
'use strict';
const APP_VER = '7.9.0';   // trùng với ?v= trong index.html

/* ================= hằng số ================= */
const EL_ORDER = ['Water', 'Fire', 'Grass', 'Rock', 'Lightning'];
const EL_VI = { Water: 'Nước', Fire: 'Hỏa', Grass: 'Cỏ', Rock: 'Đất', Lightning: 'Điện' };
const COL = { Fire: '#ff7a45', Water: '#3f95f0', Grass: '#45b157', Rock: '#b0824f', Lightning: '#f0bf00' };
const DARK = { Fire: '#c8381a', Water: '#1b5fb4', Grass: '#24793a', Rock: '#74502c', Lightning: '#c28a00' };
const ST_KEYS = ['pain', 'stun', 'weak', 'rage'];
const ST_VI = { pain: 'Đau', stun: 'Choáng', weak: 'Yếu', rage: 'Hăng hái' };
const ST_FROM_VI = { 'Đau': 'pain', 'Choáng': 'stun', 'Yếu': 'weak', 'Hăng hái': 'rage' };
const ROW_VI = ['Trước', 'Giữa', 'Sau'];
const STEPS = [
  { n: 0, t: '✨ Thuật triệu hồi', d: 'Suốt lượt mình: gọi 1 dự bị (trước khi gán) · xây Công trình' },
  { n: 1, t: '1 · Đầu lượt', d: 'Bỏ Khiên · Đau −2 ❤ · nội tại · Nhà đầu lượt' },
  { n: 2, t: '2 · Thảy xí ngầu', d: '×5 · thảy lại 1 lần' },
  { n: 3, t: '3 · Gán xí ngầu', d: 'Viên hệ X → 1 quái hệ X. Thiếu quái? Gọi dự bị trước' },
  { n: 4, t: '4 · Thi triển', d: 'Làm dòng kỹ năng · Hỗ trợ trước' },
  { n: 5, t: '5 · Cuối lượt', d: 'Bỏ Choáng / Yếu / Hăng hái · Nhà cuối lượt · viên dư +1 ✦' }
];
const ERRORS = [];
window.addEventListener('error', e => ERRORS.push({ t: Date.now(), msg: e.message, at: (e.filename || '') + ':' + e.lineno }));
window.addEventListener('unhandledrejection', e => ERRORS.push({ t: Date.now(), msg: String(e.reason && e.reason.stack || e.reason) }));
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
const artImg = id => 'assets/art/monsters/' + encodeURIComponent(id) + '.webp';     // A · ảnh quái gốc (Karian-Library/Monster system)
const bldArt = id => 'assets/art/buildings/' + encodeURIComponent(id) + '.webp';    // B · ảnh nhà / xe gốc (Karian-Library/Decoration)
const UI_IMG = { win: 'assets/ui/victory.webp', lose: 'assets/ui/defeat.webp', draw: 'assets/ui/battle.webp' };  // C

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
/* ================= hiệu ứng (FX) =================
 * Bàn được vẽ lại (render) rất thường xuyên, nên hiệu ứng không gắn thẳng vào DOM mà ghi vào FX:
 * mỗi lần vẽ, ô đọc FX và đặt animation-delay âm = thời gian đã trôi → hiệu ứng chạy tiếp, không bị giật lại từ đầu.
 */
const FX = {};
function fx(o, i, cls, dur = 650, data) {
  FX[`${o}:${i}`] = { cls, t: performance.now(), dur, data };
  const el = document.querySelector(`.cell[data-o="${o}"][data-i="${i}"]`);
  if (el) { el.classList.remove('fx-hit', 'fx-heal', 'fx-aim'); el.style.setProperty('--fxd', '0ms'); void el.offsetWidth; el.classList.add(cls); }
}
function fxOf(o, i) {
  const k = `${o}:${i}`, f = FX[k]; if (!f) return null;
  const el = performance.now() - f.t; if (el > f.dur) { delete FX[k]; return null; }
  return { cls: f.cls, el, data: f.data };
}
function flash(o, i, heal) { fx(o, i, heal ? 'fx-heal' : 'fx-hit', heal ? 700 : 650); }
/** Thanh máu: nhớ ❤ đã hiển thị để vẽ phần "máu vừa mất" tụt dần */
const HPV = {};
function hpLine(u) {
  const now = performance.now(); let h = HPV[u.uid];
  if (!h) h = HPV[u.uid] = { hp: u.hp, from: u.hp, t: -1e9 };
  if (h.hp !== u.hp) { h.from = h.hp; h.hp = u.hp; h.t = now; }
  const el = now - h.t, drop = h.from > u.hp && el < 1200;
  const pct = v => Math.max(0, Math.min(100, v / u.maxHp * 100)).toFixed(1) + '%';
  return { el: Math.round(el), cls: drop ? ' drain' : '', html: `<div class="hpbar1${drop ? ' drain' : ''}" style="--from:${pct(h.from)};--to:${pct(u.hp)};--fxd:-${Math.round(el)}ms" title="❤ ${u.hp}/${u.maxHp} — chỉnh ❤ ở thẻ lớn (bấm vào quái)"><div class="hpfill"><b class="lag"></b><i style="width:${pct(u.hp)}"></i></div><span>❤ ${u.hp}/${u.maxHp}</span></div>` };
}
const uName = u => `<b>${esc(M(u).name)}</b>`;
/** Nội tại / Ngưỡng / Di nguyện / Nhà kích hoạt: ghi nhật ký nổi bật + toast */
function notify(msg, o) { log('✦ ' + msg, o, 'pas'); toast(msg); }
function spend(o, n, why) { const s = side(o); s.energy -= n; S.stats[o].spent += n; log(`${who(o)} trả ${n} ✦: ${why}`, o); }
const houseActive = o => side(o).grid.some(x => x && x.kind === 'bld' && BLD[x.id].kind === 'house' && x.counter > 0);
function setStep(n) { if (!S) return; S.step = n; renderSteps(); }
/** D · Bước 3 (Gán): viên không có quái cùng màu trên sân → +1 ✦ NGAY (dùng được trong lượt này, như Engine v6.5).
 *  Gọi khi người chơi bắt đầu gán / tiêu ✦ / kết thúc lượt; Máy gọi sau lần thảy lại miễn phí.
 *  Viên mặt 6 đang cần cho kỹ năng đa sắc thì giữ lại. */
/** hiệu ứng: viên xí ngầu bung thành tinh linh sáng, bay về viên năng lượng, viên năng lượng phóng to rồi sáng lên */
function flyEnergy(fromRect, orbIndex) {
  if (!fromRect || !document.body.animate) return;
  const orbs = document.querySelectorAll('#infoP .energy img'), orb = orbs[Math.min(orbIndex, orbs.length - 1)];
  if (!orb) return;
  const r1 = orb.getBoundingClientRect(), x0 = fromRect.left + fromRect.width / 2, y0 = fromRect.top + fromRect.height / 2;
  const x1 = r1.left + r1.width / 2, y1 = r1.top + r1.height / 2, N = 9;
  for (let k = 0; k < N; k++) {
    const sp = document.createElement('i'); sp.className = 'sprite'; document.body.appendChild(sp);
    const a = (k / N) * Math.PI * 2, burst = 26 + Math.random() * 18, bx = x0 + Math.cos(a) * burst, by = y0 + Math.sin(a) * burst;
    const midx = (bx + x1) / 2 + (Math.random() - .5) * 120, midy = Math.min(by, y1) - 60 - Math.random() * 60;
    sp.animate([
      { transform: `translate(${x0}px,${y0}px) scale(.4)`, opacity: 0 },
      { transform: `translate(${bx}px,${by}px) scale(1.1)`, opacity: 1, offset: .22 },
      { transform: `translate(${midx}px,${midy}px) scale(.9)`, opacity: 1, offset: .6 },
      { transform: `translate(${x1}px,${y1}px) scale(.3)`, opacity: .2 }
    ], { duration: 900 + k * 45, easing: 'cubic-bezier(.4,0,.3,1)', fill: 'forwards' }).finished.then(() => sp.remove());
  }
  setTimeout(() => { const o2 = document.querySelectorAll('#infoP .energy img')[Math.min(orbIndex, 2)]; if (o2) { o2.classList.remove('pop'); void o2.offsetWidth; o2.classList.add('pop'); } }, 1250);
}
/** người chơi bấm "+✦": đổi ngay 1 viên không có quái cùng màu thành ✦ */
function dieToEnergy(k) {
  const s = side('P'), d = s.dice[k];
  if (!d || d.used || S.busy || S.turn !== 'P' || T().noEnergy || monsOf('P').some(i => M(s.grid[i]).element === d.el)) return;
  const el = document.querySelector(`.die[data-die="${k}"]`), rect = el && el.getBoundingClientRect();
  d.used = true; d.toE = true;
  const b = s.energy; s.energy = Math.min(D.rules.energy.cap, s.energy + 1); S.stats.P.gained += s.energy - b;
  log(`Bạn đổi viên ${EL_VI[d.el]} ${d.face} (không có quái cùng màu) → ${s.energy > b ? '+1 ✦' : '✦ đã đầy 3, bỏ'}`, 'P');
  render(); flyEnergy(rect, Math.max(0, s.energy - 1));
}
function lockDead(o) {
  const s = side(o); if (!s.rolled || s.locked) return 0;
  s.locked = true; if (T().noEnergy) return 0;
  const els = new Set(monsOf(o).map(i => M(s.grid[i]).element));
  const needs6 = new Set(); monsOf(o).forEach(i => M(s.grid[i]).skills.forEach(sk => { if (sk.multicolor === 'any6') needs6.add('*'); else (sk.multicolor || []).forEach(([e]) => needs6.add(e)); }));
  const dead = s.dice.filter(d => !d.used && !els.has(d.el) && !(d.face === 6 && (needs6.has(d.el) || needs6.has('*'))));
  if (!dead.length) return 0;
  const rects = o === 'P' ? dead.map(d => { const el = document.querySelector(`.die[data-die="${s.dice.indexOf(d)}"]`); return el && el.getBoundingClientRect(); }) : [];
  dead.forEach(d => { d.used = true; d.toE = true; });
  const b = s.energy; s.energy = Math.min(D.rules.energy.cap, s.energy + dead.length); S.stats[o].gained += s.energy - b;
  if (o === 'P') setTimeout(() => rects.forEach((r, k) => setTimeout(() => flyEnergy(r, Math.min(2, b + k)), k * 160)), 0);
  log(`${who(o)}: ${dead.length} viên không có quái cùng màu (${dead.map(d => EL_VI[d.el]).join(', ')}) → +${s.energy - b} ✦${s.energy - b < dead.length ? ' (đầy 3, phần dư bỏ)' : ''}`, o);
  render(); return dead.length;
}

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
async function damage(srcO, att, to, ti, v, ctx, direct, single) {
  const tg = side(to).grid, t = tg[ti]; if (!isMon(t)) return;
  // Xe Frost Coach: chặn 1 đòn đơn vào đồng đội kề xe, rồi rời sân
  if (single && !direct) {
    const cj = adjIdx(ti).find(j => tg[j] && tg[j].kind === 'bld' && BLD[tg[j].id].effect === 'block');
    if (cj !== undefined) { const car = tg[cj]; if (to === 'P') flyCardTo(document.querySelector(`.cell[data-o="P"][data-i="${cj}"]`), bldImg(car.id), document.getElementById('bldArea')); tg[cj] = null; side(to).bldUsed.push(car); ctx.blocked.add(ti); S.stats[to].blds.push(car.id); notify(`🚌 ${esc(BLD[car.id].name)} chặn đòn vào ${uName(t)} rồi rời sân`, to); render(); return; }
  }
  const prev = t.hp;
  let d = direct ? v : calcDmg(att, t, v, ctx);
  let abs = 0;
  if (!direct) { abs = Math.min(t.shield, d); t.shield -= abs; }
  const lost = d - abs; t.hp -= lost; ctx.dealt = true; flash(to, ti);
  const parts = []; if (!direct && att) { const em = elemMod(M(att).element, M(t).element); if (em) parts.push(em > 0 ? 'khắc +1' : 'bị khắc −1'); if (ctx.rage) parts.push('Hăng hái +1'); if (ctx.weak) parts.push('Yếu −1'); if (t.st.pain && pasKey(att) === 'burnBonus') parts.push(M(att).passive.name + ' +1'); }
  if (abs) parts.push(`Khiên đỡ ${abs}`);
  if (!ctx.quiet) log(`${att ? uName(att) + ' → ' : ''}${uName(t)}: −${lost} ❤${parts.length ? ' (' + parts.join(', ') + ')' : ''}`, srcO);
  // Gai: quái cận chiến đánh trúng mất 1 ❤
  if (!direct && att && isMelee(att) && pasKey(t) === 'thorns') {
    const ai = side(srcO).grid.indexOf(att);
    if (ai >= 0) { const p2 = att.hp; att.hp -= 1; flash(srcO, ai); notify(`${uName(t)} · Nội tại <i>${esc(M(t).passive.name)}</i>: ${uName(att)} mất 1 ❤`, to); if (att.hp <= 0) await ko(srcO, ai); else await checkThreshold(srcO, ai, p2); }
  }
  if (t.hp <= 0) {
    await ko(to, ti);
    if (att && pasKey(att) === 'chain' && side(srcO).grid.includes(att) && !ctx.chained) {
      const c = monsOf(to); if (c.length) { ctx.chained = true; const j = aiPickEnemy(srcO, att, c, 2, ctx); notify(`${uName(att)} · Nội tại <i>${esc(M(att).passive.name)}</i>: 2 sát thương lan sang ${uName(side(to).grid[j])}`, srcO); await damage(srcO, null, to, j, 2, { tg: {}, blocked: new Set() }, true); }
    }
  } else await checkThreshold(to, ti, prev);
}
async function checkThreshold(o, i, prev) {
  // Ngưỡng máu: mỗi lần ❤ tụt từ trên X xuống ≤X thì chạy ngay (kể cả trong lượt đối thủ)
  const u = side(o).grid[i]; if (!isMon(u)) return; const th = M(u).threshold;
  if (!th || u.hp <= 0 || prev == null || !(prev > th.at && u.hp <= th.at)) return;
  notify(`${uName(u)} còn ≤${th.at} ❤ → Ngưỡng <i>${esc(th.name)}</i>`, o);
  await runEffects(o, u, i, th.effects, o === 'P' && S.turn === 'P' ? playerChooser : aiChooser, th.name);
}
/** hiệu ứng bị hạ: quái nhún lên, xoay nửa vòng, bay về khu chiến lợi phẩm của bên hạ, bung sương rồi hiện thành lá bài */
function koFly(u, o, rect) {
  const done = () => { u.koFly = false; const c = document.querySelector(`.troph[data-uid="${u.uid}"]`); if (c) { c.classList.remove('arriving'); c.classList.add('mistin'); } };
  if (!document.body.animate) { done(); return; }
  const fly = document.createElement('img'); fly.className = 'kofly'; fly.src = artImg(u.id); document.body.appendChild(fly);
  Object.assign(fly.style, { left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', height: rect.height + 'px' });
  const flip = o === 'B' ? -1 : 1;
  setTimeout(async () => {
    const dest = document.getElementById('tro' + foe(o)), slot = document.querySelector(`.troph[data-uid="${u.uid}"]`);
    const r1 = (slot || dest || document.body).getBoundingClientRect();
    const dx = r1.left + r1.width / 2 - (rect.left + rect.width / 2), dy = r1.top + r1.height / 2 - (rect.top + rect.height / 2);
    const sc = Math.max(.25, (r1.width || 60) / rect.width);
    await fly.animate([
      { transform: `translate(0,0) scaleX(${flip}) rotate(0)`, offset: 0 },
      { transform: `translate(0,-28%) scaleX(${flip}) scale(1.12) rotate(0)`, offset: .18, easing: 'ease-out' },
      { transform: `translate(0,-8%) scaleX(${flip}) rotate(360deg)`, offset: .42 },
      { transform: `translate(${dx}px,${dy}px) scaleX(${flip}) scale(${sc}) rotate(540deg)`, offset: 1, opacity: .9 }
    ], { duration: 1250, easing: 'cubic-bezier(.45,0,.3,1)', fill: 'forwards' }).finished;
    fly.remove();
    const mist = document.createElement('i'); mist.className = 'mist'; document.body.appendChild(mist);
    Object.assign(mist.style, { left: r1.left + r1.width / 2 + 'px', top: r1.top + r1.height / 2 + 'px' });
    mist.animate([{ transform: 'translate(-50%,-50%) scale(.3)', opacity: .95 }, { transform: 'translate(-50%,-50%) scale(1.6)', opacity: 0 }], { duration: 650, easing: 'ease-out' }).finished.then(() => mist.remove());
    setTimeout(done, 120);
  }, 60);
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
  const artEl = document.querySelector(`.cell[data-o="${o}"][data-i="${i}"] .art`), artRect = artEl && artEl.getBoundingClientRect();
  s.grid[i] = null; s.dead.push(u);
  if (!u.scored) { u.scored = true; side(foe(o)).trophies.push(u); if (artRect) { u.koFly = true; koFly(u, o, artRect); } }
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
    case 'tauntE': { const tt = ms.filter(i => isTaunt(g[i])); return { pick: 1, opts: (tt.length ? tt : ms).map(i => [i]) }; }
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
const CANCEL = Symbol('huỷ gán');   // chooser trả về CANCEL = người chơi huỷ gán xí ngầu
const ENEMY_CODES = ['one', 'other', 'anyE', 'adjE', 'three', 'row', 'col', 'cross', 'all', 'tauntE'];
const SINGLE_CODES = ['one', 'other', 'anyE', 'tauntE'];

/** Chạy danh sách hiệu ứng của 1 kỹ năng. chooser(req) → Promise<mảng ô> */
async function runEffects(o, src, si, effects, chooser, label, fromDead) {
  const isUnit = isMon(src) && !fromDead, att = isUnit ? src : null, st = (src && src.st) || {};
  const ctx = { rage: isUnit && !!st.rage, weak: isUnit && !!st.weak, dealt: false, tg: {}, blocked: new Set(), skipped: false };
  const fo = foe(o);
  for (const e of effects) {
    if (S.over) return ctx;
    if (e.k === 'rev') { await revive(o, e.v, chooser, src); continue; }
    if (e.k === 'en') { const s = side(o), b = s.energy; s.energy = Math.min(D.rules.energy.cap, s.energy + e.v); S.stats[o].gained += s.energy - b; log(`${who(o)} +${s.energy - b} ✦`, o); render(); continue; }
    const enemy = ENEMY_CODES.includes(e.t);
    let targets = ctx.tg[e.t];
    const confirming = chooser === playerChooser && S.assignCtx && !S.assignCtx.confirmed;
    if (!targets) {
      const op = enemy ? enemyOptions(e.t, o, att, ctx) : allyOptions(e.t, o, src, si);
      if (op.auto) {
        targets = op.auto;
        // mục tiêu tự động (cả đội, mình, cả sân địch…): vẫn bật dải sáng để bạn xác nhận hoặc huỷ gán
        if (confirming && targets.length) { const r = await chooser({ o, side: enemy ? fo : o, src, effect: e, opts: [targets], pick: 1, label, ctx, confirm: true }); if (r === CANCEL) { ctx.cancelled = true; return ctx; } }
      }
      else if (!op.opts.length) targets = [];
      else { targets = await chooser({ o, side: enemy ? fo : o, src, effect: e, opts: op.opts, pick: op.pick, center: op.center, label, ctx, mustShow: confirming }); if (targets === CANCEL) { ctx.cancelled = true; return ctx; } if (!targets || !targets.length) ctx.skipped = true; }
      if (confirming && targets && targets.length) S.assignCtx.confirmed = true;
      if (o === 'B' && enemy && targets && targets.length && S.turn === 'B') { targets.forEach(i => fx(fo, i, 'fx-aim', 520)); await sleep(480); }
      ctx.tg[e.t] = targets;
    }
    targets = (targets || []).filter(i => isMon(side(enemy ? fo : o).grid[i]) && !(enemy && ctx.blocked.has(i)));
    if (!targets.length) { if (!ctx.skipped) log(`${esc(label)}: không có mục tiêu cho “${esc(e.printed || e.t)}”`, o); continue; }
    if (e.k === 'd') { for (const i of targets) { await damage(o, att, fo, i, e.v, ctx, false, SINGLE_CODES.includes(e.t)); if (S.over) return ctx; } }
    else if (e.k === 'loss') { for (const i of targets) { await damage(o, null, fo, i, e.v, ctx, true); if (S.over) return ctx; } }
    else if (e.k === 'strip') { targets.forEach(i => { const u = side(fo).grid[i]; log(`${uName(u)} mất hết Khiên (${u.shield})`, o); u.shield = 0; flash(fo, i); }); }
    else if (e.k === 'st') { if (T().noStatus) continue; const k = ST_FROM_VI[e.v]; targets.forEach(i => { if (setStatus(fo, i, k)) log(`${uName(side(fo).grid[i])} bị <b>${e.v}</b>`, o); }); }
    else if (e.k === 'h') { const got = targets.map(i => [side(o).grid[i], heal(o, i, e.v)]).filter(x => x[1] > 0); log(got.length ? got.map(([u, n]) => `${uName(u)} +${n} ❤`).join(', ') : `${esc(label)}: không ai cần hồi ❤`, o); }
    else if (e.k === 's') { targets.forEach(i => { addShield(o, i, e.v); log(`${uName(side(o).grid[i])} +${e.v} Khiên`, o); }); }
    else if (e.k === 'bf') { if (T().noStatus) continue; const k = ST_FROM_VI[e.v]; targets.forEach(i => { if (setStatus(o, i, k)) log(`${uName(side(o).grid[i])} được <b>${e.v}</b>`, o); }); }
    render();
  }
  if (ctx.dealt && isUnit) { delete src.st.rage; delete src.st.weak; }
  render();
  return ctx;
}
/** Hiệu ứng Công trình / Xe theo cùng định dạng kỹ năng */
function bldEffects(b) {
  const v = b.value;
  return ({
    heal1: [{ k: 'h', v, t: 'ally', printed: '1 đồng đội' }], healteam: [{ k: 'h', v, t: 'team', printed: 'cả đội' }],
    shield1: [{ k: 's', v, t: 'ally', printed: '1 đồng đội' }], shieldteam: [{ k: 's', v, t: 'team', printed: 'cả đội' }],
    rage1: [{ k: 'bf', v: 'Hăng hái', t: 'ally', printed: '1 đồng đội' }], weak1: [{ k: 'st', v: 'Yếu', t: 'anyE', printed: '1 địch' }],
    pain1: [{ k: 'st', v: 'Đau', t: 'anyE', printed: '1 địch' }], stun1: [{ k: 'st', v: 'Choáng', t: 'anyE', printed: '1 địch' }],
    strip: [{ k: 'strip', t: 'anyE', printed: '1 địch mất hết Khiên' }], ping: [{ k: 'loss', v, t: 'tauntE', printed: '1 địch (Khiêu khích trước)' }],
    energy: [{ k: 'en', v, t: 'self' }]
  })[b.effect] || [];
}
async function runHouse(o, i) {
  const b = side(o).grid[i]; if (!b || b.kind !== 'bld' || b.counter <= 0) return;
  const B = BLD[b.id]; b.counter--; S.acting = { o, i }; render();
  notify(`🏠 ${esc(B.name)}: ${esc(B.text_vn)} (còn 🎲${b.counter})`, o);
  await runEffects(o, b, i, bldEffects(B), o === 'P' ? playerChooser : aiChooser, B.name);
  if (b.counter === 0) log(`${esc(B.name)} còn 0 lần kích hoạt`, o);
  S.acting = null; render();
}
/** thẻ bay từ 1 ô về 1 khu vực (thu nhỏ dần) */
function flyCardTo(fromEl, src, toEl) {
  if (!fromEl || !toEl || !document.body.animate) return;
  const r0 = fromEl.getBoundingClientRect(), r1 = toEl.getBoundingClientRect();
  const fly = document.createElement('img'); fly.className = 'flysmall'; fly.src = src; document.body.appendChild(fly);
  const w = r0.width * .8, h = w * 88 / 63;
  Object.assign(fly.style, { left: r0.left + r0.width / 2 - w / 2 + 'px', top: r0.top + r0.height / 2 - h / 2 + 'px', width: w + 'px', height: h + 'px' });
  const dx = r1.left + 40 - (r0.left + r0.width / 2), dy = r1.bottom - 50 - (r0.top + r0.height / 2);
  fly.animate([{ transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 }, { transform: `translate(${dx * .5}px,${dy * .5 - 60}px) scale(.9) rotate(-8deg)`, opacity: 1, offset: .5 }, { transform: `translate(${dx}px,${dy}px) scale(.45) rotate(0)`, opacity: .5 }],
    { duration: 850, easing: 'cubic-bezier(.4,0,.3,1)', fill: 'forwards' }).finished.then(() => fly.remove());
}
async function useVehicle(o, i) {
  const b = side(o).grid[i]; if (!b || b.kind !== 'bld') return; const B = BLD[b.id];
  if (B.trigger !== 'use') { toast(`${B.name}: tự kích hoạt khi đối thủ đánh đơn vào đồng đội kề xe.`); return; }
  if (o !== 'P' || S.turn !== 'P' || S.busy || S.phase !== 'play') { toast('Chỉ dùng xe trong lượt của bạn.'); return; }
  S.busy = true; S.acting = { o, i }; render();
  log(`Bạn dùng Xe <b>${esc(B.name)}</b>: ${esc(B.text_vn)}`, 'P');
  const ctx = await runEffects(o, b, i, bldEffects(B), playerChooser, B.name);
  S.busy = false; S.acting = null;
  if (ctx && ctx.skipped) { log(`Hủy dùng ${esc(B.name)} — xe ở lại sân`, 'P'); render(); return; }
  flyCardTo(document.querySelector(`.cell[data-o="${o}"][data-i="${i}"]`), bldImg(b.id), document.getElementById('bldArea'));
  if (side(o).grid[i] === b) side(o).grid[i] = null;
  side(o).bldUsed.push(b); S.stats[o].blds.push(b.id);
  log(`${esc(B.name)} đã giúp xong → rời sân`, 'P'); render();
}
async function revive(o, hp, chooser, src) {
  const s = side(o), cands = s.dead.filter(u => u !== src);   // “1 đồng đội”: không tự hồi sinh chính mình
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
  // chỉ còn 1 lựa chọn → tự chọn; trừ khi đó là do Khiêu khích kéo đòn (để bạn thấy quái nào đang che)
  const g = side(req.side).grid;
  const tauntForced = req.side !== req.o && SINGLE_CODES.includes(req.effect.t) && req.opts.some(op => isMon(g[op[0]]) && isTaunt(g[op[0]]) && adjIdx(op[0]).some(j => isMon(g[j]) && !req.opts.some(x => x[0] === j)));
  if (req.opts.length === 1 && req.pick === 1 && !tauntForced && !req.mustShow && !req.confirm) return Promise.resolve(req.opts[0]);
  return new Promise(resolve => {
    const chosen = [];
    pendingPick = { req, chosen, resolve };
    if (!beam && S.beamKind !== 'nrg') { const a = S.acting && document.querySelector(`.cell[data-o="${S.acting.o}"][data-i="${S.acting.i}"] .art`); S.beamFromRect = a ? a.getBoundingClientRect() : null; S.beamKind = 'aim'; }
    setTimeout(() => { if (pendingPick && pendingPick.req === req && S.beamFromRect) startBeam(S.beamFromRect, S.beamKind || 'aim'); }, 0);
    const eff = req.effect, kind = { d: `⚔ ${eff.v} sát thương`, h: `hồi ${eff.v} ❤`, s: `+${eff.v} Khiên`, st: `gây ${eff.v}`, bf: `${eff.v}` }[eff.k] || '';
    const canCancel = S.assignCtx && !S.assignCtx.confirmed;
    banner(`<span><b>${esc(req.label)}</b>: ${req.confirm ? 'chạm 1 mục tiêu sáng để xác nhận' : 'chọn ' + (req.pick > 1 ? req.pick + ' mục tiêu' : 'mục tiêu')} (${esc(eff.printed || '')}) · ${kind}</span>` +
      (req.pick > 1 ? `<button class="btn sm" data-pick="done">Xong</button>` : '') + (canCancel ? `<button class="btn sm dark" data-act="cancelassign">↶ Huỷ gán</button>` : `<button class="btn sm warn" data-pick="skip">Bỏ qua</button>`));
    render();
  });
}
function finishPick(res) { const p = pendingPick; pendingPick = null; banner(''); stopBeam(); render(); p.resolve(res); }
/* ---------- dải sáng: từ nút năng lượng / quái đang ra đòn tới con trỏ ---------- */
let beam = null;
function startBeam(from, kind) {
  if (!from) return; stopBeam();
  const r = from.getBoundingClientRect ? from.getBoundingClientRect() : from;
  const svg = document.getElementById('beam');
  beam = { x: r.left + r.width / 2, y: r.top + r.height / 2, kind };
  svg.setAttribute('class', 'beam on ' + kind);
  moveBeam(beam.x + 1, beam.y - 1);
}
function moveBeam(x, y) {
  if (!beam) return;
  const svg = document.getElementById('beam');
  const t = document.elementFromPoint(x, y), hit = t && t.closest('.cell.target, .cell.ally-target, .die:not(.used), .slot-cancel .btn:not(:disabled)');
  let ex = x, ey = y;
  if (hit) { const r = hit.getBoundingClientRect(); ex = r.left + r.width / 2; ey = r.top + r.height / 2; }
  const cx = (beam.x + ex) / 2, cy = Math.min(beam.y, ey) - Math.max(40, Math.abs(ex - beam.x) * 0.25);
  // mũi tên: lùi đường cong lại để đầu mũi tên nằm đúng con trỏ
  const dx = ex - cx, dy = ey - cy, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  const isAim = beam.kind === 'aim', back = isAim ? 22 : 0;
  const bx = ex - ux * back, by = ey - uy * back;
  const d = `M${beam.x},${beam.y} Q${cx},${cy} ${bx},${by}`;
  svg.querySelectorAll('path').forEach(p => p.setAttribute('d', d));
  const w = 17, px = -uy * w, py = ux * w;
  svg.querySelector('.head').setAttribute('points', `${ex},${ey} ${bx + px},${by + py} ${bx - px},${by - py}`);
  const c = svg.querySelector('.ring'); c.setAttribute('cx', ex); c.setAttribute('cy', ey);
  svg.classList.toggle('lock', !!hit);
}
function stopBeam() { beam = null; const svg = document.getElementById('beam'); if (svg) svg.setAttribute('class', 'beam'); }
document.addEventListener('mousemove', e => { if (beam) moveBeam(e.clientX, e.clientY); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && pendingPick && S && S.assignCtx && !S.assignCtx.confirmed) finishPick(CANCEL); });
function onPickCell(o, i) {
  const p = pendingPick; if (!p) return false;
  if (o !== p.req.side) { toast('Chọn ô được viền sáng.'); return true; }
  const op = p.req.opts.find(x => (p.req.pick === 1 && !p.req.center) ? x.includes(i) : x[0] === i);
  if (op && p.req.confirm) { finishPick(op); return true; }
  if (!op) { toast('Ô này không hợp lệ (Cận chiến / Khiêu khích / tầm đánh).'); return true; }
  if (p.req.pick === 1) { finishPick(op); return true; }
  if (!p.chosen.includes(i)) p.chosen.push(i);
  if (p.chosen.length >= p.req.pick) finishPick(p.chosen.slice()); else render();
  return true;
}

/* ================= vòng lượt ================= */
function startTurn(o) {
  const s = side(o); const tasks = [];
  s.dice = []; s.rolled = false; s.rerolled = false; s.summoned = false; s.drew = false; s.locked = false;
  s.grid.forEach(x => { if (x && x.kind === 'bld') x.moved = false; });
  monsOf(o).forEach(i => { const u = s.grid[i]; if (u.shield) log(`${uName(u)} bỏ ${u.shield} Khiên`, o); u.shield = 0; u.acted = false; });
  // Đau: mất 2 ❤ thẳng rồi bỏ token (có kích hoạt Ngưỡng)
  for (const i of monsOf(o)) { const u = s.grid[i]; if (u.st.pain) { delete u.st.pain; tasks.push(async () => { const j = s.grid.indexOf(u); if (j < 0) return; log(`${uName(u)} bị Đau: mất 2 ❤ thẳng, bỏ token`, o); await damage(o, null, o, j, 2, { tg: {}, blocked: new Set(), quiet: true }, true); }); } }
  // Nội tại & đặc tính đầu lượt
  for (const i of monsOf(o)) {
    const u = s.grid[i];
    if (pasKey(u) === 'regenAlly' || pasKey(u) === 'photo') tasks.push(async () => runPassive(o, u));
    tasks.push(async () => runTopTrait(o, u));
  }
  // Nhà kích hoạt Đầu lượt
  s.grid.forEach((b, i) => { if (b && b.kind === 'bld' && BLD[b.id].kind === 'house' && BLD[b.id].trigger === 'start' && b.counter > 0) tasks.push(() => runHouse(o, s.grid.indexOf(b))); });
  return (async () => { for (const t of tasks) { if (S.over) return; await t(); } render(); })();
}
async function runPassive(o, u) {
  const s = side(o), ii = s.grid.indexOf(u), m = M(u); if (ii < 0 || !m.passive) return;
  if (m.passive.key === 'regenAlly') {
    const ms = monsOf(o).filter(j => s.grid[j].hp < s.grid[j].maxHp); if (!ms.length) { log(`${uName(u)} · Nội tại ${esc(m.passive.name)}: không ai cần hồi`, o); return; }
    const j = ms.sort((a, b) => (s.grid[a].hp / s.grid[a].maxHp) - (s.grid[b].hp / s.grid[b].maxHp))[0];
    heal(o, j, 1); notify(`${uName(u)} · Nội tại <i>${esc(m.passive.name)}</i>: ${uName(s.grid[j])} hồi 1 ❤`, o);
  } else if (m.passive.key === 'photo') {
    const got = [ii, ...adjIdx(ii).filter(j => isMon(s.grid[j]))].filter(j => heal(o, j, 1) > 0);
    notify(`${uName(u)} · Nội tại <i>${esc(m.passive.name)}</i>: ${got.length ? got.map(j => uName(s.grid[j])).join(', ') + ' hồi 1 ❤' : 'không ai cần hồi'}`, o);
  } else toast(`${m.passive.name}: nội tại luôn có hiệu lực, được tính tự động.`);
  render();
}
function runTopTrait(o, u, manual) {
  const s = side(o), i = s.grid.indexOf(u), t = M(u).trait_top; if (i < 0 || !t) return;
  if (t.k === 'steady') { if (rowOf(i) === 0) { u.shield += t.sh; notify(`${uName(u)} · Kiên định <i>${esc(t.n)}</i>: đứng hàng Trước → +${t.sh} Khiên`, o); } else if (manual) toast(`${t.n}: chỉ khi đứng hàng Trước.`); }
  else if (t.k === 'lone') { if (!adjIdx(i).some(j => isMon(s.grid[j]))) { u.shield += t.sh; notify(`${uName(u)} · Độc lập <i>${esc(t.n)}</i>: không có đồng đội kề → +${t.sh} Khiên`, o); } else if (manual) toast(`${t.n}: chỉ khi không có đồng đội kề.`); }
  else if (t.k === 'build' && manual) { adjIdx(i).filter(j => isMon(s.grid[j])).forEach(j => heal(o, j, t.heal)); notify(`${uName(u)} · Kiến thiết <i>${esc(t.n)}</i>: đồng đội kề hồi ${t.heal} ❤`, o); }
  render();
}
async function endTurn(o) {
  const s = side(o);
  // Nhà kích hoạt Cuối lượt
  for (const b of s.grid.slice()) { if (S.over) return; if (b && b.kind === 'bld' && BLD[b.id].kind === 'house' && BLD[b.id].trigger === 'end' && b.counter > 0) await runHouse(o, s.grid.indexOf(b)); }
  const cleared = [];
  monsOf(o).forEach(i => { const u = s.grid[i]; if (u.st.stun || u.st.weak || u.st.rage) cleared.push(uName(u)); delete u.st.stun; delete u.st.weak; delete u.st.rage; u.acted = false; });
  if (cleared.length) log(`Cuối lượt: bỏ Choáng/Yếu/Hăng hái trên ${cleared.join(', ')}`, o);
  // Viên không có quái cùng màu trên sân → +1 ✦ (mặt trống không đổi thành ✦)
  if (!T().noEnergy) {
    lockDead(o);
    if (houseActive(o) && s.energy > D.rules.energy.cap_with_house_end_of_turn) { log(`${who(o)}: Nhà còn xí ngầu → chỉ giữ tối đa 2 ✦ (bỏ ${s.energy - 2})`, o); s.energy = D.rules.energy.cap_with_house_end_of_turn; }
  }
  s.dice = []; s.rolled = false;
}
async function beginTurn() {
  if (S.over) return;
  const o = S.turn; S.turnCount++;
  log(`Vòng ${S.round}/${S.maxRounds} · Lượt ${who(o)}`, null, 't');
  S.busy = true; setStep(1); render();
  if (o === 'B') await sleep(450);
  await startTurn(o); if (S.over) return;
  S.busy = false;
  if (o === 'B') { await botTurn(); if (!S.over) nextTurn(); }
  else { prepPlayerDice(); setStep(2); render(); }
}
async function nextTurn() {
  if (S.over) return;
  S.busy = true; setStep(5); render();
  await endTurn(S.turn); if (S.over) return;
  await sleep(S.turn === 'B' ? 500 : 250);
  S.busy = false;
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
  saveStats(res, reason, p, b);
  render();
  const kind = p.total !== b.total ? (p.total > b.total ? 'win' : 'lose') : p.field !== b.field ? (p.field > b.field ? 'win' : 'lose') : 'draw';
  showResultScene(kind);
  openModal(`<div class="result ${kind}"><div class="burst">${kind === 'win' ? Array.from({ length: 24 }, (_, k) => `<i style="--k:${k};--x:${rnd(100)}%;--c:${Object.values(COL)[k % 5]}"></i>`).join('') : ''}</div>
    <img class="rimg" src="${UI_IMG[kind]}" alt="${kind}"><h2>${kind === 'win' ? 'CHIẾN THẮNG!' : kind === 'lose' ? 'THẤT BẠI' : 'HÒA'}</h2><p class="rsub">${res}</p></div><p>${esc(reason)}.</p>
    <table class="score"><tr><th></th><th>🍇 quái đã hạ</th><th>🍇 quái còn sống</th><th>Tổng</th><th>Quái trên sân</th></tr>
    <tr><td><b>Bạn</b></td><td>${p.ko}</td><td>${p.alive}</td><td><b>${p.total}</b></td><td>${p.field}</td></tr>
    <tr><td><b>Máy</b></td><td>${b.ko}</td><td>${b.alive}</td><td><b>${b.total}</b></td><td>${b.field}</td></tr></table>
    <p class="muted">Thời gian ${fmtTime(Date.now() - S.startTime)} · ${S.turnCount} lượt · ✦ Bạn nhận ${S.stats.P.gained}/tiêu ${S.stats.P.spent} · Máy nhận ${S.stats.B.gained}/tiêu ${S.stats.B.spent} · Công trình đã dùng: ${S.stats.P.blds.map(esc).join(', ') || '—'}</p>
    <div class="foot"><button class="btn" data-act="dlstats">Tải số liệu các ván (JSON)</button><button class="btn" data-close>Xem bàn</button><button class="btn primary" data-act="newgame">Ván mới</button></div>`);
}

/** Màn hình kết quả: đổi lớp trên <body> để cả bàn chuyển tông (thắng: sáng, thua: xám) */
function showResultScene(kind) { document.body.classList.remove('scene-win', 'scene-lose', 'scene-draw'); if (kind) document.body.classList.add('scene-' + kind); }

/* ================= xí ngầu người chơi ================= */
function prepPlayerDice() {
  const s = side('P'); s.dice = []; s.rolled = false; s.rerolled = false; s.locked = false;
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
  setStep(3); render(true);
}
function rerollSelected(paid, only) {
  const s = side('P'); const sel = only ? [only] : s.dice.filter(d => d.sel && !d.used);
  if (!sel.length) { toast('Chạm để chọn viên muốn thảy lại.'); return; }
  if (paid) { if (sel.length !== 1) { toast('Trả 1 ✦ để thảy lại đúng 1 viên.'); return; } if (s.energy < 1) { toast('Không đủ ✦.'); return; } }
  else { if (s.rerolled || s.noReroll) { toast('Đã hết lượt thảy lại miễn phí.'); return; } s.rerolled = true; }
  const before = sel.map(d => EL_VI[d.el] + ' ' + d.face);
  sel.forEach(d => { d.face = d6(); d.sel = false; d.anim = true; });
  if (paid) spend('P', 1, `thảy lại ${before[0]} → ${sel[0].face}`);
  else log(`Bạn thảy lại: ${sel.map(d => EL_VI[d.el] + ' ' + d.face).join(' · ')}`, 'P');
  picked = null; render(true);
}
function recolorSelected(el, die, o = 'P') {
  const s = side(o); const sel = die ? [die] : s.dice.filter(d => d.sel && !d.used);
  if (sel.length !== 1) { toast('Chọn đúng 1 viên để đổi màu.'); return; }
  if (s.energy < 3) { toast('Đổi màu cần 3 ✦.'); return; }
  const d = sel[0];
  spend(o, 3, `đổi màu viên ${EL_VI[d.el]} ${d.face} → ${EL_VI[el]}`); d.el = el; d.sel = false; d.toE = false; d.used = false; d.anim = true; picked = null; render(true);
}
async function assignDie(di, ci) {
  if (S.busy || S.turn !== 'P' || S.over) return;
  const s = side('P'), die = s.dice[di], u = s.grid[ci];
  if (!die || die.used) return;
  if (!isMon(u)) { toast('Thả xí ngầu lên một quái của bạn.'); return; }
  lockDead('P'); if (die.used) { toast('Viên này không có quái cùng màu nên đã thành ✦.'); return; }
  if (die.el !== M(u).element) { toast(`Viên ${EL_VI[die.el]} chỉ kích hoạt quái hệ ${EL_VI[die.el]}.`); return; }
  if (u.st.stun) { toast(`${M(u).name} đang Choáng, không dùng được kỹ năng.`); return; }
  if (u.acted) { toast('Mỗi quái chỉ kích hoạt 1 lần mỗi lượt.'); return; }
  const face0 = die.face, gift0 = u.giftUsed;
  let f = findSkill(u, die, s.dice);
  // Thiên phú (Flarevix): 1 lần/trận đổi xí ngầu thành mặt 6
  const tb = M(u).trait_bot;
  if (tb && tb.k === 'gifted' && !u.giftUsed && die.face !== 6 && confirm(`${M(u).name} – ${tb.n}: đổi viên này thành mặt 6? (1 lần/trận)`)) { die.face = 6; u.giftUsed = true; f = findSkill(u, die, s.dice); notify(`${uName(u)} · Thiên phú <i>${esc(tb.n)}</i>: xí ngầu thành mặt 6`, 'P'); }
  if (!f) { die.face = face0; u.giftUsed = gift0; toast(`Mặt ${die.face} là mặt trống của ${M(u).name}${die.face === 6 ? ' (hoặc thiếu xí ngầu phụ)' : ''}: không kích hoạt.`); return; }
  die.used = true; f.extra.forEach(j => (s.dice[j].used = true)); u.acted = true; die.sel = false; picked = null; S.hoverDie = null;
  S.busy = true; S.acting = { o: 'P', i: ci }; S.assignCtx = { confirmed: false }; setStep(4); render();
  const ctx = await runEffects('P', u, ci, f.skill.effects, playerChooser, f.skill.name);
  S.assignCtx = null; S.busy = false; S.acting = null; S.beamFromRect = null; S.beamKind = null;
  if (ctx && ctx.cancelled) {
    // ↶ Huỷ gán: trả xí ngầu về khay, quái chưa kích hoạt
    die.used = false; f.extra.forEach(j => (s.dice[j].used = false)); u.acted = false; die.face = face0; u.giftUsed = gift0; die.anim = true;
    log(`↶ Huỷ gán: viên ${EL_VI[die.el]} ${die.face} trở về khay (${uName(u)} chưa thi triển)`, 'P');
    setStep(3); render(true); return;
  }
  log(`${uName(u)} · <b>${esc(f.skill.name)}</b>${f.skill.tier === 'U' ? ' ★' : ''} (${EL_VI[die.el]} ${die.face})`, 'P');
  if (!S.over) setStep(s.dice.some(d => !d.used && activators('P', d, s.dice).length) ? 3 : 4);
  render();
}
function endPlayerTurn() {
  if (S.busy || S.turn !== 'P' || S.over) return;
  const s = side('P');
  if (!s.rolled) { if (!confirm('Bạn chưa thảy xí ngầu. Kết thúc lượt?')) return; }
  lockDead('P');
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
  if (quiet) return;
  s.summoned = true;
  log(`✨ ${who(o)} gọi ${uName(u)} ra ô ${ROW_VI[rowOf(cell)]}-${colOf(cell) + 1}`, o);
  const tt = M(u).trait_top;
  if (tt && tt.k === 'build') runTopTrait(o, u, true);
}
/** Thuật triệu hồi của Máy (spol 'smart'): biết xí ngầu thì chọn quái hợp xí ngầu nhất, chưa biết thì ưu tiên Khiêu khích → đắt */
function botSummon(dice) {
  const s = side('B');
  if (s.summoned || monsOf('B').length >= D.rules.team.on_field || !s.reserve.length) return false;
  const empty = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(i => !s.grid[i]); if (!empty.length) return false;
  const needT = !monsOf('B').some(i => isTaunt(s.grid[i]));
  let pick;
  if (!dice) pick = s.reserve.slice().sort((a, b) => ((isTaunt(b) && needT) - (isTaunt(a) && needT)) || (M(b).price - M(a).price))[0];
  else {
    const val = u => {
      let m = 0;
      dice.filter(d => !d.used).forEach(d => {
        if (d.el !== M(u).element) return;
        const f = findSkill(u, d, dice); if (!f) return;
        const dead = !monsOf('B').some(i => M(s.grid[i]).element === d.el);
        m = Math.max(m, skillValue(f.skill) - bestDie('B', d.el, d.face, dice) - (dead ? 1 : 0));
      });
      return m + 0.3 * M(u).price + (isTaunt(u) && needT ? 2 : 0);
    };
    pick = s.reserve.slice().sort((a, b) => val(b) - val(a))[0];
  }
  summon('B', pick, bestCellFor('B', pick, empty)); return true;
}
/* ---- E · cách Máy chấm điểm, chép từ Engine v6.5 (sim6.parts_value / sim64.turn) ---- */
const TF = { one: 1, other: 1, anyE: 1, adjE: 1, three: 2.2, row: 1.5, col: 1.5, cross: 1.8, all: 2.5, self: 1, ally: 1, front: 1, adj: 1.2, selfadj: 2, team: 2.2, deadA: 1, tauntE: 1 };
const STV = { 'Đau': 1.5, 'Choáng': 1.5, 'Yếu': 0.75, 'Hăng hái': 0.75 };
function partsValue(effects) {
  return sum(effects.map(e => { const f = TF[e.t] || 1; return e.k === 'd' ? 2 * e.v * f : e.k === 'h' ? 1.5 * e.v * f : e.k === 's' ? e.v * f : e.k === 'rev' ? 2 * e.v : e.k === 'loss' ? 2 * e.v : (e.k === 'st' || e.k === 'bf') ? 2 * (STV[e.v] || 1) * f : 0; }));
}
function skillValue(sk) { return partsValue(sk.effects); }
/** giá trị tốt nhất mà viên (el, face) mang lại cho các quái sẵn sàng */
function bestDie(o, el, face, dice) {
  return Math.max(0, ...activators(o, { el, face, used: false }, dice || []).map(a => skillValue(a.f.skill)));
}
const expDie = (o, el, dice) => sum([1, 2, 3, 4, 5, 6].map(f => bestDie(o, el, f, dice))) / 6;
function planBot(dice, o = 'B') {
  // Gán theo cặp (viên, quái) giá trị cao nhất (Engine v6.5): mỗi viên 1 quái, mỗi quái 1 lần
  const s = side(o), late = S.maxRounds - S.round <= 1, opts = [];
  dice.forEach((d, k) => {
    if (d.used) return;
    activators(o, d, dice).forEach(a => opts.push({ v: skillValue(a.f.skill) + 0.01 * M(a.u).price, k, a, gift: false }));
    // Thiên phú: đổi viên thành mặt 6 khi lời ≥ 5 hoặc sắp hết trận
    monsOf(o).map(i => ({ i, u: s.grid[i] })).forEach(({ i, u }) => {
      const tb = M(u).trait_bot; if (!tb || tb.k !== 'gifted' || u.giftUsed || u.acted || u.st.stun || d.el !== M(u).element || d.face === 6) return;
      const f6 = findSkill(u, { el: d.el, face: 6, used: false }, dice); if (!f6) return;
      const cur = findSkill(u, d, dice), gain = skillValue(f6.skill) - (cur ? skillValue(cur.skill) : 0);
      if (gain >= 5 || (late && gain > 0)) opts.push({ v: skillValue(f6.skill) + 0.01 * M(u).price - (late ? 0 : 2.5), k, a: { i, u, f: f6 }, gift: true });
    });
  });
  opts.sort((a, b) => b.v - a.v);
  const usedD = new Set(), usedU = new Set(), plan = [];
  for (const op of opts) {
    if (usedD.has(op.k) || usedU.has(op.a.i) || op.a.f.extra.some(j => usedD.has(j))) continue;
    usedD.add(op.k); op.a.f.extra.forEach(j => usedD.add(j)); usedU.add(op.a.i);
    plan.push({ i: op.a.i, u: op.a.u, skill: op.a.f.skill, die: dice[op.k], extra: op.a.f.extra, gift: op.gift });
  }
  return plan;
}
async function botTurn() {
  // Lượt của Máy theo Engine v6.5 (sim64.turn): gọi dự bị → thảy → gọi theo xí ngầu → thảy lại → ✦ → gán → đổi màu → thi triển → Khiên
  const s = side('B'), t = T();
  await sleep(400);
  if (!monsOf('B').length && botSummon()) { render(); await sleep(500); }
  if (!monsOf('B').length) return;
  setStep(2); await sleep(350);
  let els = diceColorsFor('B'); const first = S.firstTurn && S.first === 'B';
  if (first) { const have = EL_ORDER.filter(e => monsOf('B').some(i => M(s.grid[i]).element === e)); els = have.concat(EL_ORDER.filter(e => !have.includes(e))).slice(0, t.firstDice); }
  s.dice = els.map(el => ({ el, face: d6(), used: false }));
  s.rolled = true; render(true);
  log(`Máy thảy: ${s.dice.map(d => EL_VI[d.el] + ' ' + d.face).join(' · ')}`, 'B');
  await sleep(750);
  if (monsOf('B').length < D.rules.team.on_field && botSummon(s.dice)) { render(); await sleep(500); }
  const ready = () => new Set(monsOf('B').filter(i => !s.grid[i].st.stun).map(i => M(s.grid[i]).element));
  if (!first && !t.noReroll) {
    // thảy lại miễn phí: viên nào đang kém hơn kỳ vọng của chính nó
    const rr = s.dice.filter(d => ready().has(d.el) && bestDie('B', d.el, d.face, s.dice) < expDie('B', d.el, s.dice) - 0.01);
    if (rr.length) { const b0 = rr.map(d => EL_VI[d.el] + ' ' + d.face); rr.forEach(d => { d.face = d6(); d.anim = true; }); log(`Máy thảy lại: ${rr.map((d, k) => b0[k] + ' → ' + d.face).join(' · ')}`, 'B'); render(true); await sleep(650); }
  }
  setStep(3);
  lockDead('B'); await sleep(250);
  if (!first && !t.noEnergy) {
    // trả 1 ✦ / viên khi lời ≥ 1 (giữ 3 ✦ nếu định đổi màu)
    const canRe = t.energyActs && !houseActive('B');
    const dup = new Set(monsOf('B').map(i => M(s.grid[i]).element)).size < monsOf('B').length;
    const keep = canRe && dup && s.dice.some(d => d.toE) ? 3 : 0;
    for (let n = 0; n < 6 && s.energy - 1 >= keep; n++) {
      const cand = s.dice.filter(d => !d.used && ready().has(d.el)).map(d => ({ d, g: expDie('B', d.el, s.dice) - bestDie('B', d.el, d.face, s.dice) })).filter(x => x.g >= 1).sort((a, b) => b.g - a.g);
      if (!cand.length) break;
      const d = cand[0].d, b0 = EL_VI[d.el] + ' ' + d.face; d.face = d6(); d.anim = true; spend('B', 1, `thảy lại ${b0} → ${d.face}`); render(true); await sleep(550);
    }
  }
  let plan = planBot(s.dice);
  // đổi màu: viên đã thành ✦ → màu của quái còn rảnh có kỹ năng ở mặt đó
  while (t.energyActs && !houseActive('B') && s.energy >= 3) {
    const idle = monsOf('B').filter(i => !s.grid[i].st.stun && !plan.some(p => p.i === i));
    const spare = s.dice.filter(d => d.toE);
    let best = null;
    spare.forEach(d => idle.forEach(i => { const u = s.grid[i], f = findSkill(u, { el: M(u).element, face: d.face, used: false }, s.dice); if (f && (!best || skillValue(f.skill) > best.v)) best = { d, u, v: skillValue(f.skill) }; }));
    if (!best || best.v < 3) break;
    recolorSelected(M(best.u).element, best.d, 'B'); await sleep(550);
    plan = planBot(s.dice);
  }
  plan.sort((a, b) => (M(a.u).role_ai !== 'Support') - (M(b.u).role_ai !== 'Support'));   // Hỗ trợ trước
  log(plan.length ? `Máy gán: ${plan.map(p => `${EL_VI[p.die.el]} ${p.gift ? '6 (Thiên phú)' : p.die.face} → ${uName(p.u)} (${esc(p.skill.name)})`).join(' · ')}` : 'Máy không gán được viên nào', 'B');
  await sleep(450); setStep(4);
  for (const p of plan) {
    if (S.over) return;
    const ci = s.grid.indexOf(p.u); if (ci < 0 || p.u.st.stun || p.die.used) continue;
    if (p.gift) { p.die.face = 6; p.u.giftUsed = true; notify(`${uName(p.u)} · Thiên phú <i>${esc(M(p.u).trait_bot.n)}</i>: xí ngầu thành mặt 6`, 'B'); }
    const f = findSkill(p.u, p.die, s.dice); if (!f) continue;
    p.die.used = true; f.extra.forEach(j => (s.dice[j].used = true)); p.u.acted = true;
    S.acting = { o: 'B', i: ci }; render();
    log(`${uName(p.u)} · <b>${esc(f.skill.name)}</b>${f.skill.tier === 'U' ? ' ★' : ''} (${EL_VI[p.die.el]} ${p.die.face})`, 'B');
    await sleep(600);
    await runEffects('B', p.u, ci, f.skill.effects, aiChooser, f.skill.name);
    S.acting = null; render(); await sleep(600);
  }
  if (S.over) return;
  if (botSummon()) { render(); await sleep(400); }   // quái chết giữa lượt → vẫn gọi được
  // dồn ✦ thành Khiên (ưu tiên quái Khiêu khích, rồi quái ít ❤ + Khiên nhất); giữ 3 ✦ nếu đội có 2 quái cùng hệ để đổi màu
  if (!t.noEnergy) {
    const aliveEls = [...monsOf('B').map(i => s.grid[i]), ...s.reserve].map(u => M(u).element);
    const save = t.energyActs && !houseActive('B') && new Set(aliveEls).size < aliveEls.length && s.energy >= 3;
    while (!save && s.energy >= 2 && monsOf('B').length) {
      const i = monsOf('B').sort((a, b) => (!isTaunt(s.grid[a]) - !isTaunt(s.grid[b])) || ((s.grid[a].hp + s.grid[a].shield) - (s.grid[b].hp + s.grid[b].shield)))[0];
      spend('B', 2, `${uName(s.grid[i])} +2 Khiên`); addShield('B', i, 2); render(); await sleep(450);
    }
  }
  await sleep(300);
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
    else { if (s.summoned) { toast('Thuật triệu hồi: mỗi lượt chỉ gọi 1 quái dự bị.'); return; } summon('P', u, i); }
  } else if (data.type === 'cell') {
    const from = data.i; if (from === i) return; const u = g[from]; if (!u) return;
    if (g[i]) { if (S.phase !== 'place') { toast('Chỉ dời sang ô trống.'); return; } g[from] = g[i]; g[i] = u; }
    else {
      if (S.phase === 'play') {
        if (u.kind === 'bld') { if (!(BLD[u.id].kind === 'vehicle' && !u.moved)) { toast(BLD[u.id].kind === 'vehicle' ? 'Xe chỉ đi 1 ô miễn phí mỗi lượt.' : 'Nhà không di chuyển.'); return; } if (!adjIdx(from).includes(i)) { toast('Xe đi 1 ô (kề).'); return; } u.moved = true; log(`Xe <b>${esc(BLD[u.id].name)}</b> đi 1 ô`, 'P'); }
        else {
          if (!T().energyActs) { toast(`Tầng ${T().name} chưa dùng “dời quái”.`); return; }
          if (s.energy < 2) { toast('Dời 1 quái cần 2 ✦.'); return; }
          if (!confirm(`Trả 2 ✦ để dời ${M(u).name}?`)) return; spend('P', 2, `dời ${uName(u)} sang ${ROW_VI[rowOf(i)]}-${colOf(i) + 1}`);
        }
      }
      g[i] = u; g[from] = null;
    }
  } else if (data.type === 'bld') {
    if (g[i]) { toast('Công trình đặt vào ô trống.'); return; }
    const b = s.bldHand.find(x => x.uid === data.uid); if (!b) return;
    const kind = BLD[b.id].kind;
    const cnt = g.filter(x => x && x.kind === 'bld' && BLD[x.id].kind === kind && (kind === 'vehicle' || x.counter > 0)).length;
    if (kind === 'house' && cnt >= D.rules.buildings.max_houses) { toast('Tối đa 2 Nhà (nhà làm cảnh không tính).'); return; }
    if (kind === 'vehicle' && cnt >= D.rules.buildings.max_vehicles) { toast('Tối đa 1 Xe.'); return; }
    s.bldHand.splice(s.bldHand.indexOf(b), 1); g[i] = b; log(`Bạn đặt ${kind === 'house' ? 'Nhà' : 'Xe'} <b>${esc(BLD[b.id].name)}</b>`, 'P');
  }
  render();
}
function bindDnD() {
  document.addEventListener('dragstart', e => {
    const t = e.target.closest('[data-drag]'); if (!t) return;
    viewPin = false; hideViewer(true);
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
    else if (act === 'use') { useVehicle(o, i); return; }
    else if (act === 'house') { if (o === 'P' && S.turn === 'P' && !S.busy) { S.busy = true; runHouse(o, i).then(() => { S.busy = false; render(); }); } return; }
    render(); return;
  }
  if (act === 'hp-') { const prev = u.hp; u.hp -= 1; flash(o, i); if (u.hp <= 0) { ko(o, i); return; } checkThreshold(o, i, prev); }
  else if (act === 'hp+') { if (u.hp < u.maxHp) { u.hp++; flash(o, i, true); } }
  else if (act === 'sh-') u.shield = Math.max(0, u.shield - 1);
  else if (act === 'sh+') u.shield++;
  else if (act.startsWith('st:')) { const k = act.slice(3); if (u.st[k]) delete u.st[k]; else u.st[k] = true; }
  else if (act === 'ko') { if (confirm(`Hạ ${M(u).name}?`)) { u.hp = 0; ko(o, i); return; } }
  else if (act === 'run:pas') { runPassive(o, u); return; }
  else if (act === 'run:thr') { const th = M(u).threshold; if (th && !S.busy) { S.busy = true; notify(`${uName(u)} · Ngưỡng <i>${esc(th.name)}</i> (chạy tay)`, o); runEffects(o, u, i, th.effects, o === 'P' ? playerChooser : aiChooser, th.name).then(() => { S.busy = false; render(); }); } return; }
  else if (act === 'run:top') { runTopTrait(o, u, true); return; }
  else if (act === 'gift') { u.giftUsed = !u.giftUsed; }
  render();
}

/* ================= render ================= */
let viewSel = null;
/* ---------- hình nền "App Background Gemini AI" khớp với bàn chơi ----------
 * Khoảng trống bàn cờ trong ảnh nền (ảnh gốc 2752×1536): 5 cột ô 125px từ x=1081, các hàng từ y≈228 đến 1218 (tâm y=723).
 * Phóng ảnh nền để 125px ảnh = 1 ô của bàn chơi, đặt cột trùng cột, tâm trùng tâm → bàn chơi "nằm" đúng trong khoảng trống của rừng. */
const BG = { w: 2752, h: 1536, tx: 125, ty: 123.2, x0: 1081, y0: 353.8 };   // ô cỏ 125 × 123.2px, ô (0,0) của sân tại (1081, 353.8)
/** chọn ngẫu nhiên vài đường chia ô trong mỗi vùng 3×3, cho đường sáng lên và tinh linh nhỏ bay dọc theo */
/** 4 đường sáng cố định theo 4 cạnh ngoài của mỗi vùng 3×3, tinh linh nhỏ bay dọc theo (lặp tại chỗ) */
function sparkLines() {
  const edges = [{ v: false, at: 0, d: 6.5, dl: 0 }, { v: true, at: 1, d: 7.5, dl: -2.5 }, { v: false, at: 1, d: 7, dl: -4.5, rev: 1 }, { v: true, at: 0, d: 8, dl: -1.2, rev: 1 }];
  document.querySelectorAll('.glines').forEach(g => {
    g.innerHTML = edges.map(l => `<span class="gl ${l.v ? 'v' : 'h'}${l.rev ? ' rev' : ''}" style="${l.v ? `left:${l.at * 100}%;top:0;height:100%` : `top:${l.at * 100}%;left:0;width:100%`};--d:${l.d}s;--dl:${l.dl}s"><i></i><i style="animation-delay:calc(var(--dl) - ${(l.d / 2).toFixed(1)}s)"></i></span>`).join('');
  });
}
function alignBackground() {
  const b = document.getElementById('board'); if (!b) return;
  const st = document.getElementById('status');
  if (st) {   // cụm trạng thái: căn giữa theo bàn chơi, nhưng không đè logo / các nút bên phải
    const r0 = b.getBoundingClientRect(), w = st.offsetWidth, br = document.querySelector('.brand').getBoundingClientRect().right, tl = document.querySelector('.topbar .tools').getBoundingClientRect().left;
    st.style.setProperty('--bx', Math.max(br + w / 2 + 10, Math.min(r0.left + r0.width / 2, tl - w / 2 - 10)) + 'px');
  }
  if (innerWidth <= 1100) { document.body.style.backgroundSize = ''; document.body.style.backgroundPosition = ''; return; }
  const r = b.getBoundingClientRect(), kx = (r.width / 5) / BG.tx, ky = (r.height / 7) / BG.ty;
  document.body.style.backgroundSize = `${BG.w * kx}px ${BG.h * ky}px, cover`;
  document.body.style.backgroundPosition = `${r.left - BG.x0 * kx}px ${r.top - BG.y0 * ky}px, center`;
}
function render(animDice) {
  if (!S) return;
  renderStatus(); renderSteps(); renderGrid('B'); renderGrid('P'); renderTray(animDice); renderInfo('P'); renderInfo('B'); renderHand(); renderViewer();
  alignBackground();
}
const fmtTime = ms => { const t = Math.floor(ms / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
function renderSteps() {
  const el = $('#steps'); if (!el || !S) return;
  if (S.phase !== 'play') { el.innerHTML = `<div class="whoturn">Bàn người chơi</div><div class="step on P"><b>Đặt quân</b><small>3 quái úp vào 3 ô bất kỳ, rồi lật cùng lúc</small></div>${STEPS.map(st => `<div class="step"><b>${st.t}</b><small>${st.d}</small></div>`).join('')}`; return; }
  const o = S.turn, s = side(o);
  const canSummon = !S.over && monsOf(o).length < D.rules.team.on_field && s.reserve.length && !s.summoned;
  const rounds = Array.from({ length: S.maxRounds }, (_, k) => `<i class="${k + 1 < S.round ? 'done' : k + 1 === S.round ? 'on' : ''}">${k + 1}</i>`).join('');
  el.innerHTML = `<div class="whoturn ${o}">${S.over ? 'Kết thúc' : 'Lượt: ' + who(o)}</div><div class="rounds" title="Thanh Vòng">${rounds}</div>` +
    STEPS.map(st => {
      const cls = ['step', o];
      if (st.n === 0) { if (canSummon) cls.push('hint'); if (s.summoned) cls.push('done'); }
      else if (!S.over) { if (st.n === S.step) cls.push('on'); else if (st.n < S.step) cls.push('done'); }
      return `<div class="${cls.join(' ')}"><b>${st.t}</b><small>${st.d}</small></div>`;
    }).join('');
}
function renderStatus() {
  if (!S) return;
  const p = scoreOf('P'), b = scoreOf('B');
  $('#status').innerHTML = `<span class="pill">${esc(T().name)}</span><span class="pill">Vòng ${Math.min(S.round, S.maxRounds)}/${S.maxRounds}</span>` +
    (S.phase === 'place' ? `<span class="pill turnP">Đặt quân</span>` : S.over ? `<span class="pill">Kết thúc</span>` : `<span class="pill ${S.turn === 'P' ? 'turnP' : 'turnB'}">Lượt: ${who(S.turn)}</span>`) +
    `<span class="pill">🍇 Bạn ${p.total} · Máy ${b.total}</span><span class="pill" title="Thời gian · số lượt">⏱ ${fmtTime((S.over && S.endTime ? S.endTime : Date.now()) - S.startTime)} · #${S.turnCount}</span>`;
}
function tokensHtml(u) {
  let h = '';
  if (u.shield) h += `<span class="t sh" title="Khiên ${u.shield}"><img src="${TOK.shield}" alt="Khiên"><b>${u.shield}</b></span>`;
  ST_KEYS.forEach(k => { if (u.st[k]) h += `<span class="t" title="${ST_VI[k]}"><img src="${TOK[k]}" alt="${ST_VI[k]}"></span>`; });
  return `<div class="tok">${h}</div>`;
}
function renderGrid(o) {
  const s = side(o), g = s.grid; const el = $('#grid' + o);
  const order = o === 'B' ? [6, 7, 8, 3, 4, 5, 0, 1, 2] : [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const pp = pendingPick, hi = new Set();
  if (pp && pp.req.side === o) pp.req.opts.forEach(op => (pp.req.pick === 1 && !pp.req.center ? op : [op[0]]).forEach(i => hi.add(i)));
  // Trợ lý: viên đang chọn / rê chuột → quái nào kích hoạt được, kỹ năng gì
  const sd = side('P').dice, dk = S.hoverDie != null ? S.hoverDie : (picked && picked.type === 'die' ? picked.di : null);
  const die = o === 'P' && S.turn === 'P' && dk != null && sd[dk] && !sd[dk].used ? sd[dk] : null;
  // Khiêu khích: khi bạn đang nhắm đòn 1 mục tiêu, quái Khiêu khích nổi lên, đồng đội được che thu nhỏ lại
  const tauntUp = new Set(), covered = new Set();
  if (pp && pp.req.side === o && pp.req.o !== o && pp.req.pick === 1 && !pp.req.center && SINGLE_CODES.includes(pp.req.effect.t) && pp.req.effect.t !== 'anyE') {
    g.forEach((x, i) => { if (isMon(x) && isTaunt(x) && hi.has(i)) adjIdx(i).forEach(j => { if (isMon(g[j]) && !hi.has(j)) { covered.add(j); tauntUp.add(i); } }); });
  }
  el.innerHTML = order.map(i => {
    const u = g[i]; let inner = '';
    const cls = ['cell'];
    if (hi.has(i)) cls.push(o === pp.req.o ? 'ally-target' : 'target');
    if (pp && pp.chosen.includes(i) && pp.req.side === o) cls.push('picked');
    if (S.acting && S.acting.o === o && S.acting.i === i) cls.push('acting');
    if (picked && picked.type === 'cell' && o === 'P' && picked.i === i) cls.push('picked');
    if (tauntUp.has(i)) cls.push('taunt-up'); if (covered.has(i)) cls.push('covered');
    const f = fxOf(o, i); if (f) cls.push(f.cls);
    let badge = '';
    if (isMon(u) && die && M(u).element === die.el) {
      const f = !u.acted && !u.st.stun ? findSkill(u, die, sd) : null;
      if (f) { cls.push('can'); badge = `<span class="sklab ok">${esc(f.skill.name)}${f.skill.tier === 'U' ? ' ★' : ''}</span>`; }
      else badge = `<span class="sklab no">${u.st.stun ? 'Choáng' : u.acted ? 'đã dùng' : 'mặt trống'}</span>`;
    }
    if (isMon(u) && hi.has(i) && pp) {
      const e = pp.req.effect, a = pp.req.src && isMon(pp.req.src) && side(pp.req.o).grid.includes(pp.req.src) ? pp.req.src : null;
      if (e.k === 'd') { const d = calcDmg(a, u, e.v, pp.req.ctx || {}); const lost = Math.max(0, d - u.shield); badge = `<span class="sklab dmg">−${lost} ❤${u.shield ? ` · 🛡${Math.min(d, u.shield)}` : ''}${lost >= u.hp ? ' 💥' : ''}</span>`; }
      else if (e.k === 'loss') badge = `<span class="sklab dmg">−${e.v} ❤${e.v >= u.hp ? ' 💥' : ''}</span>`;
      else if (e.k === 'h') badge = `<span class="sklab ok">+${Math.min(e.v, u.maxHp - u.hp)} ❤</span>`;
      else if (e.k === 's') badge = `<span class="sklab ok">+${e.v} 🛡</span>`;
    }
    if (isMon(u)) {
      const hidden = S.phase === 'place' && o === 'B', m = M(u);
      const drag = o === 'P' && !S.over ? `draggable="true" data-drag='${JSON.stringify({ type: 'cell', i })}'` : '';
      inner = hidden ? `<div class="unit hidden" data-view="${o}:${i}"><img class="cardback" src="${BACK_M}" alt="thẻ úp"></div>` :
        `<div class="unit ${o} ${u.st.stun ? 'stunned' : ''} ${u.acted ? 'acted' : ''}" ${drag} data-view="${o}:${i}" style="--el:${COL[m.element]}">
        <span class="base"></span><img class="art" src="${artImg(u.id)}" alt="${esc(m.name)}" draggable="false">
        <span class="uname"><img src="${elIcon(m.element)}" alt="">${esc(m.name)}</span>
        ${isTaunt(u) ? '<span class="kwt" title="Khiêu khích">🛡</span>' : ''}
        ${tokensHtml(u)}${badge}
        <div class="ov">${hpLine(u).html}</div>
        ${tauntUp.has(i) ? '<span class="tauntlab">🛡 Khiêu khích</span>' : ''}${covered.has(i) ? '<span class="covlab">được che</span>' : ''}
      </div>`;
    } else if (u && u.kind === 'bld') {
      const b = BLD[u.id];
      const drag = o === 'P' ? `draggable="true" data-drag='${JSON.stringify({ type: 'cell', i })}'` : '';
      const ctl = b.kind === 'house'
        ? `<button data-adj="cnt-">−</button><span title="xí ngầu trắng: số lần kích hoạt còn lại">🎲 ${u.counter}${u.counter ? '' : ' lần kích hoạt'}</span><button data-adj="cnt+">+</button>`
        : b.trigger === 'use' ? `<button data-adj="use">▶ Dùng xe</button>` : `<span title="${esc(b.text_vn)}">🛡 Tự chặn đòn</span>`;
      inner = `<div class="unit bld" ${drag} data-view="${o}:${i}"><span class="base"></span><img class="art" src="${bldArt(u.id)}" alt="${esc(b.name)}" draggable="false"><span class="uname">${b.kind === 'house' ? '🏠' : '🚌'} ${esc(b.name)}</span><div class="bldctl">${ctl}</div></div>`;
    } else inner = (f && f.data && f.data.id ? `<div class="unit ghost"><img class="art" src="${artImg(f.data.id)}" alt=""></div>` : '') + `<div class="empty-hint">${o === 'P' && (S.phase === 'place' || S.turn === 'P') ? ROW_VI[rowOf(i)] : ''}</div>`;
    return `<div class="${cls.join(' ')}" data-o="${o}" data-i="${i}"${f ? ` style="--fxd:-${Math.round(f.el)}ms"` : ''}>${inner}</div>`;
  }).join('');
}
/** Hàng xí ngầu giữa bàn + 3 ô nút trên bàn (Thảy / Kết thúc lượt / Gợi ý) */
function renderTray(animDice) {
  const el = $('#tray'), sR = $('#slotRoll'), sE = $('#slotEnd'), sH = $('#slotHint');
  const canCancel = !!(pendingPick && S.assignCtx && !S.assignCtx.confirmed);
  $('#slotCancel').innerHTML = `<button class="btn dark" data-act="cancelassign" ${canCancel ? '' : 'disabled'} title="Huỷ gán: trả xí ngầu về khay (hoặc nhấn Esc)"><b>↶</b>Huỷ gán</button>`;
  $('#slotCancel').classList.toggle('on', canCancel);
  const btn = (act, ico, txt, cls, on, tip) => `<button class="btn ${cls}" data-act="${act}" ${on ? '' : 'disabled'} ${tip ? `title="${esc(tip)}"` : ''}><b>${ico}</b>${txt}</button>`;
  sH.innerHTML = btn('hint', '💡', 'Gợi ý', 'ghost', S.phase === 'play' && S.turn === 'P' && !S.busy && !S.over, 'Trợ lý gợi ý nước đi');
  if (S.phase === 'place') {
    el.innerHTML = `<span class="note">Kéo ${D.rules.team.on_field} quái từ <b>vách che</b> vào sân của bạn (3 hàng dưới).</span>`;
    sR.innerHTML = ''; sE.innerHTML = btn('ready', '✔', 'Sẵn sàng', 'primary', true, 'Lật thẻ — hai bên lật cùng lúc'); return;
  }
  if (S.over) { el.innerHTML = `<span class="note"><b>Hết ván</b></span>`; sR.innerHTML = ''; sE.innerHTML = btn('newgame', '↺', 'Ván mới', 'primary', true); return; }
  const o = S.turn, s = side(o);
  const fieldEls = new Set(monsOf(o).map(i => M(s.grid[i]).element));
  const dice = s.dice.map((d, k) => {
    const nomon = !fieldEls.has(d.el);
    const blank = o === 'P' && !d.used && !nomon && !activators('P', d, s.dice).length;
    const drag = o === 'P' && !d.used ? `draggable="true" data-drag='${JSON.stringify({ type: 'die', di: k })}'` : '';
    const anim = (animDice && d.anim !== false) ? ' rolling' : ''; d.anim = false;
    const tip = d.toE ? 'đã thành ✦' : nomon ? 'không có quái cùng màu → thành ✦ khi bạn bắt đầu gán' : blank ? 'mặt trống / quái đã dùng: không kích hoạt, không thành ✦' : `kéo lên quái hệ ${EL_VI[d.el]} để thi triển, chạm để chọn`;
    return `<div class="die${d.sel ? ' sel' : ''}${d.used ? ' used' : ''}${anim}" style="background:${COL[d.el]}" ${drag} data-die="${k}" title="${EL_VI[d.el]} · mặt ${d.face} — ${tip}">${dieSvg(d.face, d.el)}<img class="eic" src="${elIcon(d.el)}" alt="">${d.toE ? '<span class="dtag">✦</span>' : (!d.used && o === 'P' && nomon && !T().noEnergy ? `<button class="dtag" data-toenergy="${k}" title="Bấm: đổi viên này thành 1 ✦ ngay">+✦</button>` : '')}</div>`;
  }).join('');
  const myTurn = o === 'P' && !S.busy;
  sE.innerHTML = btn('endturn', '⏭', 'Kết thúc lượt', 'warn', myTurn);
  if (o === 'B') { el.innerHTML = s.dice.length ? `<div class="dice">${dice}</div>` : `<span class="note"><b>Máy</b> đang chơi…</span>`; sR.innerHTML = btn('roll', '🎲', 'Thảy', 'primary', false); return; }
  if (!s.rolled) {
    el.innerHTML = S.chooseColors
      ? `<span class="note">Lượt đầu: chọn <b>${S.chooseColors} màu</b>, không thảy lại</span><div class="colorpick">${EL_ORDER.map(e => `<label title="${EL_VI[e]}"><input type="checkbox" data-color="${e}" ${S.colorPick.includes(e) ? 'checked' : ''}><img src="${elIcon(e)}" alt="${EL_VI[e]}"></label>`).join('')}</div>`
      : `<span class="note">Gọi dự bị trước (nếu sân còn chỗ), rồi bấm <b>Thảy</b> ←</span>`;
    sR.innerHTML = btn('roll', '🎲', 'Thảy', 'primary', myTurn);
  } else {
    const canRe = !s.rerolled && !s.noReroll;
    el.innerHTML = `<div class="dice">${dice}</div>`;
    sR.innerHTML = btn('reroll', '↻', 'Thảy lại', '', myTurn && canRe, 'Chạm chọn các viên rồi bấm để thảy lại (1 lần mỗi lượt)');
  }
}
function energyHtml(n) { return `<span class="energy" title="Năng lượng ${n}/3">${[0, 1, 2].map(k => `<img src="${TOK.energy}" class="${k < n ? 'on' : ''}" alt="">`).join('')}</span>`; }
function renderInfo(o) {
  const s = side(o), sc = scoreOf(o);
  const trophies = s.trophies.map(u => `<div class="hcard troph${u.koFly ? ' arriving' : ''}" data-uid="${u.uid}" data-view="t:${u.uid}" title="${esc(M(u).name)} · ${M(u).price} 🍇"><img src="${monImg(u.id)}" alt="${esc(M(u).name)}"></div>`).join('') || '<span class="muted">—</span>';
  const res = o === 'B' ? s.reserve.map(() => `<div class="hcard back"><img src="${BACK_M}" alt="dự bị"></div>`).join('') || '<span class="muted">—</span>' : '';
  let energy = '';
  if (!T().noEnergy) {
    if (o === 'P') {
      const my = S.phase === 'play' && S.turn === 'P' && !S.busy && !S.over;
      const acts = energyActions().map(a => `<button class="eact" data-eact="${a.id}" ${my && a.ok ? '' : 'disabled'} title="${esc(a.why || a.tip || a.t)}"><b>${a.c}✦</b><span>${a.t}${a.tag ? ` <em>${a.tag}</em>` : ''}</span></button>`).join('');
      energy = `<div class="ebox" title="Viên không có quái cùng màu +1 ✦ · giữ tối đa 3"><div class="ehead"><b>Năng lượng</b><span class="eadj"><button class="btn sm" data-energy="-" title="chỉnh tay">−</button><button class="btn sm" data-energy="+" title="chỉnh tay">+</button></span></div><div class="orbs">${energyHtml(s.energy)}</div>
        <small class="muted">Viên không có quái cùng màu +1 · giữ tối đa 3${houseActive('P') ? ' · 🏠 Nhà còn xí ngầu → cuối lượt chỉ giữ 2' : ''}</small><div class="eacts">${acts}</div></div>`;
    } else energy = `<div class="meters">${energyHtml(s.energy)}</div>`;
  }
  $('#info' + o).innerHTML = `<div class="who"><h3>${o === 'P' ? 'Bạn' : '🤖 Máy'}</h3><span class="fpill" title="Tổng điểm"><img src="assets/icons/Fruit.webp" alt="🍇"><b>${sc.total}</b></span></div>
    ${o === 'P' && S.buildings ? `<div class="pwrap">${energy}<div class="bdeck" data-deck title="Chồng Công trình & Xe — bấm để rút (2 ✦)"><img src="${BACK_B}" alt="Chồng Công trình"><b>${S.bldDeck.length}</b><small>Công trình</small></div></div>` : energy}
    ${o === 'B' ? `<div class="lbl">Dự bị (úp) · ${s.reserve.length}</div><div class="handcards">${res}</div>` : ''}
    <div class="lbl lbltro">Chiến lợi phẩm <span class="fpill" title="${sc.ko} 🍇 từ quái đã hạ"><img src="assets/icons/Fruit.webp" alt="🍇"><b>${sc.ko}</b></span></div><div class="handcards trophies" id="tro${o}">${trophies}</div>`;
}
/** Các hành động Năng lượng dạng nút chữ */
function energyActions() {
  const s = side('P'), t = T(), rolled = s.rolled, anyDie = s.dice.some(d => !d.used);
  const A = [
    { id: 'reroll', c: 1, t: 'Thảy lại 1 viên', ok: s.energy >= 1 && rolled && anyDie, why: !rolled ? 'Thảy xí ngầu trước' : '' },
    { id: 'shield', c: 2, t: '+2 Khiên 1 quái', ok: s.energy >= 2 && monsOf('P').length > 0 },
    { id: 'move', c: 2, t: 'Dời 1 quái', tip: 'Dời 1 quái sang ô trống (tầng Chuẩn)', ok: t.energyActs && s.energy >= 2 && monsOf('P').length > 0, why: t.energyActs ? '' : `Tầng ${t.name} chưa dùng` },
    { id: 'recolor', c: 3, t: 'Đổi màu 1 viên', tip: 'Đổi màu 1 xí ngầu (tầng Chuẩn)', ok: t.energyActs && s.energy >= 3 && rolled && (anyDie || s.dice.some(d => d.toE)) && !houseActive('P'), why: !t.energyActs ? `Tầng ${t.name} chưa dùng` : houseActive('P') ? 'Nhà còn xí ngầu: không đổi màu' : '' }
  ];
  if (S.buildings) A.push({ id: 'draw', c: 2, t: 'Rút Công trình', tip: 'Rút 1 lá Công trình & Xe (bản mở rộng)', ok: s.energy >= 2 && S.bldDeck.length > 0 && !s.drew, why: s.drew ? 'Mỗi lượt rút 1 lá' : '' });
  return A;
}
/** chọn 1 xí ngầu (cho hành động ✦) */
let diePick = null;
function pickDie(label) {
  return new Promise(resolve => {
    diePick = resolve;
    if (S.beamFromRect) setTimeout(() => startBeam(S.beamFromRect, S.beamKind || 'nrg'), 0);
    banner(`<span>${esc(label)}: chạm 1 xí ngầu</span><button class="btn sm warn" data-diepick="cancel">Hủy</button>`);
  });
}
function endDiePick(v) { const r = diePick; diePick = null; banner(''); stopBeam(); if (r) r(v); }
async function energyAct(id, srcEl) {
  const s = side('P'); const a = energyActions().find(x => x.id === id);
  if (!a || !a.ok || S.busy || S.turn !== 'P') { toast(a && a.why ? a.why : 'Chưa dùng được lúc này.'); return; }
  if (id === 'draw') { await drawBuilding(); return; }
  S.beamFromRect = srcEl ? srcEl.getBoundingClientRect() : null; S.beamKind = 'nrg';
  try { await energyActInner(id, s); } finally { S.beamFromRect = null; S.beamKind = null; stopBeam(); render(); }
}
async function energyActInner(id, s) {
  lockDead('P');
  if (id === 'reroll') {
    const sel = s.dice.filter(d => d.sel && !d.used);
    const d = sel.length === 1 ? sel[0] : await pickDie('1 ✦ · Thảy lại 1 xí ngầu');
    if (d) rerollSelected(true, d);
  } else if (id === 'shield') {
    S.busy = true;
    const r = await playerChooser({ o: 'P', side: 'P', effect: { k: 's', v: 2, printed: '1 quái mình' }, opts: monsOf('P').map(i => [i]), pick: 1, label: '2 ✦ · +2 Khiên', ctx: {} });
    S.busy = false; if (r && r.length) { spend('P', 2, `${uName(s.grid[r[0]])} +2 Khiên`); addShield('P', r[0], 2); }
  } else if (id === 'move') {
    S.busy = true;
    const r = await playerChooser({ o: 'P', side: 'P', effect: { k: 'mv', printed: 'quái muốn dời' }, opts: monsOf('P').map(i => [i]), pick: 1, label: '2 ✦ · Dời quái (1/2)', ctx: {} });
    if (r && r.length) {
      const empty = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(i => !s.grid[i]);
      const r2 = await playerChooser({ o: 'P', side: 'P', effect: { k: 'mv', printed: 'ô trống' }, opts: empty.map(i => [i]), pick: 1, label: '2 ✦ · Dời quái (2/2)', ctx: {} });
      if (r2 && r2.length) { const u = s.grid[r[0]]; s.grid[r2[0]] = u; s.grid[r[0]] = null; spend('P', 2, `dời ${uName(u)} sang ${ROW_VI[rowOf(r2[0])]}-${colOf(r2[0]) + 1}`); }
    }
    S.busy = false;
  } else if (id === 'recolor') {
    const sel = s.dice.filter(d => d.sel && !d.used);
    S.diePickToE = true; const d = sel.length === 1 ? sel[0] : await pickDie('3 ✦ · Đổi màu 1 xí ngầu'); S.diePickToE = false;
    if (d) {
      const el = await new Promise(res => { diePick = res; banner(`<span>Đổi viên ${EL_VI[d.el]} ${d.face} thành:</span>${EL_ORDER.filter(e => e !== d.el).map(e => `<button class="btn sm" data-recolor="${e}"><img src="${elIcon(e)}" style="width:16px;vertical-align:-3px" alt=""> ${EL_VI[e]}</button>`).join('')}<button class="btn sm warn" data-diepick="cancel">Hủy</button>`); });
      if (el) recolorSelected(el, d);
    }
  }
}
/* ---------- chồng Công trình: bấm mặt lưng → hỏi 2 ✦ → lật thẻ → thu nhỏ bay về khu dự bị ---------- */
function deckPopover() {
  const s = side('P'), a = energyActions().find(x => x.id === 'draw');
  const deck = document.querySelector('[data-deck]'); if (!deck) return;
  const old = document.getElementById('deckpop'); if (old) { old.remove(); return; }
  const my = S.phase === 'play' && S.turn === 'P' && !S.busy && !S.over;
  const r = deck.getBoundingClientRect();
  const pop = document.createElement('div'); pop.id = 'deckpop'; pop.className = 'glasspop';
  pop.style.left = Math.max(8, r.left - 210) + 'px'; pop.style.top = (r.bottom + 8) + 'px';
  const why = !my ? 'Chỉ rút trong lượt của bạn.' : a && !a.ok ? (a.why || (s.energy < 2 ? 'Chưa đủ 2 ✦.' : 'Hết thẻ.')) : '';
  pop.innerHTML = `<b>Rút 1 Công trình</b><div class="cost"><img src="${TOK.energy}" alt=""><img src="${TOK.energy}" alt=""><span>2 năng lượng</span></div>
    ${why ? `<small>${esc(why)}</small>` : '<small>Thẻ về khu dự bị, rồi kéo vào 1 ô trống.</small>'}
    <div class="row"><button class="btn sm" data-deckpop="no">Hủy</button><button class="btn sm primary" data-deckpop="yes" ${why ? 'disabled' : ''}>Rút</button></div>`;
  document.body.appendChild(pop);
}
async function drawBuilding() {
  const s = side('P'); const pop = document.getElementById('deckpop'); if (pop) pop.remove();
  const a = energyActions().find(x => x.id === 'draw'); if (!a || !a.ok || S.busy || S.turn !== 'P') { toast(a && a.why ? a.why : 'Chưa rút được lúc này.'); return; }
  lockDead('P');
  S.busy = true;
  const did = S.bldDeck.pop(); spend('P', 2, `rút Công trình <b>${esc(BLD[did].name)}</b>`); s.drew = true;
  render();
  const deck = document.querySelector('[data-deck]'), dst = document.getElementById('bldArea') || document.getElementById('hand');
  if (deck && dst && document.body.animate) {
    const r0 = deck.getBoundingClientRect(), r1 = dst.getBoundingClientRect();
    const fly = document.createElement('div'); fly.className = 'flycard';
    fly.innerHTML = `<div class="flip"><img class="face back" src="${BACK_B}" alt=""><img class="face front" src="${bldImg(did)}" alt=""></div>`;
    Object.assign(fly.style, { left: r0.left + 'px', top: r0.top + 'px', width: r0.width + 'px', height: r0.width * 88 / 63 + 'px' });
    document.body.appendChild(fly);
    const cx = innerWidth / 2 - r0.left - r0.width / 2, cy = innerHeight / 2 - r0.top - r0.width * 44 / 63;
    const big = Math.min(3.2, (innerHeight * 0.55) / (r0.width * 88 / 63));
    await fly.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${cx}px,${cy}px) scale(${big})` }], { duration: 450, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' }).finished;
    await fly.querySelector('.flip').animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(180deg)' }], { duration: 520, easing: 'ease-in-out', fill: 'forwards' }).finished;
    await sleep(650);
    const tx = r1.left + 30 - r0.left - r0.width / 2, ty = r1.top + r1.height - 40 - r0.top - r0.width * 44 / 63;
    await fly.animate([{ transform: `translate(${cx}px,${cy}px) scale(${big})`, opacity: 1 }, { transform: `translate(${tx}px,${ty}px) scale(.7)`, opacity: .4 }], { duration: 520, easing: 'cubic-bezier(.5,0,.7,1)', fill: 'forwards' }).finished;
    fly.remove();
  }
  s.bldHand.push({ kind: 'bld', uid: UID++, id: did, counter: BLD[did].activations, moved: false, st: {} });
  S.busy = false; render();
  const nc = document.querySelector('#bldArea .hcard:last-of-type'); if (nc) nc.classList.add('newcard');
  log(`Thẻ <b>${esc(BLD[did].name)}</b> đã vào khu dự bị — kéo vào 1 ô trống`, 'P');
}
/** Trợ lý gợi ý */
function playerHint() {
  const s = side('P'), tips = [];
  const canSummon = monsOf('P').length < D.rules.team.on_field && s.reserve.length && !s.summoned && [0, 1, 2, 3, 4, 5, 6, 7, 8].some(i => !s.grid[i]);
  if (canSummon) { const r = botPickField(s.reserve, 1)[0]; tips.push(`✨ Sân còn chỗ: gọi dự bị (vd. <b>${esc(M(r).name)}</b>) <u>trước</u> khi gán xí ngầu.`); }
  if (!s.rolled) tips.push('🎲 Bấm <b>Thảy xí ngầu</b>.');
  else {
    const plan = planBot(s.dice, 'P').sort((a, b) => (M(a.u).role_ai !== 'Support') - (M(b.u).role_ai !== 'Support'));
    if (plan.length) tips.push('Gán: ' + plan.map(p => `${EL_VI[p.die.el]} ${p.die.face} → <b>${esc(M(p.u).name)}</b> (${esc(p.skill.name)}${p.skill.tier === 'U' ? ' ★' : ''})`).join(' · ') + '. Nên làm kỹ năng Hỗ trợ trước.');
    const fieldEls = new Set(monsOf('P').map(i => M(s.grid[i]).element));
    const used = new Set(plan.map(p => p.die));
    const waste = s.dice.filter(d => !d.used && !used.has(d) && fieldEls.has(d.el));
    if (waste.length && !s.rerolled && !s.noReroll) tips.push(`Có thể thảy lại: ${waste.map(d => EL_VI[d.el] + ' ' + d.face).join(', ')} (mặt trống).`);
    const nm = s.dice.filter(d => !d.used && !fieldEls.has(d.el)).length; if (nm) tips.push(`${nm} viên không có quái cùng màu → +${nm} ✦ cuối lượt.`);
    if (!plan.length && !waste.length) tips.push('Không còn viên gán được → <b>Kết thúc lượt</b>.');
  }
  const low = monsOf('P').map(i => s.grid[i]).filter(u => u.hp + u.shield <= 3);
  if (low.length && s.energy >= 2) tips.push(`🛡 ${low.map(u => esc(M(u).name)).join(', ')} sắp bị hạ: cân nhắc 2 ✦ +2 Khiên.`);
  const msg = tips.join('<br>');
  log('💡 ' + msg, 'P', 'hint'); toast(msg);
}
function renderHand() {
  const s = side('P');
  $('#hand').innerHTML = s.reserve.map(u => `<div class="hcard${picked && picked.uid === u.uid ? ' picked' : ''}" draggable="true" data-drag='${JSON.stringify({ type: 'res', uid: u.uid })}' data-res="${u.uid}" data-view="r:${u.uid}"><img src="${monImg(u.id)}" alt="${esc(M(u).name)}"></div>`).join('') || '<span class="muted">Hết dự bị.</span>';
  if (S.buildings) {
    const deck = S.bldDeck.length;
    $('#bldArea').innerHTML = `<h3 style="margin-top:8px">Công trình & Xe <small>(mở rộng)</small></h3>
      <div class="handcards">${s.bldHand.map(b => `<div class="hcard" draggable="true" data-drag='${JSON.stringify({ type: 'bld', uid: b.uid })}' data-bldh="${b.uid}" data-view="b:${b.uid}"><img src="${bldImg(b.id)}" alt="${esc(BLD[b.id].name)}"></div>`).join('')}
      ${s.bldHand.length ? '' : '<span class="muted">Bấm chồng thẻ cạnh bảng Năng lượng để rút.</span>'}</div>
      ${s.bldUsed.length ? `<div class="lbl">Đã dùng</div><div class="handcards">${s.bldUsed.map(b => `<div class="hcard used" data-view="u:${b.uid}" title="${esc(BLD[b.id].name)} — đã dùng"><img src="${bldImg(b.id)}" alt=""></div>`).join('')}</div>` : ''}`;
  } else $('#bldArea').innerHTML = '';
}
function findView(key) {
  if (!key) return null; const [a, b] = key.split(':');
  if (a === 'P' || a === 'B') { const u = side(a).grid[+b]; return u ? { u, o: a, i: +b } : null; }
  const uid = +b, all = ['P', 'B'].flatMap(o => [...side(o).reserve, ...side(o).trophies, ...side(o).bldHand, ...side(o).bldUsed]);
  const u = all.find(x => x.uid === uid); return u ? { u } : null;
}
/* thẻ lớn: hiện khi trỏ chuột vào quái / thẻ, ẩn khi rời đi; bấm vào quái để ghim (hiện nút chỉnh ❤, Khiên, trạng thái) */
let viewPin = false, viewAnchor = null, viewHideT = 0;
function showViewer(key, anchor) {
  if (key !== viewSel) { viewSel = key; viewAnchor = anchor || viewAnchor; renderViewer(); }
}
/** rời chuột: thẻ cố định vẫn giữ thẻ vừa xem; force = bỏ ghim (ẩn nút chỉnh) */
function hideViewer(force) { if (force && viewPin) { viewPin = false; renderViewer(); } }
function renderViewer() {
  const v = findView(viewSel), el = $('#viewer');
  el.classList.toggle('pinned', viewPin);
  if (!v) { el.innerHTML = '<p class="muted vhint">Trỏ chuột vào quái hoặc thẻ để xem lá bài ở đây. Bấm vào quái để ghim & chỉnh ❤ / Khiên / trạng thái.</p>'; return; }
  renderViewerInner(v, el);
  if (viewPin) el.insertAdjacentHTML('afterbegin', '<button class="btn sm pin" data-unpin title="Bỏ ghim">✕</button>');
}
function renderViewerInner(v, el) {
  const u = v.u;
  if (u.kind === 'bld') {
    const b = BLD[u.id];
    const ctl = v.o === 'P' ? (b.kind === 'house' ? (u.counter > 0 ? `<p>🎲 còn ${u.counter} lần · tự kích hoạt ${b.trigger === 'start' ? 'Đầu' : 'Cuối'} lượt bạn. <button class="btn sm" data-vadj="house">▶ Chạy ngay</button></p>` : '<p>🎲 0 lần kích hoạt — Nhà vẫn ở lại sân, không tính vào giới hạn 2 Nhà. Bấm + nếu có hiệu ứng tăng lần kích hoạt.</p>') : b.trigger === 'use' ? `<p>Đi 1 ô miễn phí mỗi lượt (kéo sang ô kề). <button class="btn sm primary" data-vadj="use">▶ Dùng xe</button> — xe rời sân sau khi hiệu ứng xong.</p>` : '<p>Tự chặn 1 đòn đơn của đối thủ vào đồng đội kề xe, rồi rời sân.</p>') : '';
    el.innerHTML = `<img class="big" src="${bldImg(u.id)}" alt=""><p><b>${esc(b.name)}</b> · ${b.kind === 'house' ? 'Nhà' : 'Xe'} — ${esc(b.text_vn)}</p>${ctl}`; return;
  }
  const hidden = v.o === 'B' && S.phase === 'place';
  if (hidden) { el.innerHTML = `<img class="big" src="${BACK_M}" alt="">`; return; }
  const m = M(u);
  let ctl = '';
  if (v.o) {
    ctl = `<div class="ctl"><b>❤</b><div class="row"><button class="btn sm" data-vadj="hp-">−</button><b>${u.hp}/${u.maxHp}</b><button class="btn sm" data-vadj="hp+">+</button><button class="btn sm warn" data-vadj="ko">Hạ</button></div>
      <b>Khiên</b><div class="row"><button class="btn sm" data-vadj="sh-">−</button><b>${u.shield}</b><button class="btn sm" data-vadj="sh+">+</button></div>
      <b>Trạng thái</b><div class="row">${ST_KEYS.map(k => `<button class="btn sm" data-vadj="st:${k}" style="${u.st[k] ? 'background:var(--sunlt)' : ''}"><img src="${TOK[k]}" style="width:14px;vertical-align:-2px" alt="">${ST_VI[k]}</button>`).join('')}</div></div>`;
  }
  // dòng đặc biệt: nội tại, ngưỡng, di nguyện, đặc tính
  const sp = [], run = (a, t) => v.o ? `<button class="btn sm" data-vadj="${a}">▶ ${t}</button>` : '';
  const AUTO = '<em class="auto">tự động</em>';
  if (m.passive) { const k = m.passive.key; sp.push(`<li><b>Nội tại · ${esc(m.passive.name)}</b> ${AUTO} — ${esc(m.passive.text)} ${k === 'regenAlly' || k === 'photo' ? run('run:pas', 'Chạy') : '<small>(luôn có hiệu lực, tính khi đánh / bị đánh)</small>'}</li>`); }
  if (m.trait_top) { const t = m.trait_top; sp.push(`<li><b>Đặc tính · ${esc(t.n)}</b> ${AUTO} — ${esc(t.text)} ${run('run:top', 'Chạy')}</li>`); }
  if (m.threshold) sp.push(`<li><b>Ngưỡng ≤${m.threshold.at} ❤ · ${esc(m.threshold.name)}</b> ${AUTO} — mỗi lần ❤ tụt xuống ≤${m.threshold.at}: ${m.threshold.effects.map(e => esc(fxText(e))).join(', ')} ${run('run:thr', 'Chạy')}</li>`);
  if (m.deathwish) sp.push(`<li><b>Di nguyện · ${esc(m.deathwish.name)}</b> ${AUTO} — khi bị hạ: ${m.deathwish.effects.map(e => esc(fxText(e))).join(', ')}</li>`);
  if (m.trait_bot) { const t = m.trait_bot; sp.push(`<li><b>Đặc tính · ${esc(t.n)}</b> ${t.k === 'gifted' ? (u.giftUsed ? '<em class="auto">đã dùng</em>' : '<em class="auto">hỏi khi gán xí ngầu</em>') : AUTO} — ${esc(t.text)} ${t.k === 'gifted' && v.o ? run('gift', u.giftUsed ? 'Đánh dấu chưa dùng' : 'Đánh dấu đã dùng') : ''}</li>`); }
  el.innerHTML = `<img class="big" src="${monImg(u.id)}" alt="${esc(m.name)}">
    <p style="margin:0 0 6px"><b>${esc(m.name)}</b> · ${EL_VI[m.element]} · ${esc(m.role5)} · ${m.price} 🍇${u.acted ? ' · <i>đã kích hoạt lượt này</i>' : ''}</p>${sp.length ? `<ul class="special">${sp.join('')}</ul>` : ''}${ctl}`;
}
const TG_VI = { one: '1 địch', other: '1 địch khác', anyE: '1 địch bất kỳ', adjE: 'địch kề', three: '3 địch', row: '1 hàng', col: '1 cột', cross: 'đánh lan', all: 'cả sân địch', self: 'mình', ally: '1 đồng đội', front: '1 đồng đội hàng trước', adj: 'đồng đội kề', selfadj: 'mình + kề', team: 'cả đội', deadA: '1 đồng đội bị hạ' };
function fxText(e) { const t = e.printed || TG_VI[e.t] || ''; return ({ d: `⚔${e.v} → ${t}`, h: `+${e.v}❤ → ${t}`, s: `+${e.v} Khiên → ${t}`, st: `${e.v} → ${t}`, bf: `${e.v} → ${t}`, rev: `hồi sinh ${e.v}❤ → ${t}` })[e.k] || t; }

/* ================= sự kiện ================= */
function bindUI() {
  document.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('[data-close]')) { closeModal(); return; }
    if (t.closest('[data-unpin]')) { viewPin = false; hideViewer(true); return; }
    const te = t.closest('[data-toenergy]'); if (te) { e.stopPropagation(); dieToEnergy(+te.dataset.toenergy); return; }
    const dp = t.closest('[data-diepick]'); if (dp) { endDiePick(null); return; }
    const rc = t.closest('[data-recolor]'); if (rc) { endDiePick(rc.dataset.recolor); return; }
    const ea = t.closest('[data-eact]'); if (ea) { energyAct(ea.dataset.eact, ea); return; }
    const dk = t.closest('[data-deck]'); if (dk) { deckPopover(); return; }
    const dpp = t.closest('[data-deckpop]'); if (dpp) { if (dpp.dataset.deckpop === 'yes') drawBuilding(); else { const x = document.getElementById('deckpop'); if (x) x.remove(); } return; }
    if (!t.closest('#deckpop')) { const x = document.getElementById('deckpop'); if (x) x.remove(); }
    const pk = t.closest('[data-pick]');
    if (pk && pendingPick) { if (pk.dataset.pick === 'skip') finishPick([]); else finishPick(pendingPick.chosen.slice()); return; }
    const act = t.closest('[data-act]'); if (act && act.tagName !== 'SELECT') { doAct(act.dataset.act); return; }
    const adj = t.closest('[data-adj]'); if (adj) { const c = adj.closest('.cell'); adjust(c.dataset.o, +c.dataset.i, adj.dataset.adj); return; }
    const vadj = t.closest('[data-vadj]'); if (vadj) { const v = findView(viewSel); if (v && v.o) adjust(v.o, v.i, vadj.dataset.vadj); return; }
    const en = t.closest('[data-energy]'); if (en) { const s = side('P'); s.energy = Math.max(0, Math.min(3, s.energy + (en.dataset.energy === '+' ? 1 : -1))); render(); return; }
    const dieEl = t.closest('[data-die]');
    if (dieEl && S && S.turn === 'P' && diePick) { const d = side('P').dice[+dieEl.dataset.die]; if (d && (!d.used || (d.toE && S.diePickToE))) endDiePick(d); return; }
    if (dieEl && S && S.turn === 'P') { const d = side('P').dice[+dieEl.dataset.die]; if (d && !d.used) { d.sel = !d.sel; picked = d.sel ? { type: 'die', di: +dieEl.dataset.die } : null; render(); } return; }
    const cell = t.closest('.cell');
    if (cell && S) {
      const o = cell.dataset.o, i = +cell.dataset.i;
      if (pendingPick) { onPickCell(o, i); return; }
      if (side(o).grid[i] && !(S.phase === 'place' && o === 'B')) { viewPin = true; viewSel = `${o}:${i}`; viewAnchor = cell; renderViewer(); }
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
    const view = t.closest('[data-view]'); if (view) { viewPin = true; viewSel = view.dataset.view; viewAnchor = view; renderViewer(); return; }
    if (viewPin && !t.closest('#viewer') && !t.closest('.cell')) { viewPin = false; hideViewer(true); }
  });
  document.addEventListener('change', e => {
    const c = e.target.closest('[data-color]');
    if (c) { const el = c.dataset.color; if (c.checked) { if (S.colorPick.length >= S.chooseColors) { c.checked = false; toast(`Chỉ chọn ${S.chooseColors} màu.`); return; } S.colorPick.push(el); } else S.colorPick = S.colorPick.filter(x => x !== el); return; }
    const rc = e.target.closest('[data-act="recolor"]'); if (rc && rc.value) recolorSelected(rc.value);
  });
  document.addEventListener('mouseover', e => {
    if (!S) return;
    const de = e.target.closest('[data-die]'), hd = de ? +de.dataset.die : null;
    if (hd !== S.hoverDie && S.turn === 'P') { S.hoverDie = hd; renderGrid('P'); }
    document.querySelectorAll('.cell.pulled').forEach(c => c.classList.remove('pulled'));
    const cov = e.target.closest('.cell.covered');
    if (cov) adjIdx(+cov.dataset.i).forEach(j => { const c = document.querySelector(`.cell.taunt-up[data-o="${cov.dataset.o}"][data-i="${j}"]`); if (c) c.classList.add('pulled'); });
    const v = e.target.closest('[data-view]');
    if (v && !viewPin) showViewer(v.dataset.view, v);
    else if (!v && !e.target.closest('#viewer')) hideViewer();
  });
  $('#btnNew').onclick = () => setupModal();
  $('#btnRules').onclick = () => rulesModal();
  addEventListener('resize', alignBackground); setTimeout(alignBackground, 50);
  sparkLines();
  $('#btnEnd').onclick = () => endSession();
  setInterval(() => { if (S && S.phase === 'play' && !S.over) renderStatus(); }, 1000);
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal' && S && S.phase !== 'setup') closeModal(); });
}
function doAct(a) {
  switch (a) {
    case 'roll': if (!S.busy) rollPlayer(); break;
    case 'reroll': rerollSelected(false); break;
    case 'endturn': endPlayerTurn(); break;
    case 'hint': playerHint(); break;
    case 'cancelassign': if (pendingPick && S.assignCtx && !S.assignCtx.confirmed) finishPick(CANCEL); break;
    case 'ready': startGame(); break;
    case 'newgame': closeModal(); setupModal(); break;
    case 'dlstats': download('karian-stats.json', loadStats()); break;
  }
}
/* ================= số liệu & phiên ================= */
const STATS_KEY = 'karian_stats_v7';
function loadStats() { try { return JSON.parse(localStorage.getItem(STATS_KEY) || '[]'); } catch (_) { return []; } }
function saveStats(res, reason, p, b) {
  S.endTime = Date.now();
  const rec = { date: new Date().toISOString(), tier: S.tier, first: S.first, result: res, reason, rounds: Math.min(S.round, S.maxRounds), turns: S.turnCount, seconds: Math.round((S.endTime - S.startTime) / 1000),
    score: { P: p, B: b }, energy: { P: S.stats.P, B: S.stats.B }, teams: S.teams };
  try { const all = loadStats(); all.push(rec); localStorage.setItem(STATS_KEY, JSON.stringify(all.slice(-200))); } catch (_) { /* bộ nhớ trình duyệt bị chặn */ }
}
function download(name, obj) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
}
function snapshot() {
  if (!S) return null;
  const sd = o => { const s = side(o); return { energy: s.energy, grid: s.grid.map(x => x ? (x.kind === 'mon' ? { id: x.id, hp: x.hp, shield: x.shield, st: Object.keys(x.st) } : { bld: x.id, counter: x.counter }) : null), reserve: s.reserve.map(u => u.id), dead: s.dead.map(u => u.id), trophies: s.trophies.map(u => u.id), dice: s.dice } };
  return { tier: S.tier, phase: S.phase, round: S.round, turn: S.turn, step: S.step, busy: S.busy, over: S.over, pending: pendingPick ? { label: pendingPick.req.label, effect: pendingPick.req.effect } : null, P: sd('P'), B: sd('B') };
}
/** Nút Kết thúc phiên: luôn hiện, dừng mọi xử lý, lưu nhật ký lỗi + trạng thái bàn */
function endSession() {
  if (!confirm('Kết thúc phiên: dừng ván hiện tại và tải nhật ký lỗi (bước cuối, trạng thái bàn)?')) return;
  const report = { app: "Karian's Summoner v7.0", at: new Date().toISOString(), lastStep: S ? STEPS.find(x => x.n === S.step) : null, state: snapshot(), errors: ERRORS,
    log: [...document.querySelectorAll('#log li')].map(l => l.textContent), stats: loadStats() };
  if (S) { S.over = true; S.busy = false; S.aborted = true; }
  if (pendingPick) { const p = pendingPick; pendingPick = null; p.resolve([]); }
  if (diePick) endDiePick(null);
  banner('');
  download(`karian-session-${Date.now()}.json`, report);
  render();
  openModal(`<h2>Đã kết thúc phiên</h2><p>Đã dừng mọi xử lý và tải file <code>karian-session-*.json</code> (nhật ký, trạng thái bàn, lỗi: ${ERRORS.length}). Gửi file này cho Claude để tra nguyên nhân nếu ván bị treo.</p><div class="foot"><button class="btn" data-close>Đóng</button><button class="btn primary" data-act="newgame">Ván mới</button></div>`);
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
    sides: { P: mkSide(pIds), B: mkSide(bIds) }, over: false, busy: false, firstTurn: true, step: 0, turnCount: 0, startTime: Date.now(), hoverDie: null,
    stats: { P: { gained: 0, spent: 0, blds: [] }, B: { gained: 0, spent: 0, blds: [] } }, teams: { P: pIds.slice(), B: bIds.slice() }, buildings: tier === 'standard' && st.buildings, bldDeck: shuffle(D.buildings.map(b => b.id)), chooseColors: 0, colorPick: [] };
  viewSel = null; viewPin = false; renderViewer(); picked = null; pendingPick = null; diePick = null; banner(''); showResultScene(null); stopBeam();
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
  if (!T().noEnergy) { side(second).energy = 1; S.stats[second].gained += 1; }
  S.startTime = Date.now();
  log(`Lật thẻ! ${who(S.first)} đi trước${T().noEnergy ? '' : `; ${who(second)} +1 ✦`}.`, null);
  ['P', 'B'].forEach(o => monsOf(o).forEach(i => log(`${who(o)}: ${uName(side(o).grid[i])} ở ${ROW_VI[rowOf(i)]}-${colOf(i) + 1}`, o)));
  beginTurn();
}
function rulesModal() {
  const refs = ['Luật nhanh', 'Trạng thái - từ khóa', 'Kỹ năng đặc biệt', 'Đặc tính', '5 vai trò', 'Chọn đội · Draft', 'Ván 0 · ván đầu tiên', 'Công trình - Xe ①', 'Công trình - Xe ②'];
  openModal(`<h2>Luật nhanh v6.5</h2>
    <p><b>Lượt 5 bước:</b> Đầu lượt (bỏ Khiên, Đau −2 ❤, nội tại) → Thảy 5 xí ngầu (thảy lại 1 lần) → Gán xí ngầu (viên hệ X kích hoạt 1 quái hệ X theo mặt) → Thi triển → Cuối lượt (bỏ Choáng/Yếu/Hăng hái; viên dư +1 ✦, giữ tối đa 3).</p>
    <p><b>Trên bàn này:</b> kéo xí ngầu lên quái để thi triển; ô viền đỏ là mục tiêu hợp lệ (Cận chiến chỉ đánh hàng gần nhất, Khiêu khích che đồng đội kề, Xuyên bỏ qua Khiêu khích). Nút −/+ trên thẻ để chỉnh ❤ tay; Khiên & trạng thái chỉnh ở khung xem thẻ.</p>
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
    const r = await fetch('data/karian_data.json?v=' + APP_VER, { cache: 'no-cache' }); if (!r.ok) throw new Error(r.status);
    D = await r.json();
  } catch (err) {
    openModal(`<h2>Không tải được dữ liệu</h2><p>Không đọc được <code>data/karian_data.json</code> (${esc(err.message)}).</p><p>Trình duyệt chặn đọc file khi mở trực tiếp <code>index.html</code>. Hãy chạy một server tĩnh trong thư mục dự án, ví dụ:</p><pre>python3 -m http.server 8000</pre><p>rồi mở <code>http://localhost:8000</code> — hoặc dùng bản GitHub Pages.</p>`);
    return;
  }
  D.monsters.forEach(m => (MON[m.id] = m)); D.buildings.forEach(b => (BLD[b.id] = b));
  setupModal();
}
boot();
