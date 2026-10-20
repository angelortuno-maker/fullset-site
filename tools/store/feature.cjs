// Change 301 (A16): Play's feature graphic v2, 1024×500 — the wordmark and one real screen on true black.
// Usage: node feature.cjs <app with node_modules> <fullset-site checkout> <out dir>
const path = require('node:path');
const fs = require('node:fs');
const [app, site, out] = process.argv.slice(2);
const { chromium } = require(path.join(app, 'node_modules/playwright'));
const { PNG } = require(path.join(app, 'node_modules/pngjs'));
const uri = (f, type) => `data:${type};base64,` + fs.readFileSync(path.join(site, f)).toString('base64');
const html = `<!doctype html><style>
@font-face { font-family: Bebas; src: url(${uri('fonts/bebas-neue-latin.woff2', 'font/woff2')}) format('woff2'); }
body { margin: 0; width: 1024px; height: 500px; background: #000; overflow: hidden; position: relative; }
.word { position: absolute; left: 84px; top: 50%; transform: translateY(-50%); font: 400 132px/0.9 Bebas; letter-spacing: 0.14em; color: #CFFF5E; }
.phone { position: absolute; right: 96px; top: 46px; width: 300px; border-radius: 40px; box-shadow: 0 0 0 2px #2A2826; transform: rotate(-4deg); }
</style><div class="word">FULLSET</div><img class="phone" src="${uri('img/today.png', 'image/png')}">`;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ deviceScaleFactor: 1, viewport: { width: 1024, height: 500 } });
  await p.setContent(html);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  const file = path.join(out, 'feature-1024x500.png');
  await p.screenshot({ path: file });
  await b.close();
  // Play wants a 24-bit PNG with no alpha.
  const png = PNG.sync.read(fs.readFileSync(file));
  fs.writeFileSync(file, PNG.sync.write(png, { colorType: 2 }));
  console.log(file, fs.statSync(file).size, 'bytes');
})();
