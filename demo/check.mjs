// Проверки демо (шаг 4). Пишет demo/dist/check-report.json, код выхода 1 при любом провале.
//  1. DOI: каждый DOI из списка источников страницы разрешается на doi.org сейчас (ответ 30x + Location)
//     и подтверждён записью inputs/literature/doi_check_*.json.
//  2. Метки: каждая цифра в видимом тексте стоит внутри помеченного утверждения (.c),
//     разрешённого идентификатора ([data-allow]) или записи источника. Синтетика — только с меткой S.
//  3. Паритет: числа каждого утверждения на русской и английской странице совпадают; порядок источников тоже.
//  4. axe-core: нарушения доступности, включая контраст (390 и 1440).
//  5. Lighthouse, мобильный профиль: обе страницы.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'demo', 'dist');
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const SKIP_LH = process.argv.includes('--no-lighthouse');
const report = { checked: new Date().toISOString(), pages: {}, doi: {}, parity: {}, failures: [] };
const fail = (m) => report.failures.push(m);

// локальный сервер
const types = { '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const f = path.join(DIST, decodeURIComponent((req.url === '/' ? '/index.html' : req.url).split('?')[0]));
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream', 'cache-control': 'max-age=3600' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const base = `http://localhost:${server.address().port}`;

const normNum = (s) => s.replace(/(\d),(\d)/g, '$1.$2').replace(/[‐-―]/g, '-');
const NUM = /\d+(?:[.,]\d+)*/g;

const browser = await chromium.launch();
const data = {};
for (const page of ['index.html', 'en.html']) {
  const r = { axe: {} };
  for (const w of [390, 1440]) {
    const p = await browser.newPage({ viewport: { width: w, height: 900 } });
    await p.goto(`${base}/${page}`, { waitUntil: 'load' });
    if (w === 390) {
      data[page] = await p.evaluate(() => {
        const bad = [], claims = {}, synthUnmarked = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let n, digits = 0;
        while ((n = walker.nextNode())) {
          const t = n.textContent; if (!/\d/.test(t)) continue;
          const el = n.parentElement; if (el.closest('script,style')) continue;
          const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          digits += (t.match(/\d+/g) || []).length;
          if (!el.closest('.c,[data-allow],.c-ref')) bad.push(t.trim().slice(0, 80));
        }
        document.querySelectorAll('[data-claim]').forEach((e) => {
          const id = e.dataset.claim; const txt = e.cloneNode(true); txt.querySelectorAll('sup').forEach((s) => s.remove());
          (claims[id] ||= []).push(txt.textContent);
          if (e.dataset.class === 'synthetic' && !(e.querySelector('sup.mk') && e.querySelector('sup.mk').textContent === 'S')) synthUnmarked.push(id);
        });
        const refs = [...document.querySelectorAll('.c-ref')].map((li) => ({ id: li.dataset.ref, doi: li.querySelector('a').textContent }));
        const synth = document.querySelectorAll('[data-class="synthetic"]').length;
        return { bad, claims, synthUnmarked, refs, digits, synth };
      });
    }
    await p.addScriptTag({ content: axeSrc });
    const ax = await p.evaluate(async () => (await window.axe.run(document, { resultTypes: ['violations'] })).violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes[0]?.target?.join(' ') })));
    r.axe[w] = ax;
    for (const v of ax) fail(`${page} @${w}: axe ${v.id} (${v.impact}) × ${v.nodes}: ${v.sample}`);
    await p.close();
  }
  const d = data[page];
  r.digits_in_text = d.digits; r.unmarked = d.bad; r.synthetic_spans = d.synth; r.synthetic_without_S = d.synthUnmarked;
  for (const b of d.bad) fail(`${page}: цифра без метки: «${b}»`);
  for (const id of d.synthUnmarked) fail(`${page}: синтетика без метки S: ${id}`);
  report.pages[page] = r;
}

// паритет чисел ru/en
const ru = data['index.html'], en = data['en.html'];
const ids = new Set([...Object.keys(ru.claims), ...Object.keys(en.claims)]);
for (const id of ids) {
  const a = (ru.claims[id] || []).map((t) => (normNum(t).match(NUM) || []).join(' ')).sort();
  const b = (en.claims[id] || []).map((t) => (normNum(t).match(NUM) || []).join(' ')).sort();
  const ok = JSON.stringify(a) === JSON.stringify(b);
  report.parity[id] = ok ? 'ok' : { ru: a, en: b };
  if (!ok) fail(`паритет ${id}: ru ${JSON.stringify(a)} ≠ en ${JSON.stringify(b)}`);
}
if (JSON.stringify(ru.refs) !== JSON.stringify(en.refs)) fail('порядок источников на страницах различается');

// DOI
const rec = JSON.parse(fs.readFileSync(path.join(ROOT, 'inputs/literature/doi_check_2026-11-12.json'), 'utf8')).items;
for (const { doi } of ru.refs) {
  let live = 'н/д';
  try {
    live = execFileSync('curl', ['-sS', '-m', '30', '-o', '/dev/null', '-w', '%{http_code} %{redirect_url}', `https://doi.org/${doi}`], { encoding: 'utf8' });
  } catch (e) { live = 'ошибка сети'; }
  const ok = /^30\d \S+/.test(live) && rec[doi]?.resolves;
  report.doi[doi] = { live, recorded: !!rec[doi]?.resolves, ok };
  if (!ok) fail(`DOI ${doi}: ${live}`);
}
await browser.close();

// Lighthouse (мобильный профиль по умолчанию)
if (!SKIP_LH) {
  const lighthouse = (await import('lighthouse')).default;
  const chromeLauncher = await import('chrome-launcher');
  for (const page of ['index.html', 'en.html']) {
    const chrome = await chromeLauncher.launch({ chromePath: '/opt/pw-browsers/chromium', chromeFlags: ['--headless=new', '--no-sandbox'] });
    const r = await lighthouse(`${base}/${page}`, { port: chrome.port, output: 'html', logLevel: 'error' });
    await chrome.kill();
    fs.writeFileSync(path.join(DIST, `lighthouse-${page.replace('.html', '')}.html`), r.report);
    const scores = Object.fromEntries(Object.entries(r.lhr.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
    const failed = Object.values(r.lhr.audits).filter((a) => a.score !== null && a.score < 0.9 && ['binary', 'numeric'].includes(a.scoreDisplayMode)).map((a) => a.id);
    report.pages[page].lighthouse = { scores, below_90: failed };
  }
}
server.close();

fs.writeFileSync(path.join(DIST, 'check-report.json'), JSON.stringify(report, null, 2));
for (const [p, r] of Object.entries(report.pages)) {
  console.log(`${p}: цифр в тексте ${r.digits_in_text}, без метки ${r.unmarked.length}; синтетических значений ${r.synthetic_spans}, без S ${r.synthetic_without_S.length}; axe 390/1440: ${r.axe[390].length}/${r.axe[1440].length}`);
  if (r.lighthouse) console.log(`   Lighthouse (mobile):`, r.lighthouse.scores, r.lighthouse.below_90.length ? `ниже 90: ${r.lighthouse.below_90.join(', ')}` : '');
}
console.log(`DOI: ${Object.values(report.doi).filter((d) => d.ok).length}/${Object.keys(report.doi).length} разрешаются`);
console.log(`Паритет ru/en: ${Object.values(report.parity).filter((v) => v === 'ok').length}/${ids.size} утверждений`);
if (report.failures.length) { console.error(`\nПРОВАЛЫ (${report.failures.length}):`); report.failures.forEach((f) => console.error('  ✗ ' + f)); process.exit(1); }
console.log('✓ Все проверки пройдены');
