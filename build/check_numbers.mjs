// Сверка лендинга и PDF:
//  1. Набор чисел в видимом тексте HTML и в тексте PDF совпадает.
//  2. Каждое число либо входит в подтверждённое утверждение, либо в meta.allow_numbers.
//  3. Тексты подтверждённых утверждений есть в обоих файлах.
//  4. Тексты неподтверждённых утверждений не попали ни в один файл.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const claims = yaml.load(fs.readFileSync(path.join(ROOT, 'claims.yaml'), 'utf8')).claims;
const content = yaml.load(fs.readFileSync(path.join(ROOT, 'content.yaml'), 'utf8'));

const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(path.join(DIST, 'index.html')).href);
const htmlText = await page.evaluate(() => document.body.innerText);
await browser.close();
const pdfText = execFileSync('pdftotext', ['-layout', path.join(DIST, 'brochure.pdf'), '-'], { encoding: 'utf8' });

const norm = (s) => s.replace(/\s+/g, ' ').replace(/[  ]/g, ' ');
const NUM = /\d+(?:[.,/–-]\d+)*/g;
const nums = (s) => new Set(norm(s).match(NUM) || []);
const H = nums(htmlText), P = nums(pdfText);

const errors = [];
const onlyH = [...H].filter((n) => !P.has(n));
const onlyP = [...P].filter((n) => !H.has(n));
if (onlyH.length) errors.push(`числа только в HTML: ${onlyH.join(', ')}`);
if (onlyP.length) errors.push(`числа только в PDF: ${onlyP.join(', ')}`);

const confirmed = claims.filter((c) => c.status === 'подтверждено');
const allowed = new Set([...confirmed.map((c) => c.text), ...(content.meta.allow_numbers || [])].flatMap((t) => [...nums(t)]));
const stray = [...new Set([...H, ...P])].filter((n) => !allowed.has(n));
if (stray.length) errors.push(`числа без подтверждённого источника: ${stray.join(', ')}`);

const hN = norm(htmlText), pN = norm(pdfText);
for (const c of confirmed) {
  // В PDF длинный текст может переноситься — сравниваем без пробелов.
  const squash = (s) => s.replace(/\s+/g, '');
  if (hN.includes(c.text) || pN.includes(c.text)) {
    if (!squash(hN).includes(squash(c.text))) errors.push(`${c.id}: есть в PDF, нет в HTML`);
    if (!squash(pN).includes(squash(c.text))) errors.push(`${c.id}: есть в HTML, нет в PDF`);
  }
}
for (const c of claims.filter((c) => c.status !== 'подтверждено')) {
  if (c.text === c.placeholder) continue;
  for (const [name, t] of [['HTML', hN], ['PDF', pN]]) if (t.includes(c.text)) errors.push(`${c.id} (${c.status}) попал в ${name}`);
}

console.log(`Числа в HTML: ${[...H].sort().join(', ') || '—'}`);
console.log(`Числа в PDF:  ${[...P].sort().join(', ') || '—'}`);
if (errors.length) { console.error('\nРАСХОЖДЕНИЯ:'); errors.forEach((e) => console.error('  ✗ ' + e)); process.exit(1); }
console.log('✓ Числа в HTML и PDF совпадают, все из подтверждённых утверждений или списка allow_numbers.');
console.log('✓ Неподтверждённые утверждения не попали ни в один файл.');
