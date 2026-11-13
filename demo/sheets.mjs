// Генерирует листы внешней проверки из claims.yaml и demo/content.yaml:
//   demo/review_director.md      — «утверждение — источник» для директора по науке
//   demo/reviewer_references.md  — ссылки для стороннего рецензента
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reg = yaml.load(fs.readFileSync(path.join(ROOT, 'claims.yaml'), 'utf8'));
const raw = fs.readFileSync(path.join(ROOT, 'demo/content.yaml'), 'utf8');
const C = yaml.load(raw);
const doi = JSON.parse(fs.readFileSync(path.join(ROOT, 'inputs/literature/doi_check_2026-11-12.json'), 'utf8')).items;
const ids = new Set([...raw.matchAll(/\{\{([A-Z0-9-]+)\}\}/g)].map((m) => m[1]).concat(C.director.table));
const used = reg.claims.filter((c) => ids.has(c.id));
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const order = { 'plant-document': 0, literature: 1, synthetic: 2 };
used.sort((a, b) => order[a.data_class] - order[b.data_class] || a.id.localeCompare(b.id));
const pmid = (f) => (fs.readFileSync(path.join(ROOT, 'inputs', f), 'utf8').match(/PMID:\s*(\d+)/) || [])[1] || '—';

const head = (t) => `# ${t}\n\nМатериал: демо-лендинг «${C.meta.title.ru}», ${C.meta.version}, ${C.meta.date}. Собрано из \`claims.yaml\` командой \`node demo/sheets.mjs\` — не правьте вручную.\n`;

// ---------- лист директора ----------
let d = head('Лист проверки для директора по науке: утверждение — источник');
d += `
**Как заполнять.** В каждой строке отметьте «верно» или «исправить», при необходимости впишите правильную формулировку
и назначьте уровень раскрытия: **О** — открыто, **З** — клиенту по запросу, **NDA** — только под соглашение.
Синтетические значения (класс S) заполнять не нужно: в чистовую сборку они не попадут. Вместо них нужны настоящие данные
из спецификации, CoA или протокола — впишите документ в последнюю колонку.

Подпись под этим листом не требуется и не ставится, пока материал — демо.
`;
const sections = [['plant-document', 'Документы и публичные заявления завода'], ['literature', 'Литература'], ['synthetic', 'Синтетика — заменить настоящими данными']];
for (const [cls, title] of sections) {
  const rows = used.filter((c) => c.data_class === cls);
  d += `\n## ${title} (${rows.length})\n\n`;
  if (cls === 'synthetic') {
    d += '| id | Значение на странице | Каким документом заменить | Раскрытие О / З / NDA |\n|---|---|---|---|\n';
    for (const c of rows) d += `| ${c.id} | ${cell(c.text.ru)} | | |\n`;
  } else {
    d += '| id | Утверждение (как на странице) | Источник: файл, место, цитата | Доказательность | Предл. раскрытие | Верно / исправить | Правильная формулировка |\n|---|---|---|---|---|---|---|\n';
    for (const c of rows) {
      const src = cls === 'literature' ? `${C.references[c.ref].cite} DOI ${C.references[c.ref].doi}. Цитата: «${c.source.quote}»` : `inputs/${c.source.file}, ${c.source.page}. Цитата: «${c.source.quote}»`;
      d += `| ${c.id} | ${cell(c.text.ru)} | ${cell(src)} | ${c.evidence}${c.evidence_note ? ` (${c.evidence_note})` : ''} | ${c.disclosure || 'О'} | ☐ ☐ | |\n`;
    }
  }
}
d += `\n## Пробелы, которые заполняет только директор\n\n- Чем измеряется результат ферментативного гидролиза на заводе (раздел «Технология», строка 1).\n- Протеолиз как способ лизиса: опубликованного источника не найдено (строка 3).\n- Что такое Cavitol, ProteoLyse и «ФерЛиз Про»: на сайте завода их нет, карточки целиком синтетические.\n- Сохраняются ли в лизате B12, DHNA и пропионовая кислота — данных нет.\n`;
fs.writeFileSync(path.join(ROOT, 'demo/review_director.md'), d);

// ---------- лист рецензента ----------
let r = head('Список ссылок для стороннего рецензента');
r += `
**Задача рецензента.** Для каждой ссылки открыть полный текст и подтвердить, что фраза на странице верно передаёт источник
и не расширяет его (например, не переносит данные о штамме на вид или с культуры на лизат). Сборка уже проверила, что цитата
есть в аннотации PubMed и что DOI разрешается; полный текст не сверялся.

| Ссылка | DOI · PMID | Проверка DOI | Утверждение на странице (ru) | Цитата из аннотации | Уровень | Вывод рецензента |
|---|---|---|---|---|---|---|
`;
for (const [id, ref] of Object.entries(C.references)) {
  const cs = used.filter((c) => c.ref === id);
  for (const c of cs) {
    const dr = doi[ref.doi];
    r += `| ${cell(ref.cite)} | ${ref.doi} · ${c.source.file.endsWith('.txt') && c.source.file.includes('abstracts') ? pmid(c.source.file) : '—'} | ${dr?.resolves ? `doi.org ${dr.doi_org_http} → ${cell(dr.doi_org_location)}` : 'нет'} | ${cell(c.text.ru)} | «${cell(c.source.quote)}» | ${c.evidence}${c.evidence_note ? ` — ${c.evidence_note}` : ''} | ☐ верно ☐ неточно |\n`;
  }
}
r += `\n**Особые места:**\n\n- REF-DISPUTE — письмо без аннотации: проверено только название; сам аргумент на странице не пересказывается.\n- REF-QPS — проверено по таблице EFSA (Appendix E, лист «QPS List»), а не по аннотации.\n- REF-BALA — данные получены на E. coli; на странице это указано. Перенос на пробиотические бактерии не делается.\n- REF-ISAWA — 10 мг/л относится к культуральной жидкости штамма ET-3, а не к лизату.\n`;
fs.writeFileSync(path.join(ROOT, 'demo/reviewer_references.md'), r);
console.log(`review_director.md: ${used.length} утверждений; reviewer_references.md: ${Object.keys(C.references).length} ссылок`);
