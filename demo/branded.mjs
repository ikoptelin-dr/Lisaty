// Пост-обработка demo/dist/*-standalone.html:
//   1) верхняя плашка (логотип или нейтральная надпись) + кнопка «Связаться с нами» с телефоном;
//   2) блок «Связаться с нами» перед формой запроса;
//   3) нижней плашки нет.
// Результат:
//   demo/dist/index-branded.html, en-branded.html — с логотипом АО «Вектор-БиАльгам» (файл для директора по науке);
//   demo/publish/index.html, en.html              — нейтральная версия для приватной ссылки (без логотипа и имени завода);
//                                                   index.html без doctype/html/head/body — их добавляет публикация.
// Запуск: node demo/build.mjs && (собрать standalone) && node demo/branded.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'demo/dist');
const PUB = path.join(ROOT, 'demo/publish');
const PHONE = { tel: '+79994662278', show: '+7 999 466-22-78' };
const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'demo/assets/logo-vector-bialgam.png')).toString('base64');

const T = {
  ru: { call: 'Связаться с нами', title: 'Связаться с нами', text: 'Позвоните: обсудим материал и сроки.', neutral: 'Демо-макет', alt: 'Вектор-БиАльгам', callAria: 'Позвонить' },
  en: { call: 'Contact us', title: 'Contact us', text: 'Call us to discuss the material and the timeline.', neutral: 'Demo mock-up', alt: 'Vector-BiAlgam', callAria: 'Call' },
};

const CSS = `
.topbar{position:fixed;top:0;left:0;right:0;z-index:30;height:68px;display:flex;align-items:center;justify-content:space-between;gap:12px;
  padding:0 max(16px,env(safe-area-inset-right,0px)) 0 max(16px,env(safe-area-inset-left,0px));background:#fff;border-bottom:1px solid #e4e1da;color:#1a1a1a}
.tb-brand{display:flex;align-items:center;min-width:0;text-decoration:none;color:#1a1a1a;font:600 15px var(--sans)}
.tb-brand img{display:block;height:48px;width:auto}
.tb-call{display:inline-flex;align-items:center;gap:10px;flex:none;text-decoration:none;color:#1a0d06;font:600 14px var(--sans);padding:8px 14px;border-radius:999px;
  background:linear-gradient(92deg,#ffb347,#ff6b4a 55%,#ff4a40);box-shadow:0 6px 18px -6px rgba(255,47,58,.6)}
.tb-call small{display:none;font:500 12px var(--sans);opacity:.85}
.tb-call svg{flex:none}
.nav{top:80px}
.hero{padding-top:164px}
.contact-strip{padding:40px 0;border-top:1px solid var(--line);background:linear-gradient(180deg,rgba(255,47,58,.10),rgba(255,107,74,.04))}
.cs-in{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px}
.cs-in h2{margin:0 0 4px;font-size:24px}
.cs-in p{margin:0;color:var(--soft)}
.cs-num{display:inline-flex;align-items:center;gap:10px;text-decoration:none;color:#1a0d06;font:600 20px var(--sans);padding:12px 20px;border-radius:999px;min-height:48px;
  background:linear-gradient(92deg,#ffb347,#ff6b4a 55%,#ff4a40);box-shadow:0 10px 26px -8px rgba(255,47,58,.65)}
@media (min-width:560px){.tb-call small{display:inline}}
@media (min-width:720px){.hero{padding-top:196px}.tb-brand img{height:52px}}
`;
const PHONE_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>';

function transform(src, lang, mode) {
  const t = T[lang];
  let h = fs.readFileSync(src, 'utf8');
  const other = lang === 'ru' ? 'en-standalone.html' : 'index-standalone.html';
  const otherNew = mode === 'branded' ? (lang === 'ru' ? 'en-branded.html' : 'index-branded.html') : (lang === 'ru' ? 'en.html' : 'index.html');
  h = h.split(`href="${other}"`).join(`href="${otherNew}"`);
  const brand = mode === 'branded'
    ? `<a class="tb-brand" href="#top" aria-label="${t.alt}"><img src="${logo}" alt="${t.alt}" width="133" height="48"></a>`
    : `<a class="tb-brand" href="#top">${t.neutral}</a>`;
  if (mode !== 'branded') {
    // имя завода в навигации и в футере панели заменяем нейтральной надписью
    const name = lang === 'ru' ? 'Вектор-БиАльгам' : 'Vector-BiAlgam';
    h = h.split(`<span>${name}</span>`).join(`<span>${t.neutral}</span>`);
  }
  const bar = `<div class="topbar">${brand}<a class="tb-call" href="tel:${PHONE.tel}" aria-label="${t.callAria} ${PHONE.show}">${PHONE_ICON}<small>${t.call}</small><span>${PHONE.show}</span></a></div>`;
  const strip = `<section class="contact-strip" id="contact"><div class="wrap cs-in"><div><h2>${t.title}</h2><p>${t.text}</p></div><a class="cs-num" href="tel:${PHONE.tel}">${PHONE_ICON}<span>${PHONE.show}</span></a></div></section>`;
  h = h.replace('</style>', CSS + '</style>');
  h = h.replace(/<body>/, '<body>' + bar);
  const marker = '<section class="sec" id="request"';
  if (!h.includes(marker)) throw new Error('не найден блок #request');
  h = h.replace(marker, strip + marker);
  return h;
}

fs.mkdirSync(PUB, { recursive: true });
for (const [file, lang] of [['index', 'ru'], ['en', 'en']]) {
  const src = path.join(DIST, `${file}-standalone.html`);
  fs.writeFileSync(path.join(DIST, `${file}-branded.html`), transform(src, lang, 'branded'));
  const neutral = transform(src, lang, 'neutral');
  if (file === 'en') fs.writeFileSync(path.join(PUB, 'en.html'), neutral);
  else {
    const title = neutral.match(/<title>[^<]*<\/title>/)[0];
    const style = neutral.match(/<style>[\s\S]*?<\/style>/)[0];
    const body = neutral.match(/<body>([\s\S]*)<\/body>/)[1];
    fs.writeFileSync(path.join(PUB, 'index.html'), `${title}\n<meta name="robots" content="noindex, nofollow">\n${style}\n${body}`);
  }
}
console.log('готово: demo/dist/{index,en}-branded.html, demo/publish/{index,en}.html');
