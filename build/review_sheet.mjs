// Генерирует review_plant.md из claims.yaml и content.yaml — лист для подписи технологом завода.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { claims, meta } = yaml.load(fs.readFileSync(path.join(ROOT, 'claims.yaml'), 'utf8'));
const content = yaml.load(fs.readFileSync(path.join(ROOT, 'content.yaml'), 'utf8'));
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|');
const src = (c) => (c.source?.file ? `inputs/${c.source.file}, с. ${c.source.page}` : '—');

const rows = claims.map((c) => `| ${c.id} | ${cell(c.text)} | ${cell(src(c))} | ${c.status} | ${c.gap || ''} | ☐ верно ☐ исправить | |`).join('\n');
const copy = content.limitations.items.map((it) => `| ${cell(it.title)} | ${cell(it.text)} | ☐ верно ☐ исправить | |`).join('\n');

const out = `# Лист проверки для технолога завода

Материал: лендинг и PDF-брошюра «${content.meta.title}». Версия ${content.meta.version_date}.
Реестр утверждений от ${meta.updated}. Файл собран автоматически из \`claims.yaml\` — не редактируйте вручную,
запустите \`node build/review_sheet.mjs\`.

**Как заполнять.** В каждой строке отметьте «верно» или «исправить» и впишите правильную формулировку и документ
(название файла, раздел, страница). На странице появится только то, что отмечено «верно» и имеет документ.
Квадратные скобки «[...]» — место для данных из документа.

## 1. Факты

| id | Утверждение (так будет на странице) | Источник (файл, стр.) | Статус | Запрос | Проверка | Правильная формулировка / документ |
|---|---|---|---|---|---|---|
${rows}

## 2. Пояснительный текст, который тоже требует согласия технолога

Это не факты о продукте, но технолог должен подтвердить, что текст не вводит в заблуждение.

| Блок | Текст | Проверка | Комментарий |
|---|---|---|---|
${copy}

## 3. Согласие на публикацию

☐ Перечисленные утверждения, отмеченные «верно», можно публиковать в открытых материалах для дистрибьюторов
и производителей БАД.

Должность, ФИО: ______________________  Подпись: ____________  Дата: ____________
`;
fs.writeFileSync(path.join(ROOT, 'review_plant.md'), out);
console.log(`review_plant.md: ${claims.length} утверждений, ${content.limitations.items.length} пояснений`);
