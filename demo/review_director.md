# Лист проверки для директора по науке: утверждение — источник

Материал: демо-лендинг «Лизаты пробиотических бактерий», v0.3-demo, 12.11.2026. Собрано из `claims.yaml` командой `node demo/sheets.mjs` — не правьте вручную.

**Как заполнять.** В каждой строке отметьте «верно» или «исправить», при необходимости впишите правильную формулировку
и назначьте уровень раскрытия: **О** — открыто, **З** — клиенту по запросу, **NDA** — только под соглашение.
Синтетические значения (класс S) заполнять не нужно: в чистовую сборку они не попадут. Вместо них нужны настоящие данные
из спецификации, CoA или протокола — впишите документ в последнюю колонку.

Подпись под этим листом не требуется и не ставится, пока материал — демо.

## Документы и публичные заявления завода (13)

| id | Утверждение (как на странице) | Источник: файл, место, цитата | Доказательность | Предл. раскрытие | Верно / исправить | Правильная формулировка |
|---|---|---|---|---|---|---|
| P-BIF-SP | 6 штаммов: Bifidobacterium longum, B. bifidum, B. adolescentis | inputs/text/ingredients_lizaty.txt, сайт, «Лизаты». Цитата: «Состоит из 6 штаммов бифидобактерий видов: Bifidobacterium longum, Bifidobacterium bifidum, Bifidobacterium adolescentis.» | нет данных | О | ☐ ☐ | |
| P-CATEGORY | Сырьё продовольственное для изготовления БАД и пищевой продукции (декларация ЕАЭС) | inputs/text/decl_lizaty_2019_transcription.txt, расшифровка, «заявляет что». Цитата: «Сырьё продовольственное (пищевое) для изготовления биологически активных добавок к пище, пищевой продукции» | нет данных | О | ☐ ☐ | |
| P-COMP | Молочная сыворотка, гидролизат клеточной стенки бактерий, моноглицериды | inputs/text/ingredients_lizaty.txt, сайт, «Лизаты». Цитата: «Состав: молочная сыворотка, гидролизат клеточной стенки бифидобактерий, лактобактерий или молочнокислых бактерий, моноглицериды.» | нет данных | О | ☐ ☐ | |
| P-DECL-VALID | Декларация ЕАЭС на сайте действовала по 19.02.2022 — нужна действующая | inputs/text/decl_lizaty_2019_transcription.txt, расшифровка. Цитата: «действительна с даты регистрации по 19.02.2022 включительно» | нет данных | З | ☐ ☐ | |
| P-DEF | Продукт распада клеточных стенок бифидобактерий, лактобактерий или пропионовокислых бактерий и продукты их метаболизма в молочной сыворотке | inputs/text/ingredients_lizaty.txt, сайт, «Лизаты». Цитата: «а также продукты их метаболизма в молочной сыворотке» | нет данных | О | ☐ ☐ | |
| P-DOSE | Норма ввода в пищевые продукты — 0,1–5 % от объёма (по данным сайта) | inputs/text/lizaty_lizaty-v-produktakh-pitaniya.txt, сайт, «Лизаты в продуктах питания». Цитата: «ввод лизатов составляет 0,1-5% от общего объема» | нет данных | О | ☐ ☐ | |
| P-GMP-VALID | Сертификат SGS (GMP по Codex) действовал до 14.05.2024; в области — БАД, закваски и кисломолочные продукты, лизаты не названы | inputs/text/gmp_probiotiki.txt, сертификат. Цитата: «Настоящий сертификат действителен с 15 мая 2019 г. по 14 мая 2024 г.» | нет данных | З | ☐ ☐ | |
| P-LAK-SP | 6–8 штаммов: L. acidophilus, L. fermentum, L. bulgaricus, S. thermophilus (названия — как на сайте) | inputs/text/ingredients_lizaty.txt, сайт, «Лизаты». Цитата: «Содержит от 6 до 8 штаммов лактобактерий видов: Lactobacillus acidophilus, Lactobacillus fermentum, Lactobacillus bulgaricus, Str. thermophilus.» | нет данных | О | ☐ ☐ | |
| P-PRO-SP | 2 штамма «Propionibacterium shermani» (написание сайта; современное название — P. freudenreichii) | inputs/text/ingredients_lizaty.txt, сайт, «Лизаты». Цитата: «Содержит 2 штамма пропионовокислых бактерий вида Propionibacterium shermani.» | нет данных | О | ☐ ☐ | |
| P-SITE-MED | На сайте лизаты названы иммуностимуляторами и дана дозировка для детей — для пищевого сырья это недопустимо | inputs/text/lizaty_lizaty-v-badakh-i-preparatakh.txt, сайт, «Лизаты в БАДах». Цитата: «Детям — по 5 капель на 1 прием 3 раза в день, курс приема 21 день.» | нет данных | З | ☐ ☐ | |
| P-SORBIC | Сорбиновая кислота — по желанию заказчика | inputs/text/ingredients_lizaty.txt, сайт, «Лизаты». Цитата: «может использоваться консервант — сорбиновая кислота» | нет данных | О | ☐ ☐ | |
| P-STORAGE | Не выше +25 °C; срок годности 12 месяцев в невскрытой упаковке (декларация 2019 г.) | inputs/text/decl_lizaty_2019_transcription.txt, расшифровка, «Дополнительная информация». Цитата: «Срок годности -12 месяцев от даты изготовления в невскрытой заводской упаковке.» | нет данных | О | ☐ ☐ | |
| P-TECH | Этот способ использует завод | inputs/text/ingredients_lizaty.txt, сайт, «Лизаты». Цитата: «путем ферментативного гидролиза» | нет данных | О | ☐ ☐ | |

## Литература (17)

| id | Утверждение (как на странице) | Источник: файл, место, цитата | Доказательность | Предл. раскрытие | Верно / исправить | Правильная формулировка |
|---|---|---|---|---|---|---|
| L-B12-METHOD | Микробиологический метод дал результаты на 20–40 % выше UHPLC — из-за неактивных для человека аналогов (псевдовитамин B12) | Chamlagain B. et al. In situ production of active vitamin B12 in cereal matrices using Propionibacterium freudenreichii. Food Sci Nutr. 2017. DOI 10.1002/fsn3.528. Цитата: «MBA gave ca. 20%-40% higher results» | in vitro (ферментированные зерновые матрицы) | О | ☐ ☐ | |
| L-CAV-MEAS | Степень разрушения измеряют по растворимому белку, ферментам-маркерам и электрофорезу (SDS-PAGE) | Balasundaram B., Harrison S. T. L. Study of physical and biological factors involved in the disruption of E. coli by hydrodynamic cavitation. Biotechnol Prog. 2006. DOI 10.1021/bp0502173. Цитата: «supported by SDS-PAGE analysis» | in vitro | О | ☐ ☐ | |
| L-CAV-MECH | Механизм разрушения клеток пузырьками кавитации до конца не объяснён | Žlahtič Zupanc M. et al. Effects of cavitation on different microorganisms. Ultrason Sonochem. 2019. DOI 10.1016/j.ultsonch.2019.05.009. Цитата: «What precisely are the mechanisms how bubbles can» | нет данных (обзор) | О | ☐ ☐ | |
| L-CAV-SEL | Гидродинамическая кавитация разрушает клетки частично и избирательно: у E. coli высвободилось 48 % растворимого белка и 88 % периплазматического фермента от максимума | Balasundaram B., Harrison S. T. L. Study of physical and biological factors involved in the disruption of E. coli by hydrodynamic cavitation. Biotechnol Prog. 2006. DOI 10.1021/bp0502173. Цитата: «48% of the total soluble protein, 88% of acid phosphatase» | in vitro (E. coli, не пробиотические бактерии) | О | ☐ ☐ | |
| L-CHOICE | Выбор способа разрушения зависит от состава клеточной стенки, природы целевых молекул, чистоты, масштабируемости и затрат энергии | Gomes T. A. et al. An overview of cell disruption methods for intracellular biomolecules recovery. Prep Biochem Biotechnol. 2020. DOI 10.1080/10826068.2020.1728696. Цитата: «cell wall composition, nature of biomolecule, purity degree, scalability, and energy input» | нет данных (обзор) | О | ☐ ☐ | |
| L-DHNA | Бифидогенный стимулятор роста из культуральной жидкости штамма ET-3 идентифицирован как 1,4-дигидрокси-2-нафтойная кислота (DHNA); около 10 мг/л | Isawa K. et al. Isolation and identification of a new bifidogenic growth stimulator produced by Propionibacterium freudenreichii ET-3. Biosci Biotechnol Biochem. 2002;66(3):679–681. DOI 10.1271/bbb.66.679. Цитата: «Approximately 10 mg/L of DHNA» | in vitro (штамм ET-3, культуральная жидкость) | О | ☐ ☐ | |
| L-DISPUTE | Определение ISAPP оспаривается: группа авторов опубликовала возражение «Postbiotics — when simplification fails to clarify» | Aguilar-Toalá J. E. et al. Postbiotics — when simplification fails to clarify. Nat Rev Gastroenterol Hepatol. 2021;18(11):825–826. DOI 10.1038/s41575-021-00521-6. Цитата: «Postbiotics - when simplification fails to clarify» | нет данных (письмо в редакцию; аннотации нет, проверено название) | О | ☐ ☐ | |
| L-ENZ | Литические ферменты клеточной стенки (классический — лизоцим) применяют для выделения внутриклеточных продуктов бактерий и дрожжей | Salazar O., Asenjo J. A. Enzymatic lysis of microbial cells. Biotechnol Lett. 2007;29(7):985–994. DOI 10.1007/s10529-007-9345-2. Цитата: «recovering of intracellular products from yeast or bacteria» | нет данных (обзор) | О | ☐ ☐ | |
| L-ISAPP-DEF | ISAPP (2021): постбиотик — «препарат неживых микроорганизмов и/или их компонентов, который приносит пользу здоровью хозяина» | Salminen S. et al. The ISAPP consensus statement on the definition and scope of postbiotics. Nat Rev Gastroenterol Hepatol. 2021;18(9):649–667. DOI 10.1038/s41575-021-00440-6. Цитата: «preparation of inanimate microorganisms and/or their components that confers a health benefit on the host» | нет данных (определение консенсусной группы, не данные о действии) | О | ☐ ☐ | |
| L-ISAPP-REQ | По ISAPP, такой препарат должен содержать инактивированные клетки или их компоненты — с метаболитами или без них | Salminen S. et al. The ISAPP consensus statement on the definition and scope of postbiotics. Nat Rev Gastroenterol Hepatol. 2021;18(9):649–667. DOI 10.1038/s41575-021-00440-6. Цитата: «must contain inactivated microbial cells or cell components, with or without metabolites» | нет данных (требование определения) | О | ☐ ☐ | |
| L-LACTO-TAX | В 2020 году род Lactobacillus разделён на 25 родов; L. fermentum теперь Limosilactobacillus fermentum | Zheng J. et al. A taxonomic note on the genus Lactobacillus… Int J Syst Evol Microbiol. 2020;70(4):2782–2858. DOI 10.1099/ijsem.0.004107. Цитата: «25 genera including the emended genus Lactobacillus» | нет данных (таксономия) | О | ☐ ☐ | |
| L-PF-B12ACT | Вид способен синтезировать биологически активную форму витамина B12 | Deptula P. et al. Food-like growth conditions support production of active vitamin B12 by Propionibacterium freudenreichii 2067… Front Microbiol. 2017;8:368. DOI 10.3389/fmicb.2017.00368. Цитата: «able to synthesize biologically active form of the vitamin» | in vitro | О | ☐ ☐ | |
| L-PF-PROP | Главный конечный продукт брожения — пропионовая кислота (цикл Вуда — Веркмана) | Thierry A. et al. New insights into physiology and metabolism of Propionibacterium freudenreichii. Int J Food Microbiol. 2011;149(1):19–27. DOI 10.1016/j.ijfoodmicro.2011.04.026. Цитата: «formation of propionic acid as main fermentation end-product» | нет данных (обзор физиологии) | О | ☐ ☐ | |
| L-PF-SCFA | P. freudenreichii образует короткоцепочечные жирные кислоты (пропионовую и уксусную) и витамин B12 | Deptula P. et al. Food-like growth conditions support production of active vitamin B12 by Propionibacterium freudenreichii 2067… Front Microbiol. 2017;8:368. DOI 10.3389/fmicb.2017.00368. Цитата: «producer of short chain fatty acids (propionic and acetic acids) as well as vitamin B12» | in vitro | О | ☐ ☐ | |
| L-PF-STRAIN | Многие свойства вида сильно зависят от штамма | Thierry A. et al. New insights into physiology and metabolism of Propionibacterium freudenreichii. Int J Food Microbiol. 2011;149(1):19–27. DOI 10.1016/j.ijfoodmicro.2011.04.026. Цитата: «are highly strain-dependent» | нет данных (обзор) | О | ☐ ☐ | |
| L-PF-SUBSP | По геномным данным деление P. freudenreichii на подвиды (в том числе shermanii) не обосновано | Scholz C. F. P., Kilian M. The natural history of cutaneous propionibacteria… Int J Syst Evol Microbiol. 2016;66(11):4422–4432. DOI 10.1099/ijsem.0.001367. Цитата: «subdivision of Propionibacterium freudenreichii into subspecies is not warranted» | нет данных (геномная таксономия) | О | ☐ ☐ | |
| L-QPS | Все виды из состава лизатов, включая Propionibacterium freudenreichii, есть в списке QPS EFSA (17.09.2026) — при условии, что у штаммов нет приобретённых генов устойчивости к клинически значимым антимикробным препаратам | EFSA BIOHAZ Panel. Updated list of QPS-recommended microorganisms for safety risk assessments carried out by EFSA. Zenodo, 17.09.2026. DOI 10.5281/zenodo.22812707. Цитата: «Propionibacterium \| Propionibacterium freudenreichii \| The strains should not harbour any acquired antimicrobial resistance genes to clinically relevant antimicrobials.» | нет данных (регуляторная оценка безопасности вида (ЕС)) | О | ☐ ☐ | |

## Синтетика — заменить настоящими данными (25)

| id | Значение на странице | Каким документом заменить | Раскрытие О / З / NDA |
|---|---|---|---|
| S-B12-PRO | 1,5–3,0 мкг/100 г (UHPLC) | | |
| S-CAV-BASE | лактобактерии, 4 штамма | | |
| S-CAV-TYPE | лизат, кавитационная обработка | | |
| S-COA-1 | 6,8 % · pH 5,3 | | |
| S-COA-2 | 7,1 % · pH 5,4 | | |
| S-COA-3 | 6,9 % · pH 5,2 | | |
| S-DM-BIF | 6,0–8,0 % | | |
| S-DM-LAK | 5,5–7,5 % | | |
| S-DM-PRO | 6,5–8,5 % | | |
| S-FER-DM | сухие вещества 12–15 % | | |
| S-FER-TYPE | ферментативный лизат, концентрат | | |
| S-LEAD | 14 рабочих дней | | |
| S-MICRO-COLI | не допускаются в 0,1 г | | |
| S-MICRO-TAMC | не более 1·10³ КОЕ/г | | |
| S-MICRO-YM | не более 50 КОЕ/г | | |
| S-MOQ | 20 кг | | |
| S-PACK | канистры 5 и 20 л | | |
| S-PH-BIF | 4,6–5,4 | | |
| S-PH-LAK | 4,2–5,0 | | |
| S-PH-PRO | 5,0–5,8 | | |
| S-PROT | не менее 0,8 % | | |
| S-PROT-PEP | пептиды до 5 кДа — не менее 60 % | | |
| S-PROT-TYPE | протеолитический гидролизат биомассы | | |
| S-SAMPLE | 100 мл с CoA партии | | |
| S-VIAB | не обнаружены в 1 г | | |

## Пробелы, которые заполняет только директор

- Чем измеряется результат ферментативного гидролиза на заводе (раздел «Технология», строка 1).
- Протеолиз как способ лизиса: опубликованного источника не найдено (строка 3).
- Что такое Cavitol, ProteoLyse и «ФерЛиз Про»: на сайте завода их нет, карточки целиком синтетические.
- Сохраняются ли в лизате B12, DHNA и пропионовая кислота — данных нет.
