// Скриншоты demo/dist/{index,en}.html на 390 и 1440 + проверка горизонтальной прокрутки.
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(import.meta.url)('playwright');
const b = await chromium.launch();
for (const f of ['index', 'en']) for (const w of [390, 1440]) {
  const p = await b.newPage({ viewport: { width: w, height: w === 390 ? 844 : 900 }, deviceScaleFactor: 1 });
  await p.goto(pathToFileURL(path.join(ROOT, 'demo/dist', f + '.html')).href, { waitUntil: 'networkidle' }).catch(() => {});
  await p.waitForTimeout(400);
  const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  await p.screenshot({ path: path.join(ROOT, 'demo/shots', `${f}-${w}-hero.png`) });
  await p.screenshot({ path: path.join(ROOT, 'demo/shots', `${f}-${w}-full.png`), fullPage: true });
  console.log(f, w, 'horizontal overflow px:', ov);
  await p.close();
}
await b.close();
