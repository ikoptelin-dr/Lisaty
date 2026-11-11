// Lighthouse (мобильный профиль по умолчанию) для dist/index.html через локальный сервер.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const server = http.createServer((req, res) => {
  const f = path.join(DIST, req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(DIST) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  const type = f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';
  res.writeHead(200, { 'content-type': type });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const port = server.address().port;

const chrome = await chromeLauncher.launch({
  chromePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium',
  chromeFlags: ['--headless=new', '--no-sandbox'],
});
const r = await lighthouse(`http://localhost:${port}/`, { port: chrome.port, output: 'html', logLevel: 'error' });
fs.writeFileSync(path.join(DIST, 'lighthouse-mobile.html'), r.report);
await chrome.kill();
server.close();

const cats = r.lhr.categories;
const scores = Object.fromEntries(Object.entries(cats).map(([k, v]) => [k, Math.round(v.score * 100)]));
console.log('Lighthouse (mobile):', scores);
const failed = Object.values(r.lhr.audits).filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode === 'binary');
if (failed.length) console.log('Непройденные проверки:', failed.map((a) => a.id).join(', '));
fs.writeFileSync(path.join(DIST, 'lighthouse-scores.json'), JSON.stringify(scores, null, 2));
