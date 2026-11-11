// Сборка лендинга и PDF из content.yaml + claims.yaml.
//
//   node build/build.mjs           — чистовая сборка (для рассылки). Падает, если:
//                                    * в content.yaml есть ссылка на id, которого нет в claims.yaml;
//                                    * ссылка на утверждение не со статусом «подтверждено»;
//                                    * у подтверждённого утверждения нет файла в inputs/ или страницы;
//                                    * в служебном тексте есть факт без id (цифры, виды, единицы,
//                                      сертификаты), превосходные степени или медицинские слова;
//                                    * в контактах остались плейсхолдеры «[...]»;
//                                    * PDF вышел не 2–4 страницы.
//   node build/build.mjs --draft   — черновик: неподтверждённые утверждения заменяются на
//                                    placeholder («по запросу»), на страницах плашка «Черновик».
//                                    Все остальные проверки те же.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import yaml from 'js-yaml';

// Playwright берём установленный в системе (require учитывает NODE_PATH, import — нет).
export const loadPlaywright = () => createRequire(import.meta.url)('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const DRAFT = process.argv.includes('--draft');
const SKIP_PDF = process.argv.includes('--no-pdf');
const CONFIRMED = 'подтверждено';

const errors = [];
const fail = (msg) => errors.push(msg);

const claimsDoc = yaml.load(fs.readFileSync(path.join(ROOT, 'claims.yaml'), 'utf8'));
const content = yaml.load(fs.readFileSync(path.join(ROOT, 'content.yaml'), 'utf8'));
const inputsDir = path.join(ROOT, claimsDoc.meta?.inputs_dir || 'inputs');

// ---------- 1. Реестр ----------
const claims = new Map();
for (const c of claimsDoc.claims || []) {
  if (!c.id) { fail(`claims.yaml: утверждение без id: ${JSON.stringify(c.text)}`); continue; }
  if (claims.has(c.id)) fail(`claims.yaml: повтор id ${c.id}`);
  if (!claimsDoc.meta.statuses.includes(c.status)) fail(`claims.yaml: ${c.id}: неизвестный статус «${c.status}»`);
  if (c.status === CONFIRMED) {
    const f = c.source?.file;
    if (!f) fail(`claims.yaml: ${c.id}: статус «подтверждено», но нет source.file`);
    else if (!fs.existsSync(path.join(inputsDir, f))) fail(`claims.yaml: ${c.id}: файл-источник inputs/${f} не найден`);
    if (c.source?.page == null || c.source.page === '') fail(`claims.yaml: ${c.id}: не указана страница источника`);
  }
  claims.set(c.id, c);
}

// ---------- 2. Линтер служебного текста ----------
const allowNumbers = content.meta.allow_numbers || [];
const RULES = [
  [/\d/, 'цифра вне claims.yaml'],
  [/\b[A-Z][a-z]*\.\s?[a-z]{3,}/, 'латинское название вида'],
  [/\b(?:Bifidobacterium|Lactobacillus|Streptococcus|Propionibacterium|Limosilactobacillus)\b/, 'латинское название рода'],
  [/(?<!\p{L})КОЕ(?!\p{L})|%|°|(?<!\p{L})(?:мг|мл|кг|г|л)(?!\p{L})/u, 'единица измерения'],
  [/(?<!\p{L})(?:GMP|ISO|HACCP|FSSC|ХАССП|ГОСТ|ТУ)(?!\p{L})/u, 'сертификат или стандарт'],
  [/сертифицирован|зарегистрирован|соответству|гарантир|не содержит|без ГМО|стабильн|мощност/i, 'утверждение о свойстве без id'],
  [/лучш|уникальн|самы[йея]|№|лидер|инновац|революц|непревзойд|высочайш|идеальн|эффективн|премиальн|номер один/i, 'рекламная превосходная степень'],
  [/лечи|лечен|профилакт|иммун|здоров|болезн|заболев|терап|восстанавл|укрепля|пробиот|метабиот|постбиот|микрофлор|оздоров/i, 'медицинская или функциональная формулировка'],
];
function lint(where, s) {
  if (typeof s !== 'string') return;
  let t = s;
  for (const a of allowNumbers) t = t.split(a).join(' ');
  for (const [re, why] of RULES) {
    const m = t.match(re);
    if (m) fail(`content.yaml: ${where}: ${why} — «${m[0]}» в «${s}»`);
  }
}
// Медицинские слова запрещены и в самих утверждениях, пока регистратор не одобрил (reg_review: approved).
for (const c of claims.values()) {
  const med = RULES[RULES.length - 1][0];
  if (med.test(c.text) && c.reg_review !== 'approved') fail(`claims.yaml: ${c.id}: формулировка о пользе без reg_review: approved`);
}

// ---------- 3. Разрешение ссылок ----------
const used = new Map();   // id -> {status, rendered}
const isClaim = (v) => v && typeof v === 'object' && 'claim' in v;
function walkLint(node, where) {
  if (typeof node === 'string') return lint(where, node);
  if (Array.isArray(node)) return node.forEach((n, i) => walkLint(n, `${where}[${i}]`));
  if (node && typeof node === 'object') {
    if (isClaim(node)) return ref(node, where);
    for (const [k, v] of Object.entries(node)) {
      if (['href', 'name', 'type', 'autocomplete', 'options_from', 'lang', 'allow_numbers', 'version_date'].includes(k) && typeof v === 'string') continue;
      walkLint(v, `${where}.${k}`);
    }
  }
}
function ref(node, where) {
  const c = claims.get(node.claim);
  if (!c) { fail(`content.yaml: ${where}: id ${node.claim} отсутствует в claims.yaml`); return; }
  if (c.status !== CONFIRMED && !DRAFT) fail(`content.yaml: ${where}: ${c.id} — статус «${c.status}» (${c.gap || 'без запроса'})`);
  used.set(c.id, c.status);
}
const { contacts, ...rest } = content;
walkLint(rest, 'content');
if (!DRAFT) for (const [k, v] of Object.entries(contacts)) if (/\[.*\]/.test(v)) fail(`content.yaml: contacts.${k}: не заполнено («${v}»)`);

// ---------- 4. Рендер ----------
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
function val(node) {
  if (node == null) return '';
  if (!isClaim(node)) return esc(node);
  const c = claims.get(node.claim);
  if (!c) return '';
  if (c.status === CONFIRMED) return `<span class="fact" data-claim="${c.id}">${esc(c.text)}</span>`;
  return `<span class="pending" data-claim="${c.id}" data-gap="${esc(c.gap || '')}">${esc(c.placeholder || 'по запросу')}</span>`;
}
const confirmedText = (node) => {
  const c = isClaim(node) && claims.get(node.claim);
  return c && c.status === CONFIRMED ? c.text : null;
};
const values = (arr) => (arr && arr.length ? `<ul class="vals">${arr.map((v) => `<li>${val(v)}</li>`).join('')}</ul>` : '');
const productName = (p) => confirmedText(p.name) || p.slot;

function qaList(items, cls) {
  return `<dl class="${cls}">${items.map((it) => `
      <div class="qa"><dt>${esc(it.q)}</dt><dd>${it.a ? `<p>${esc(it.a)}</p>` : ''}${values(it.values)}</dd></div>`).join('')}
    </dl>`;
}
function productCards(level) {
  const h = `h${level}`;
  return content.products.items.map((p) => `
      <article class="card">
        <p class="slot">${esc(p.slot)}</p>
        <${h} class="card-title">${val(p.name)}</${h}>
        <dl class="rows">${p.rows.map((r) => `<div><dt>${esc(r.label)}</dt><dd>${val(r.value)}</dd></div>`).join('')}</dl>
      </article>`).join('');
}
const commonRows = () => `<dl class="rows common">${content.products.common.map((r) => `<div><dt>${esc(r.label)}</dt><dd>${val(r.value)}</dd></div>`).join('')}</dl>`;
const docTable = () => `<table class="docs"><thead><tr><th scope="col">Документ</th><th scope="col">Что известно</th></tr></thead><tbody>${content.documents.rows.map((r) => `<tr><th scope="row">${esc(r.label)}</th><td>${val(r.value)}</td></tr>`).join('')}</tbody></table>`;
const limits = () => `<ul class="limits">${content.limitations.items.map((it) => `<li><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p>${values(it.values)}</li>`).join('')}</ul>`;
const heroFacts = () => `<dl class="hero-facts">${content.hero.facts.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${val(f.value)}</dd></div>`).join('')}</dl>`;
const draftBanner = DRAFT ? `<div class="draft" role="note">${esc(content.draft_banner)}</div>` : '';
const versionLine = `Версия материала: ${esc(content.meta.version_date)}`;

function field(f) {
  const id = `f-${f.name}`;
  const req = f.required ? ' required' : '';
  const ac = f.autocomplete ? ` autocomplete="${f.autocomplete}"` : '';
  const star = f.required ? ' <span class="req" aria-hidden="true">*</span>' : '';
  if (f.type === 'select') {
    return `<div class="field"><label for="${id}">${esc(f.label)}${star}</label><select id="${id}" name="${f.name}"${req}><option value="">Выберите</option>${f.options.map((o) => `<option>${esc(o)}</option>`).join('')}</select></div>`;
  }
  if (f.type === 'checkboxes') {
    const opts = f.options_from === 'products' ? content.products.items.map(productName) : f.options;
    return `<fieldset class="field"><legend>${esc(f.label)}</legend>${opts.map((o, i) => `<label class="check"><input type="checkbox" name="${f.name}" value="${esc(o)}" id="${id}-${String.fromCharCode(97 + i)}"> ${esc(o)}</label>`).join('')}</fieldset>`;
  }
  if (f.type === 'textarea') return `<div class="field"><label for="${id}">${esc(f.label)}${star}</label><textarea id="${id}" name="${f.name}" rows="4"${req}></textarea></div>`;
  return `<div class="field"><label for="${id}">${esc(f.label)}${star}</label><input id="${id}" name="${f.name}" type="${f.type}"${req}${ac}></div>`;
}
const contactList = () => `<ul class="contacts">
        <li>${esc(contacts.company)}</li>
        <li>${esc(contacts.person)}</li>
        <li>${/\[/.test(contacts.email) ? esc(contacts.email) : `<a href="mailto:${esc(contacts.email)}">${esc(contacts.email)}</a>`}</li>
        <li>${/\[/.test(contacts.phone) ? esc(contacts.phone) : `<a href="tel:${esc(contacts.phone.replace(/[^\d+]/g, ''))}">${esc(contacts.phone)}</a>`}</li>
      </ul>`;

const M = content.meta;
const formAction = /\[/.test(contacts.form_action) ? '' : ` action="${esc(contacts.form_action)}"`;

const web = `<!doctype html>
<html lang="${M.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(M.title)}</title>
<meta name="description" content="${esc(M.description)}">
<meta name="theme-color" content="#1f4f43">
<link rel="icon" href="data:,">
${DRAFT ? '<meta name="robots" content="noindex, nofollow">\n' : ''}<style>${fs.readFileSync(path.join(ROOT, 'build/site.css'), 'utf8')}</style>
</head>
<body>
${draftBanner}
<header class="top">
  <div class="wrap top-in">
    <span class="maker">${val(content.hero.manufacturer)}</span>
    <a class="btn btn-sm" href="${content.hero.cta.href}">Запросить образец</a>
  </div>
</header>
<main>
  <section class="hero">
    <div class="wrap">
      <p class="kicker">${esc(content.hero.kicker)}</p>
      <h1>${esc(content.hero.title)}</h1>
      <p class="lead">${esc(content.hero.lead)}</p>
      <a class="btn" href="${content.hero.cta.href}">${esc(content.hero.cta.label)}</a>
      ${heroFacts()}
      <p class="howto">${esc(content.how_to_read)}</p>
    </div>
  </section>

  <section id="products" class="sec">
    <div class="wrap">
      <h2>${esc(content.products.title)}</h2>
      <p class="intro">${esc(content.products.intro)}</p>
      <div class="cards">${productCards(3)}
      </div>
      <h3 class="sub">Общее для всех продуктов</h3>
      ${commonRows()}
    </div>
  </section>

  <section id="producers" class="sec alt">
    <div class="wrap">
      <h2>${esc(content.producers.title)}</h2>
      <p class="intro">${esc(content.producers.intro)}</p>
      ${qaList(content.producers.items, 'qas')}
    </div>
  </section>

  <section id="distributors" class="sec">
    <div class="wrap">
      <h2>${esc(content.distributors.title)}</h2>
      <p class="intro">${esc(content.distributors.intro)}</p>
      ${qaList(content.distributors.items, 'qas')}
    </div>
  </section>

  <section id="documents" class="sec alt">
    <div class="wrap">
      <h2>${esc(content.documents.title)}</h2>
      <p class="intro">${esc(content.documents.intro)}</p>
      <div class="table-wrap">${docTable()}</div>
    </div>
  </section>

  <section id="limits" class="sec">
    <div class="wrap">
      <h2>${esc(content.limitations.title)}</h2>
      <p class="intro">${esc(content.limitations.intro)}</p>
      ${limits()}
    </div>
  </section>

  <section id="request" class="sec req">
    <div class="wrap req-in">
      <div>
        <h2>${esc(content.request.title)}</h2>
        <p class="intro">${esc(content.request.intro)}</p>
        ${contactList()}
      </div>
      <form class="form" method="post"${formAction}>
        ${content.request.fields.map(field).join('\n        ')}
        <label class="check consent"><input type="checkbox" name="consent" required> ${esc(content.request.consent)}</label>
        <button class="btn" type="submit">${esc(content.request.submit)}</button>
      </form>
    </div>
  </section>
</main>
<footer class="foot"><div class="wrap"><p>${versionLine}</p><p>${esc(content.how_to_read)}</p></div></footer>
</body>
</html>
`;

const print = `<!doctype html>
<html lang="${M.lang}">
<head>
<meta charset="utf-8">
<title>${esc(M.title)}</title>
<style>${fs.readFileSync(path.join(ROOT, 'build/print.css'), 'utf8')}</style>
</head>
<body>
<section class="page p1">
  ${draftBanner}
  <header class="ph"><span class="maker">${val(content.hero.manufacturer)}</span><span>${versionLine}</span></header>
  <p class="kicker">${esc(content.hero.kicker)}</p>
  <h1>${esc(content.hero.title)}</h1>
  <p class="lead">${esc(content.hero.lead)}</p>
  ${heroFacts()}
  <p class="howto">${esc(content.how_to_read)}</p>
  <h2>${esc(content.products.title)}</h2>
  <p class="intro">${esc(content.products.intro)}</p>
  <div class="cards">${productCards(3)}</div>
  ${commonRows()}
</section>
<section class="page p2">
  ${draftBanner}
  <div class="cols">
    <div>
      <h2>${esc(content.producers.title)}</h2>
      <p class="intro">${esc(content.producers.intro)}</p>
      ${qaList(content.producers.items, 'qas')}
    </div>
    <div>
      <h2>${esc(content.distributors.title)}</h2>
      <p class="intro">${esc(content.distributors.intro)}</p>
      ${qaList(content.distributors.items, 'qas')}
    </div>
  </div>
</section>
<section class="page p3">
  ${draftBanner}
  <h2>${esc(content.documents.title)}</h2>
  <p class="intro">${esc(content.documents.intro)}</p>
  ${docTable()}
  <h2>${esc(content.limitations.title)}</h2>
  <p class="intro">${esc(content.limitations.intro)}</p>
  ${limits()}
  <div class="req">
    <h2>${esc(content.request.title)}</h2>
    <ul class="steps">${content.request.pdf_steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
    ${contactList()}
  </div>
</section>
</body>
</html>
`;

// ---------- 5. Итог проверок ----------
const pending = [...used].filter(([, s]) => s !== CONFIRMED).map(([id]) => id);
if (errors.length) {
  console.error(`\nСБОРКА ОСТАНОВЛЕНА (${DRAFT ? 'черновик' : 'чистовая'}): ${errors.length} ошибок\n`);
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\nПодтверждено: ${used.size - pending.length} из ${used.size} использованных утверждений.`);
  if (!DRAFT) console.error('Черновик без неподтверждённых фактов: node build/build.mjs --draft');
  process.exit(1);
}

fs.mkdirSync(DIST, { recursive: true });
fs.writeFileSync(path.join(DIST, 'index.html'), web);
fs.writeFileSync(path.join(DIST, 'brochure.html'), print);

let pages = null;
if (!SKIP_PDF) {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(pathToFileURL(path.join(DIST, 'brochure.html')).href, { waitUntil: 'load' });
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: path.join(DIST, 'brochure.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
  await browser.close();
  const info = execFileSync('pdfinfo', [path.join(DIST, 'brochure.pdf')], { encoding: 'utf8' });
  pages = Number(info.match(/Pages:\s+(\d+)/)[1]);
  if (pages < 2 || pages > 4) {
    console.error(`✗ PDF: ${pages} стр., нужно 2–4. Сократите текст или поправьте build/print.css.`);
    process.exit(1);
  }
}

const report = {
  mode: DRAFT ? 'draft' : 'release',
  built: new Date().toISOString(),
  claims_used: used.size,
  confirmed: used.size - pending.length,
  pending_rendered_as_placeholder: pending,
  pdf_pages: pages,
};
fs.writeFileSync(path.join(DIST, 'build-report.json'), JSON.stringify(report, null, 2));
console.log(`Готово (${report.mode}): dist/index.html, dist/brochure.pdf (${pages} стр.)`);
console.log(`Утверждений на странице: ${report.confirmed} подтверждено, ${pending.length} заменено на «по запросу».`);
