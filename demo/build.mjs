// Сборка демо-лендинга: demo/dist/index.html (ru) и demo/dist/en.html (en)
// из demo/content.yaml + claims.yaml.
//
//   node demo/build.mjs            демо: синтетика разрешена, но каждая синтетическая цифра
//                                  получает метку S; без метки рендер невозможен (см. mark()).
//   node demo/build.mjs --release  чистовая: падает на любом synthetic и на любом утверждении
//                                  со статусом не «подтверждено».
// В обоих режимах сборка падает, если:
//   - id из content.yaml нет в claims.yaml;
//   - у literature / plant-document нет файла-источника или цитата не найдена в нём дословно;
//   - у literature нет ссылки с DOI, или DOI не разрешается по записи проверки;
//   - в служебном тексте есть цифры вне {{id}} и <<...>>, превосходные степени или медицинские обещания.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'demo', 'dist');
const RELEASE = process.argv.includes('--release');
const errors = [];
const fail = (m) => errors.push(m);

const reg = yaml.load(fs.readFileSync(path.join(ROOT, 'claims.yaml'), 'utf8'));
const C = yaml.load(fs.readFileSync(path.join(ROOT, 'demo', 'content.yaml'), 'utf8'));
const doiCheck = JSON.parse(fs.readFileSync(path.join(ROOT, 'inputs/literature/doi_check_2026-11-12.json'), 'utf8')).items;
const claims = new Map(reg.claims.map((c) => [c.id, c]));
const CLASSES = ['synthetic', 'literature', 'plant-document'];
const EVIDENCE = ['in vitro', 'животные', 'человек', 'нет данных'];

// ---------- 1. Реестр: классы, источники, цитаты, DOI ----------
const norm = (s) => String(s).replace(/&quot;/g, '"').replace(/[‐-―]/g, '-').replace(/\s+/g, ' ').trim();
const textCache = new Map();
const readSrc = (f) => {
  if (!textCache.has(f)) textCache.set(f, norm(fs.readFileSync(path.join(ROOT, 'inputs', f), 'utf8')));
  return textCache.get(f);
};
function validateClaim(c) {
  if (!CLASSES.includes(c.data_class)) return fail(`claims.yaml: ${c.id}: data_class «${c.data_class}» не из ${CLASSES.join(' / ')}`);
  if (!EVIDENCE.includes(c.evidence)) fail(`claims.yaml: ${c.id}: evidence «${c.evidence}» не из ${EVIDENCE.join(' / ')}`);
  if (!c.text || typeof c.text !== 'object' || !c.text.ru || !c.text.en) fail(`claims.yaml: ${c.id}: нужен text.ru и text.en`);
  if (c.data_class === 'synthetic') {
    if (RELEASE) fail(`${c.id}: синтетическое значение в чистовой сборке`);
    return;
  }
  if (c.status !== 'подтверждено') fail(`${c.id}: статус «${c.status}»`);
  const f = c.source?.file;
  if (!f || !fs.existsSync(path.join(ROOT, 'inputs', f))) return fail(`${c.id}: файл-источник inputs/${f} не найден`);
  if (!c.source.quote) return fail(`${c.id}: нет source.quote`);
  if (!readSrc(f).includes(norm(c.source.quote))) fail(`${c.id}: цитата не найдена в inputs/${f}: «${c.source.quote}»`);
  if (c.data_class === 'literature') {
    const r = C.references[c.ref];
    if (!r) return fail(`${c.id}: ссылка ${c.ref} отсутствует в content.yaml → references`);
    const d = doiCheck[r.doi];
    if (!d || !d.resolves) fail(`${c.id}: DOI ${r.doi} не подтверждён записью проверки`);
  }
}

// ---------- 2. Линтер служебного текста (ru + en) ----------
const RULES = [
  [/\d/, 'цифра вне {{id}} и <<...>>'],
  [/лучш|уникальн|самы[йея]|прорыв|революц|непревзойд|лидер|инновацион|идеальн|номер один|\bbest\b|unique|breakthrough|revolution|world-class|leading|cutting-edge|miracle/i, 'превосходная степень'],
  [/лечи|лечен|профилакт|иммуностим|иммунит|оздоров|омолаж|\bcures?\b|\btreat|prevent|boosts? immun|immune boost|heal/i, 'медицинское обещание'],
];
function lint(where, s) {
  const t = String(s).replace(/\{\{[A-Z0-9-]+\}\}/g, ' ').replace(/<<[^>]*>>/g, ' ');
  for (const [re, why] of RULES) { const m = t.match(re); if (m) fail(`content.yaml: ${where}: ${why} — «${m[0]}» в «${s}»`); }
}
const SKIP = new Set(['href', 'icon', 'name', 'type', 'ac', 'cls', 'mark', 'mark_en', 'doi', 'version', 'date', 'status', 'references', 'table', 'req', 'gap']);
(function walk(n, where) {
  if (typeof n === 'string') return lint(where, n);
  if (Array.isArray(n)) return n.forEach((x, i) => walk(x, `${where}[${i}]`));
  if (n && typeof n === 'object') for (const [k, v] of Object.entries(n)) if (!SKIP.has(k)) walk(v, `${where}.${k}`);
})(C, 'content');

// ---------- 3. Рендер ----------
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const used = new Set();
function makeRenderer(lang) {
  const refOrder = [];
  const refNo = (id) => { if (!refOrder.includes(id)) refOrder.push(id); return refOrder.indexOf(id) + 1; };
  const L = (v) => (v && typeof v === 'object' && !Array.isArray(v) && ('ru' in v || 'en' in v) ? v[lang] : v);
  function mark(c) {
    const t = esc(c.text[lang]);
    if (c.data_class === 'synthetic') {
      const al = lang === 'ru' ? 'синтетическое значение' : 'synthetic value';
      return `<span class="c c-s" data-claim="${c.id}" data-class="synthetic">${t}<sup class="mk" title="${al}" aria-label="${al}">S</sup></span>`;
    }
    if (c.data_class === 'literature') {
      const n = refNo(c.ref);
      return `<span class="c c-l" data-claim="${c.id}" data-class="literature">${t}<sup class="mk"><a href="#ref-${n}" aria-label="${lang === 'ru' ? 'источник' : 'source'} ${n}">[${n}]</a></sup></span>`;
    }
    const tip = esc(`${c.source.page} · inputs/${c.source.file}`);
    return `<span class="c c-d" data-claim="${c.id}" data-class="plant-document">${t}<sup class="mk" title="${tip}">${lang === 'ru' ? 'Д' : 'D'}</sup></span>`;
  }
  // строка → HTML: {{ID}}, <<allow>>, *accent*
  function R(v) {
    const s = L(v);
    if (s == null) return '';
    let out = '';
    const re = /\{\{([A-Z0-9-]+)\}\}|<<([^>]*)>>|\*([^*]+)\*/g;
    let last = 0, m;
    while ((m = re.exec(s))) {
      out += esc(s.slice(last, m.index));
      if (m[1]) {
        const c = claims.get(m[1]);
        if (!c) fail(`content.yaml: {{${m[1]}}} нет в claims.yaml`);
        else { used.add(c.id); out += mark(c); }
      } else if (m[2] != null) out += `<span class="al" data-allow>${esc(m[2])}</span>`;
      else out += `<span class="accent">${esc(m[3])}</span>`;
      last = re.lastIndex;
    }
    return out + esc(s.slice(last));
  }
  return { R, L, refOrder, mark };
}

// Шрифты лежат рядом со страницей (OFL-1.1, пакеты @fontsource): материал открывается без сети.
const FONTS = [];
const CYR = 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116';
const LAT = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
let FONT_CSS = '';
for (const [fam, pkg, file] of [['Inter', 'inter', 'inter'], ['Geist Mono', 'geist-mono', 'geist-mono']]) for (const w of [400, 500, 600]) for (const [sub, range] of [['cyrillic', CYR], ['latin', LAT]]) {
  const f = `${file}-${sub}-${w}-normal.woff2`;
  const src = path.join(ROOT, 'node_modules/@fontsource', pkg, 'files', f);
  if (!fs.existsSync(src)) continue;
  FONTS.push(src);
  FONT_CSS += `@font-face{font-family:"${fam}";font-style:normal;font-weight:${w};font-display:swap;src:url(fonts/${f}) format("woff2");unicode-range:${range}}`;
}
const refYear = (cite) => (cite.match(/\. ((?:19|20)\d{2})[;.,]/) || [])[1] || (cite.match(/(?:19|20)\d{2}/g) || ['']).pop();

const ICON = {
  flask: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7 15h10"/></svg>',
  doc: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
  drop: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/></svg>',
  ph: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  vial: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M8 3h8M9 3v15a3 3 0 0 0 6 0V3M9 12h6"/></svg>',
  dish: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><ellipse cx="12" cy="12" rx="9" ry="5"/><circle cx="9" cy="12" r="1"/><circle cx="14" cy="11" r="1"/><circle cx="13" cy="14" r="1"/></svg>',
  search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9c9c9d" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  diamond: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="dg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb347"/><stop offset=".5" stop-color="#ff6b4a"/><stop offset="1" stop-color="#ff2f3a"/></linearGradient></defs><path d="M12 2l10 10-10 10L2 12z" fill="url(#dg)"/></svg>',
};

function page(lang) {
  const { R, L, refOrder } = makeRenderer(lang);
  const ru = lang === 'ru';
  const h = C.hero;
  const listItems = (arr) => arr.map((x) => `<li>${R(x)}</li>`).join('');
  const rows = (arr) => `<dl class="rows">${arr.map((r) => `<div><dt>${R(r.label)}</dt><dd>${R(r.value)}</dd></div>`).join('')}</dl>`;
  const qas = (items) => `<ul class="qas">${items.map((it) => `<li class="qa"><h3>${R(it.q)}</h3>${it.a ? `<p>${R(it.a)}</p>` : ''}${it.v ? `<ul>${listItems(it.v)}</ul>` : ''}</li>`).join('')}</ul>`;
  const classLabel = { synthetic: ru ? 'Синтетика' : 'Synthetic', literature: ru ? 'Литература' : 'Literature', 'plant-document': ru ? 'Документ завода' : 'Plant document' };
  const disc = (c) => (c.data_class === 'synthetic' ? '—' : c.disclosure || (ru ? 'О' : 'O'));
  const discEn = (d) => (ru ? d : { 'О': 'O', 'З': 'R', NDA: 'NDA', '—': '—' }[d] || d);
  const srcLabel = (c) => (c.data_class === 'synthetic' ? (ru ? 'нет — в чистовую не попадёт' : 'none — blocked from release') : c.data_class === 'literature' ? esc(`${C.references[c.ref].cite.split(/[ ,]/)[0]}${/ et al\./.test(C.references[c.ref].cite) ? ' et al.' : ''}, ${refYear(C.references[c.ref].cite)}`) : esc(c.source.page));

  const body = `
<nav class="nav" aria-label="${ru ? 'Основная навигация' : 'Main navigation'}">
  <a class="brand" href="#top">${ICON.diamond}<span>${R(C.nav.brand)}</span></a>
  <ul class="nav-links">${C.nav.links.map((l) => `<li><a href="${l.href}">${R(l)}</a></li>`).join('')}</ul>
  <div class="nav-right"><a class="lang" href="${C.nav.lang[lang].href}" hreflang="${ru ? 'en' : 'ru'}">${C.nav.lang[lang].label}</a><a class="pill" href="#request">${R(C.nav.cta)}</a></div>
</nav>
<header class="hero" id="top">
  <div class="aurora" aria-hidden="true"><div class="blade b1"></div><div class="blade b2"></div><div class="blade b3"></div><div class="blade b4"></div></div>
  <div class="grain" aria-hidden="true"></div><div class="vignette" aria-hidden="true"></div>
  <div class="wrap hero-in">
    <span class="chip"><i aria-hidden="true"></i>${R(h.eyebrow)}</span>
    <h1 class="h1">${h.h1[lang].map((l) => `<span>${R(l)}</span>`).join('')}</h1>
    <p class="sub">${R(h.sub)}</p>
    <div class="keys">${h.keys.map((k) => `<a class="key" href="${k.href}">${ICON[k.icon]}${R(k)}</a>`).join('')}</div>
    <p class="caption">${R(h.caption)}</p>
    <div class="panel" role="group" aria-label="${R(h.panel.mode)}">
      <div class="p-search">${ICON.search}<span class="q">${R(h.panel.query)}<span class="caret" aria-hidden="true"></span></span><span class="mode">${R(h.panel.mode)}</span></div>
      <ul class="p-rows">${h.panel.rows.map((r, i) => `<li class="p-row${i === 0 ? ' on' : ''}">${ICON[r.icon]}<span class="lbl">${R(r.label)}</span><span class="val">${R(r.value)}</span><span class="kbd">${R(r.chip)}</span></li>`).join('')}</ul>
      <div class="p-foot"><span>${R(h.panel.hints)}</span><span>${R(C.nav.brand)}</span></div>
    </div>
    <a class="ghost" href="${h.ghost.href}">${R(h.ghost)} <span aria-hidden="true">→</span></a>
  </div>
  <div class="badge" role="note" aria-label="${R(h.badge.title)}"><span class="bm" aria-hidden="true">S</span><span><b>${R(h.badge.title)}</b><small>${R(h.badge.text)}</small></span></div>
</header>
<main>
  <section class="sec" aria-labelledby="legend-h"><div class="wrap">
    <h2 id="legend-h">${R(C.legend.title)}</h2>
    <ul class="legend">${C.legend.items.map((i) => `<li><span class="lm ${i.cls}">${ru ? i.mark : i.mark_en || i.mark}</span><span>${R(i)}</span></li>`).join('')}</ul>
  </div></section>

  <section class="sec" id="tech" aria-labelledby="tech-h"><div class="wrap">
    <h2 id="tech-h">${R(C.tech.title)}</h2><p class="intro">${R(C.tech.intro)}</p>
    <div class="tbl-wrap" tabindex="0" role="region" aria-label="${ru ? 'Таблица — ' : 'Table — '}${esc(L(C.tech.title))}"><table><thead><tr>${C.tech.head[lang].map((x) => `<th scope="col">${esc(x)}</th>`).join('')}</tr></thead><tbody>
      ${C.tech.rows.map((r) => { const H = C.tech.head[lang]; return `<tr><th scope="row">${R(r.method)}${r.note ? `<span class="tnote">${R(r.note)}</span>` : ''}</th><td data-label="${esc(H[1])}">${R(r.breaks)}</td><td data-label="${esc(H[2])}">${R(r.yields)}</td><td data-label="${esc(H[3])}"${r.gap ? ' class="gap"' : ''}>${R(r.measured)}</td></tr>`; }).join('')}
    </tbody></table></div>
    <p class="foot">${R(C.tech.foot)}</p>
  </div></section>

  <section class="sec" id="products" aria-labelledby="prod-h"><div class="wrap">
    <h2 id="prod-h">${R(C.products.title)}</h2><p class="intro">${R(C.products.intro)}</p>
    <div class="cards">${C.products.items.map((p) => `<article class="card${p.status === 'unconfirmed' ? ' unc' : ''}"><h3>${R(p.name)}</h3><p class="kind">${R(p.kind)}</p>${rows(p.rows)}</article>`).join('')}</div>
    <div class="common"><h3>${R(C.products.common_title)}</h3>${rows(C.products.common)}</div>
  </div></section>

  <section class="sec" id="propio" aria-labelledby="propio-h"><div class="wrap">
    <h2 id="propio-h">${R(C.propio.title)}</h2><p class="intro">${R(C.propio.intro)}</p>
    <ul class="facts">${listItems(C.propio.facts)}</ul>
    <div class="split">
      <div><h3 class="sub-h">${R(C.propio.measured_title)}</h3>${rows(C.propio.measured)}</div>
      <div><h3 class="sub-h">${R(C.propio.rarity_title)}</h3><p class="intro">${R(C.propio.rarity_intro)}</p></div>
    </div>
    <div class="tbl-wrap" tabindex="0" role="region" aria-label="${ru ? 'Таблица — ' : 'Table — '}${esc(L(C.propio.rarity_title))}"><table><thead><tr>${C.propio.rarity_head[lang].map((x) => `<th scope="col">${esc(x)}</th>`).join('')}</tr></thead>
      <tbody><tr><td colspan="${C.propio.rarity_head[lang].length}" class="empty">${R(C.propio.rarity_empty)}</td></tr></tbody></table></div>
  </div></section>

  <section class="sec" id="buyers" aria-labelledby="buyers-h"><div class="wrap">
    <h2 id="buyers-h">${R(C.buyers.brands.title)}</h2>${qas(C.buyers.brands.items)}
    <h2 style="margin-top:40px">${R(C.buyers.distributors.title)}</h2>${qas(C.buyers.distributors.items)}
    <div class="docs"><h3>${esc(C.buyers.docs[lang].title)}</h3><ul>${C.buyers.docs[lang].items.map((x) => (lint(`buyers.docs.${lang}`, x), `<li>${esc(x)}</li>`)).join('')}</ul></div>
  </div></section>

  <section class="sec" id="evidence" aria-labelledby="ev-h"><div class="wrap">
    <h2 id="ev-h">${R(C.evidence.title)}</h2><p class="intro">${R(C.evidence.intro)}</p>
    <div class="cols3">${C.evidence.cols.map((c) => `<div class="col"><h3>${R(c.title)}</h3><p class="lead">${R(c.lead)}</p>${c.items ? `<ul>${listItems(c.items)}</ul>` : ''}${c.note ? `<p class="note">${R(c.note)}</p>` : ''}</div>`).join('')}</div>
  </div></section>

  <section class="sec" id="director" aria-labelledby="dir-h"><div class="wrap">
    <h2 id="dir-h">${R(C.director.title)}</h2>
    <ol class="steps">${C.director.steps[lang].map((s) => (lint(`director.steps.${lang}`, s), `<li>${esc(s)}</li>`)).join('')}</ol>
    <div class="tbl-wrap" tabindex="0" role="region" aria-label="${ru ? 'Таблица — ' : 'Table — '}${esc(L(C.director.title))}"><table><thead><tr>${C.director.table_head[lang].map((x) => `<th scope="col">${esc(x)}</th>`).join('')}</tr></thead><tbody>
      ${C.director.table.map((id) => { const c = claims.get(id); const H = C.director.table_head[lang]; return `<tr><td>${R(`{{${id}}}`)}</td><td data-label="${esc(H[1])}">${classLabel[c.data_class]}</td><td data-label="${esc(H[2])}"><span data-allow>${srcLabel(c)}</span></td><td data-label="${esc(H[3])}">${discEn(disc(c))}</td><td data-label="${esc(H[4])}" class="chk${c.data_class === 'synthetic' ? ' no' : ''}">${c.data_class === 'synthetic' ? (ru ? 'запрещено' : 'blocked') : '☐'}</td></tr>`; }).join('')}
    </tbody></table></div>
    <h3 class="sub-h" style="margin-top:30px">${R(C.director.status_title)}</h3>
    <ul class="status">${listItems(C.director.status)}</ul>
    <p class="sign">${R(C.director.sign)}</p>
  </div></section>

  <section class="sec" id="request" aria-labelledby="req-h"><div class="wrap">
    <h2 id="req-h">${R(C.request.title)}</h2><p class="intro">${R(C.request.intro)}</p>
    <form class="form" onsubmit="return false" novalidate>
      ${C.request.fields.map((f) => {
        const id = `f-${f.name}`; const req = f.req ? ' required' : ''; const ac = f.ac ? ` autocomplete="${f.ac}"` : '';
        if (f.type === 'select') return `<div class="field"><label for="${id}">${R(f)}</label><select id="${id}" name="${f.name}"${req}><option value="">—</option>${f.options[lang].map((o) => `<option>${esc(o)}</option>`).join('')}</select></div>`;
        if (f.type === 'checks') return `<fieldset class="field"><legend>${R(f)}</legend>${f.options[lang].map((o, i) => `<label class="check"><input type="checkbox" name="${f.name}" value="${esc(o)}" id="${id}-${String.fromCharCode(97 + i)}">${esc(o)}</label>`).join('')}</fieldset>`;
        if (f.type === 'textarea') return `<div class="field"><label for="${id}">${R(f)}</label><textarea id="${id}" name="${f.name}" rows="4"></textarea></div>`;
        return `<div class="field"><label for="${id}">${R(f)}</label><input id="${id}" name="${f.name}" type="${f.type}"${req}${ac}></div>`;
      }).join('\n      ')}
      <label class="check"><input type="checkbox" name="consent" required>${R(C.request.consent)}</label>
      <button class="key" type="submit">${R(C.request.submit)}</button>
      <p class="fnote">${R(C.request.note)}</p>
    </form>
  </div></section>

  <section class="sec" aria-labelledby="refs-h"><div class="wrap">
    <h2 id="refs-h">${R(C.refs_title)}</h2>
    <ol class="refs">__REFS__</ol>
  </div></section>
</main>
<footer class="end"><div class="wrap">${R(h.caption)}</div></footer>`;

  const refs = refOrder.map((id, i) => { const r = C.references[id]; return `<li id="ref-${i + 1}" class="c c-ref" data-ref="${id}">${esc(r.cite)} DOI: <a href="https://doi.org/${r.doi}">${r.doi}</a></li>`; }).join('');
  const css = FONT_CSS + fs.readFileSync(path.join(ROOT, 'demo', 'site.css'), 'utf8');
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(L(C.meta.title))}</title>
<meta name="description" content="${esc(L(C.meta.description))}">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#07080a">
<link rel="icon" href="data:,">
<link rel="preload" href="fonts/inter-cyrillic-600-normal.woff2" as="font" type="font/woff2" crossorigin>
<style>${css}</style>
</head>
<body>${body.replace('__REFS__', refs)}
</body>
</html>
`;
}

for (const c of reg.claims) if (c.data_class && (String(c.id).match(/^[LPS]-/))) validateClaim(c);
const html = { ru: page('ru'), en: page('en') };
for (const id of used) { const c = claims.get(id); if (c && !String(id).match(/^[LPS]-/)) validateClaim(c); }

if (errors.length) {
  console.error(`\nДЕМО-СБОРКА ОСТАНОВЛЕНА (${RELEASE ? 'чистовая' : 'демо'}): ${errors.length} ошибок`);
  for (const e of [...new Set(errors)]) console.error('  ✗ ' + e);
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, 'fonts'), { recursive: true });
for (const f of FONTS) fs.copyFileSync(f, path.join(OUT, 'fonts', path.basename(f)));
fs.writeFileSync(path.join(OUT, 'index.html'), html.ru);
fs.writeFileSync(path.join(OUT, 'en.html'), html.en);
const byClass = {};
for (const id of used) { const k = claims.get(id).data_class; byClass[k] = (byClass[k] || 0) + 1; }
fs.writeFileSync(path.join(OUT, 'build-report.json'), JSON.stringify({ mode: RELEASE ? 'release' : 'demo', claims_used: used.size, by_class: byClass }, null, 2));
console.log(`Готово (${RELEASE ? 'чистовая' : 'демо'}): demo/dist/index.html, demo/dist/en.html`);
console.log(`Утверждений на страницах: ${used.size}`, byClass);
