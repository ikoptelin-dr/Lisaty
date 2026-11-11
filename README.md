# Бактериальные лизаты — лендинг и PDF для B2B

Один источник текста (`content.yaml`) и один реестр фактов (`claims.yaml`) → лендинг `dist/index.html`
и брошюра `dist/brochure.pdf`. Факт без документа на страницу не попадает.

Состояние и выводы — в [REPORT.md](REPORT.md). Вопросы к заводу — в [gaps.md](gaps.md).

## Сборка

```bash
npm install
```

```bash
node build/build.mjs            # чистовая: падает, если есть неподтверждённые факты или пустые контакты
```

```bash
node build/build.mjs --draft    # черновик: «по запросу» вместо неподтверждённых фактов
```

```bash
node build/check_numbers.mjs    # сверка чисел HTML ↔ PDF и утечек
```

```bash
node build/lighthouse.mjs       # Lighthouse, мобильный профиль
```

```bash
node build/review_sheet.mjs     # пересобрать review_plant.md из реестра
```

Нужны Node 20+, Playwright с Chromium и `pdfinfo`/`pdftotext` (poppler-utils).

## Как добавить подтверждённый факт

1. Положить документ в `inputs/`.
2. В `claims.yaml` у нужного id указать `source: { file: "имя.pdf", page: N }` и `status: "подтверждено"`.
   Поправить `text` дословно по документу.
3. Пересобрать. Факт появится везде, где на него ссылается `content.yaml`.
