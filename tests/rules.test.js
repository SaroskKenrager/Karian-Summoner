/* Karian's Summoner · ca kiểm luật cho bản web (chuyển từ Engine v6.5 tests/test_rules.py)
 * File này được nạp VÀO TRONG trang game (iframe) bởi tests/rules.html, nên dùng trực tiếp các hàm của script.js.
 * Mỗi ca: test('tên', 'luật liên quan', async () => { ... ok(điều kiện, 'mô tả'); })
 */
(() => {
const CASES = [];
const test = (name, rule, fn) => CASES.push({ name, rule, fn });
class Fail extends Error {}
const ok = (c, msg) => { if (!c) throw new Fail(msg || 'sai'); };
const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Fail(`${msg || ''} — mong đợi ${JSON.stringify(b)}, nhận ${JSON.stringify(a)}`); };
const same = (a, b, msg) => eq([...a].sort(), [...b].sort(), msg);

/** Dựng nhanh một bàn: P/B = { tênQuái: ô (0–8, hàng 0 = Trước) }, reserve = danh sách quái dự bị của Bạn */
function board(P, B, o = {}) {
  newGame({ tier: o.tier || 'standard', picks: Object.keys(P), draft: { B: Object.keys(B) }, first: 'P', buildings: o.buildings !== false, set: D.starter_sets[0].id, van0: 0 });
  for (const [k, m] of [['P', P], ['B', B]]) {
    const s = side(k); s.grid = Array(9).fill(null); s.reserve = []; s.energy = 0;
    for (const [id, cell] of Object.entries(m)) s.grid[cell] = mkUnit(id);
  }
  side('P').reserve = (o.reserve || []).map(mkUnit);
  side('B').reserve = (o.reserveB || []).map(mkUnit);
  S.phase = 'play'; S.turn = 'P'; S.busy = false; S.firstTurn = false; S.round = 1;
  render(); return S;
}
const U = (o, id) => side(o).grid.find(u => u && u.id === id);
const at = (o, id) => side(o).grid.findIndex(u => u && u.id === id);
const names = (o, idx) => idx.map(i => side(o).grid[i].id);
const ctx0 = () => ({ tg: {}, blocked: new Set() });
const rollFixed = (o, list) => { const s = side(o); s.dice = list.map(([el, face]) => ({ el, face, used: false })); s.rolled = true; s.locked = false; };

/* ───────── dữ liệu ───────── */
test('Dữ liệu đủ: 41 quái · 16 Công trình · 4 bộ khởi động', 'C1', async () => {
  eq(D.monsters.length, 41); eq(D.buildings.length, 16); eq(D.starter_sets.length, 4);
  D.starter_sets.forEach(st => ok(sum(st.members.map(id => MON[id].price)) === 15, st.name + ' phải đúng 15 🍇'));
});
test('Mỗi quái / Công trình có đủ ảnh thẻ + ảnh gốc', 'quy tắc tên ảnh', async () => {
  const urls = [...D.monsters.flatMap(m => [monImg(m.id), artImg(m.id)]), ...D.buildings.flatMap(b => [bldImg(b.id), bldArt(b.id)])];
  const bad = [];
  await Promise.all(urls.map(u => fetch(u, { method: 'HEAD' }).then(r => { if (!r.ok) bad.push(u); }).catch(() => bad.push(u))));
  eq(bad, [], 'thiếu ảnh');
});

/* ───────── lượt 5 bước + Thuật triệu hồi ───────── */
test('Lượt có đúng 5 bước + Thuật triệu hồi', 'lượt 5 bước', async () => {
  eq(STEPS.filter(s => s.n > 0).map(s => s.n), [1, 2, 3, 4, 5]);
  ok(STEPS[0].t.includes('Thuật triệu hồi'));
});
test('Đầu lượt: bỏ hết Khiên trên quái mình (không đụng quái địch)', 'lượt 5 bước', async () => {
  board({ Stoodbeak: 1 }, { Hothog: 1 });
  U('P', 'Stoodbeak').shield = 3; U('B', 'Hothog').shield = 2;
  await startTurn('P');
  eq(U('P', 'Stoodbeak').shield, 0); eq(U('B', 'Hothog').shield, 2);
});
test('Gọi dự bị trong lượt và dùng xí ngầu ngay; mỗi lượt chỉ gọi 1', 'Thuật triệu hồi', async () => {
  board({ Stoodbeak: 1 }, { Hothog: 1 }, { reserve: ['Seaswirl', 'Hellhound'] });
  await startTurn('P');
  dropOn('P', 4, { type: 'res', uid: side('P').reserve.find(u => u.id === 'Seaswirl').uid });
  ok(U('P', 'Seaswirl'), 'Seaswirl lên sân');
  dropOn('P', 5, { type: 'res', uid: side('P').reserve[0].uid });
  ok(!U('P', 'Hellhound'), 'lần gọi thứ 2 trong lượt bị chặn');
  rollFixed('P', [['Water', 2]]);
  const enemy = at('B', 'Hothog');
  const p = assignDie(0, at('P', 'Seaswirl'));
  await new Promise(r => setTimeout(r, 30)); if (pendingPick) finishPick([enemy]); await p;
  ok(U('P', 'Seaswirl').acted, 'quái vừa gọi đã kích hoạt kỹ năng');
});

/* ───────── gán xí ngầu & ✦ ───────── */
test('Mỗi quái tối đa 1 kỹ năng / lượt', 'gán xí ngầu', async () => {
  board({ Stoodbeak: 1, Seaswirl: 4 }, { Hothog: 1 });
  rollFixed('P', [['Water', 4], ['Water', 5]]);
  await assignDie(0, at('P', 'Stoodbeak'));
  await assignDie(1, at('P', 'Stoodbeak'));
  ok(!side('P').dice[1].used, 'viên thứ 2 không được gán cho cùng quái');
});
test('Viên không có quái cùng màu → +1 ✦ ngay ở bước Gán; ✦ tối đa 3', 'D · ✦ trần 3', async () => {
  board({ Stoodbeak: 1 }, { Hothog: 1 });
  side('P').energy = 1;
  rollFixed('P', [['Water', 1], ['Fire', 2], ['Grass', 3], ['Rock', 4], ['Lightning', 5]]);
  lockDead('P');
  eq(side('P').energy, 3, '1 + 4 viên chết nhưng trần 3');
  eq(side('P').dice.filter(d => d.toE).length, 4);
  ok(!side('P').dice[0].used, 'viên Nước vẫn gán được');
});
test('Mặt trống: không kích hoạt và không thành ✦', 'gán xí ngầu', async () => {
  board({ Seaswirl: 4 }, { Hothog: 1 });   // Seaswirl: mặt 1 trống
  rollFixed('P', [['Water', 1]]);
  lockDead('P'); eq(side('P').energy, 0);
  ok(!findSkill(U('P', 'Seaswirl'), side('P').dice[0], side('P').dice), 'mặt 1 không có kỹ năng');
});

/* ───────── khắc hệ ───────── */
test('Khắc hệ +1 · bị khắc −1 · tối thiểu 1', 'khắc hệ ±1', async () => {
  board({ Seaswirl: 4 }, { Hothog: 1 });
  const w = U('P', 'Seaswirl'), f = U('B', 'Hothog');
  eq(calcDmg(w, f, 2, {}), 3, 'Nước đánh Hỏa'); eq(calcDmg(f, w, 2, {}), 1, 'Hỏa đánh Nước'); eq(calcDmg(f, w, 1, {}), 1, 'tối thiểu 1');
});

/* ───────── lưới 3×3 ───────── */
test('Cận chiến chỉ đánh hàng gần nhất còn quái; Tầm xa đánh mọi ô', 'lưới 3×3', async () => {
  board({ Hellhound: 0, Seaswirl: 3 }, { Hothog: 2, Bastogard: 8 });
  same(names('B', legalSingle('P', U('P', 'Hellhound'))), ['Hothog']);
  same(names('B', legalSingle('P', U('P', 'Seaswirl'))), ['Hothog', 'Bastogard']);
});
test('Khiêu khích che đồng đội kề; Xuyên bỏ qua', 'Khiêu khích · Xuyên', async () => {
  board({ Seaswirl: 3, Clangnaga: 4 }, { Lilypo: 1, Bastogard: 4, Hothog: 2 });
  same(names('B', legalSingle('P', U('P', 'Seaswirl'))), ['Lilypo']);
  same(names('B', legalSingle('P', U('P', 'Clangnaga'))), ['Lilypo', 'Bastogard', 'Hothog']);
});
test('Khiêu khích không che quái đứng xa', 'Khiêu khích', async () => {
  board({ Seaswirl: 3 }, { Lilypo: 0, Bastogard: 8 });
  same(names('B', legalSingle('P', U('P', 'Seaswirl'))), ['Lilypo', 'Bastogard']);
});
test('Đòn Hàng trúng cả hàng, không bị Khiêu khích kéo', 'diện rộng', async () => {
  board({ Seaswirl: 3 }, { Lilypo: 1, Hothog: 0, Bastogard: 2 });
  const op = enemyOptions('row', 'P', U('P', 'Seaswirl'), ctx0());
  ok(op.opts.some(r => r.length === 3 && r.includes(at('B', 'Hothog'))), 'có lựa chọn trúng cả hàng, kể cả quái được Lilypo che');
});
test('Đánh lan: tâm là 1 quái địch, trúng thêm quái kề', 'diện rộng', async () => {
  board({ Azurion: 4 }, { Hothog: 1, Bastogard: 4, Lilypo: 0 });
  const op = enemyOptions('cross', 'P', U('P', 'Azurion'), ctx0());
  ok(op.opts.every(g => isMon(side('B').grid[g[0]])), 'tâm luôn là quái');
  const c = op.opts.find(g => g[0] === at('B', 'Hothog')); same(names('B', c), ['Hothog', 'Bastogard', 'Lilypo']);
});

/* ───────── 4 trạng thái ───────── */
test('Đau: đầu lượt chủ quái mất 2 ❤ thẳng, không cộng dồn', 'trạng thái', async () => {
  board({ Stoodbeak: 1 }, { Hothog: 1 });
  const u = U('P', 'Stoodbeak'); setStatus('P', 1, 'pain'); setStatus('P', 1, 'pain');
  await startTurn('P'); eq(u.hp, u.maxHp - 2); ok(!u.st.pain, 'bỏ token sau khi trừ');
  u.shield = 4; await damage('B', null, 'P', 1, 2, ctx0(), true); eq(u.shield, 4, 'mất ❤ thẳng, không qua Khiên');
});
test('Choáng: không kích hoạt kỹ năng', 'trạng thái', async () => {
  board({ Stoodbeak: 1 }, { Hothog: 1 });
  U('P', 'Stoodbeak').st.stun = true; rollFixed('P', [['Water', 4]]);
  await assignDie(0, 1); ok(!U('P', 'Stoodbeak').acted && !side('P').dice[0].used);
});
test('Yếu −1 (tối thiểu 1) · Hăng hái +1', 'trạng thái', async () => {
  board({ Seaswirl: 4 }, { Bastogard: 1 });
  const a = U('P', 'Seaswirl'), t = U('B', 'Bastogard');
  eq(calcDmg(a, t, 2, { weak: true }), 1); eq(calcDmg(a, t, 1, { weak: true }), 1); eq(calcDmg(a, t, 2, { rage: true }), 3);
});
test('Choáng / Yếu / Hăng hái hết ở cuối lượt chủ quái', 'trạng thái', async () => {
  board({ Stoodbeak: 1 }, { Hothog: 1 });
  Object.assign(U('P', 'Stoodbeak').st, { stun: true, weak: true, rage: true }); U('B', 'Hothog').st.stun = true;
  await endTurn('P');
  eq(Object.keys(U('P', 'Stoodbeak').st), []); ok(U('B', 'Hothog').st.stun, 'quái địch vẫn Choáng');
});

/* ───────── điểm & hòa ───────── */
test('Điểm = 🍇 quái đã hạ + 🍇 quái còn sống (kể cả dự bị)', 'điểm', async () => {
  board({ Stoodbeak: 1 }, { Hothog: 1, Seaswirl: 2 }, { reserve: ['Azurion'] });
  U('B', 'Hothog').hp = 1; await damage('P', null, 'B', 1, 5, ctx0(), true);
  eq(scoreOf('P'), { ko: 2, alive: 2 + 5, total: 9, field: 1 });
});
test('Hòa điểm → nhiều quái trên sân hơn thắng; vẫn bằng → hòa', 'hòa D37', async () => {
  board({ Stoodbeak: 1, Seaswirl: 2 }, { Hothog: 1 }, { reserveB: ['Lilypo'] });
  eq(scoreOf('P').total, scoreOf('B').total, 'cùng 4 🍇');
  gameOver('kiểm tra'); ok(document.querySelector('.result.win'), 'Bạn thắng vì 2 quái trên sân > 1');
  closeModal();
});

/* ───────── chọn đội & lượt đầu ───────── */
test('Draft A: 8 thẻ, 2 thẻ mỗi chồng giá', 'Draft A', async () => {
  const d = draftA(); eq(d.P.length, 8);
  const cnt = {}; d.P.forEach(id => (cnt[MON[id].price] = (cnt[MON[id].price] || 0) + 1)); eq(Object.values(cnt), [2, 2, 2, 2]);
  const t = botDraft(d.B); ok(t.length >= 3 && t.length <= 6 && sum(t.map(id => MON[id].price)) <= 15, 'Máy giữ đội 3–6 quái ≤ 15 🍇');
});
test('Lượt đầu: người đi trước 3 viên tự chọn, không thảy lại; người đi sau +1 ✦', 'lượt đầu', async () => {
  newGame({ tier: 'standard', picks: ['Stoodbeak', 'Hothog', 'Seaswirl'], draft: { B: ['Rockshell', 'Bastogard', 'Lilypo'] }, first: 'P', buildings: false });
  [0, 1, 2].forEach(i => dropOn('P', i, { type: 'res', uid: side('P').reserve[0].uid }));
  startGame(); await new Promise(r => setTimeout(r, 50));
  eq(S.chooseColors, 3); eq(side('B').energy, 1);
  S.colorPick = ['Water', 'Fire', 'Grass']; rollPlayer();
  eq(side('P').dice.length, 3); ok(side('P').noReroll, 'không được thảy lại');
});
test('Ván 0: 2 viên tự chọn, không ✦, không khắc hệ', 'Ván 0', async () => {
  board({ Stoodbeak: 1 }, { Hothog: 1 }, { tier: 'van0' });
  eq(TIERS.van0.firstDice, 2); ok(T().noEnergy && T().noElem);
  eq(calcDmg(U('P', 'Stoodbeak'), U('B', 'Hothog'), 2, {}), 2, 'không khắc hệ');
});

/* ───────── Công trình & Xe ───────── */
test('Rút Công trình tốn 2 ✦, 1 lá / lượt; tối đa 2 Nhà', '3 câu Công trình', async () => {
  board({ Stoodbeak: 1 }, { Hothog: 1 });
  const s = side('P'); s.energy = 3; S.bldDeck = ['Fish Pool', 'Round Pool', 'Cozy Nook', 'Tatari Care'];
  await drawBuilding(); eq(s.energy, 1); eq(s.bldHand.length, 1);
  s.energy = 3; await drawBuilding(); eq(s.bldHand.length, 1, 'lá thứ 2 trong lượt bị chặn');
  s.bldHand = ['Tatari Care', 'Cozy Nook', 'Round Pool'].map(id => ({ kind: 'bld', uid: UID++, id, counter: BLD[id].activations, st: {} }));
  dropOn('P', 3, { type: 'bld', uid: s.bldHand[0].uid }); dropOn('P', 4, { type: 'bld', uid: s.bldHand[0].uid }); dropOn('P', 5, { type: 'bld', uid: s.bldHand[0].uid });
  eq(s.grid.filter(x => x && x.kind === 'bld').length, 2, 'Nhà thứ 3 bị chặn');
});
test('Nhà đếm ngược, về 0 ở lại làm cảnh; còn xí ngầu → cuối lượt giữ tối đa 2 ✦', '3 câu Công trình', async () => {
  board({ Stoodbeak: 1 }, { Hothog: 1 });
  const s = side('P'); s.grid[4] = { kind: 'bld', uid: UID++, id: 'Choco Fount', counter: 1, st: {} };
  s.energy = 3; await endTurn('P'); eq(s.energy, 2, 'trần 2 ✦ khi Nhà còn xí ngầu');
  await runHouse('P', 4); eq(s.grid[4].counter, 0); ok(s.grid[4].kind === 'bld', 'nhà vẫn ở lại'); ok(!houseActive('P'));
  s.energy = 3; await endTurn('P'); eq(s.energy, 3, 'nhà làm cảnh không giới hạn ✦');
});
test('Xe giúp 1 lần rồi rời sân', '3 câu Công trình', async () => {
  board({ Stoodbeak: 1 }, { Hothog: 1 });
  const s = side('P'); s.grid[4] = { kind: 'bld', uid: UID++, id: 'Train Stop', counter: 0, st: {} }; s.energy = 0;
  await useVehicle('P', 4); eq(s.energy, 2); ok(!s.grid[4], 'xe đã rời sân');
});
test('Công trình chỉ có ở 1v1 tầng Chuẩn', '3 câu Công trình', async () => {
  board({ Stoodbeak: 1 }, { Hothog: 1 }, { tier: 'starter' }); ok(!S.buildings);
  board({ Stoodbeak: 1 }, { Hothog: 1 }); ok(S.buildings);
});

/* ───────── Charflutter, Ngưỡng ───────── */
test('Charflutter hồi sinh từ chiến lợi phẩm: 4 ❤, đối thủ giữ điểm, không cho điểm lần 2', 'D36 B1', async () => {
  board({ Charflutter: 1, Seaswirl: 4 }, { Hothog: 1 });
  await damage('B', null, 'P', 4, 99, ctx0(), true);          // Seaswirl bị hạ
  eq(scoreOf('B').ko, 2);
  await damage('B', null, 'P', 1, 99, ctx0(), true);          // Charflutter bị hạ → hồi sinh Seaswirl
  const sw = U('P', 'Seaswirl'); ok(sw && sw.hp === 4, 'Seaswirl quay lại với 4 ❤');
  eq(scoreOf('B').ko, 2 + 3, 'Máy giữ điểm hạ cả 2');
  await damage('B', null, 'P', at('P', 'Seaswirl'), 99, ctx0(), true);
  eq(scoreOf('B').ko, 5, 'Seaswirl không cho điểm lần 2');
});
test('Ngưỡng ❤ chạy mỗi lần tụt qua ngưỡng', 'Ngưỡng', async () => {
  board({ Ninjaguana: 4 }, { Hothog: 1 });
  const u = U('P', 'Ninjaguana');
  await damage('B', null, 'P', 4, 3, ctx0(), true); eq(u.shield, 3, 'lần 1 (7 → 4)');
  u.shield = 0; u.hp = 6; await damage('B', null, 'P', 4, 3, ctx0(), true); eq(u.shield, 3, 'lần 2 (6 → 3)');
});

window.__CASES = CASES; window.__Fail = Fail;
})();
