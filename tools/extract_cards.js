const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [src, out] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ deviceScaleFactor: 2, viewport: { width: 1300, height: 1000 } });
  await p.goto('file://' + src + '?all=1&back=1', { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(1500);
  await p.addStyleTag({ content: '.slot{outline:none!important}.sheet{background:transparent!important;box-shadow:none!important}html,body,.sheets{background:transparent!important}' });
  const g = await p.evaluate(() => ({ ICON, STI, ico, eni: (document.querySelector('img.eni') || {}).src }));
  const w = (f, d) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, d); };
  const dataUrl = (f, u) => { const m = u.match(/^data:image\/(\w+)[^,]*;base64,(.*)$/); w(f + '.' + (m[1] === 'jpeg' ? 'jpg' : m[1]), Buffer.from(m[2], 'base64')); };
  for (const [k, v] of Object.entries(g.ICON)) dataUrl(path.join(out, 'assets/icons', k), v);
  if (g.eni) dataUrl(path.join(out, 'assets/tokens/energy'), g.eni);
  const svg = v => v.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  const stName = { 'Đau': 'pain', 'Choáng': 'stun', 'Yếu': 'weak', 'Hăng hái': 'rage' };
  for (const [k, v] of Object.entries(g.STI)) w(path.join(out, 'assets/tokens', stName[k] + '.svg'), svg(v));
  w(path.join(out, 'assets/tokens/shield.svg'), svg(g.ico.s));
  w(path.join(out, 'assets/tokens/heal.svg'), svg(g.ico.h));
  w(path.join(out, 'assets/tokens/damage.svg'), svg(g.ico.d));
  const slots = await p.$$('.slot');
  const seen = {}; let n = 0;
  for (const s of slots) {
    const info = await s.evaluate(e => {
      const c = e.firstElementChild; if (!c) return null;
      return { cls: c.className, name: ((c.querySelector('.cn') || {}).textContent || '').trim() };
    });
    if (!info) continue;
    let dir, name;
    if (/\bbk\b/.test(info.cls)) { dir = 'cards'; name = /bb2/.test(info.cls) ? 'back-building' : 'back-monster'; }
    else if (/\bbld\b/.test(info.cls)) { dir = 'cards/buildings'; name = info.name; }
    else if (/\bref\b/.test(info.cls)) { dir = 'cards/reference'; name = info.name.replace(/[\/\\:&]/g, '-'); }
    else { dir = 'cards/monsters'; name = info.name; }
    const key = dir + '/' + name; if (seen[key]) continue; seen[key] = 1;
    const f = path.join(out, 'assets', dir, name + '.png');
    fs.mkdirSync(path.dirname(f), { recursive: true });
    await s.screenshot({ path: f, omitBackground: true }); n++;
  }
  console.log('saved', n);
  await b.close();
})();
