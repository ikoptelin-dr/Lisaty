# Шаг 0: первоисточники — что загрузить

Дата: 12.11.2026. Сеть сессии закрыта: из контейнера и через загрузчик страниц не открываются
bialgam.ru, patents.google.com, jsms.elpub.ru, doi.org, api.crossref.org, PubMed/PMC, eLIBRARY,
ФИПС, ЕГРЮЛ, EFSA. Работал только серверный поиск: он даёт названия и ссылки, но не оригинальный
текст. Поэтому ниже — **зацепки, а не источники**. Ни одна из них не используется на странице,
пока оригинал не лежит в `inputs/`.

Два способа продолжить:
1. Разрешить хосты из списка в конце файла (карточка запроса в сессии), и я скачаю сам.
2. Загрузить файлы в `inputs/` по списку ниже (PDF или сохранённая страница + дата обращения).

## А. Директор по науке и завод

| № | Что загрузить | Зацепка из поиска (не проверено) | Имя файла |
|---|---|---|---|
| A-1 | Список публикаций Молокеева А. В. из eLIBRARY (страница автора, экспорт) | В статье о препарате «ВедаБиотик» (Journal of Siberian Medical Sciences, 2021, № 1, с. 41–54) аффилиация «Вектор-БиАльгам»; по данным поиска — «доктор биологических наук, директор по науке». jsms.elpub.ru/jour/article/view/683 | `elibrary_molokeev_<дата>.pdf` |
| A-2 | Эта статья целиком (PDF) — подтверждает должность и аффилиацию | см. A-1 | `jsms_2021_1_vedabiotik.pdf` |
| A-3 | Патенты с участием Молокеева А. В. (PDF из ФИПС или Google Patents) | RU2165454 (штамм B. bifidum № 791/БАГ; авторы Байбаков В. И., Молокеев А. В., Карих Т. Л., Никулин Л. Г.); RU2169763 (молочная питательная среда для жидкого концентрата бифидобактерий); RU2291194 (консорциум штаммов бифидобактерий); RU2317089, RU2371479 (комплексный пробиотик в иммобилизованной и лиофилизированной форме); RU2142234 (возрастоспецифичные бифидопрепараты). Патента именно на лизат поиск не нашёл | `patent_RU<номер>.pdf` |
| A-4 | Поиск в ФИПС по правообладателю «Вектор-БиАльгам» и словам «лизат», «кавитац», «протеолиз», «пропионовокисл» | — | `fips_search_<дата>.pdf` |
| A-5 | Страница публикаций на сайте завода | bialgam.ru/index.php?id=48 | `bialgam_publications_<дата>.pdf` |
| A-6 | Страницы продуктов на сайте: БифиЛиз, ЛактоЛиз, ПропиоЛиз, Cavitol, ProteoLyse, «ФерЛиз Про» | bialgam.ru | `bialgam_<продукт>_<дата>.pdf` |
| A-7 | Выписка из ЕГРЮЛ на АО «Вектор-БиАльгам» | egrul.nalog.ru (нужна капча — только вручную) | `egrul_<дата>.pdf` |
| A-8 | Документ, связывающий завод с ГНЦ ВБ «Вектор» (учредительные документы, история на сайте, выписка с учредителями) | Поиск: «создана на базе ГНЦ ВБ "Вектор"» — формулировка из СМИ, не документ | `vector_relation_<источник>.pdf` |
| A-9 | Свидетельства на товарные знаки «БифиЛиз», «ЛактоЛиз», «ПропиоЛиз», Cavitol, ProteoLyse, «ФерЛиз Про» (ФИПС, открытые реестры) | не найдено | `tm_<знак>.pdf` |

## Б. Литература (оригиналы с DOI)

| № | Что | Зачем на странице | Зацепка |
|---|---|---|---|
| Б-1 | Salminen S. et al. ISAPP consensus statement on the definition and scope of postbiotics. Nat Rev Gastroenterol Hepatol. 2021;18:649–667 | Определение «постбиотик» и требования к характеристике | Ссылка процитирована в письме Aguilar-Toalá et al., 2021 (найдено через Consensus) |
| Б-2 | Vinderola G. et al. Frequently asked questions about the ISAPP postbiotic definition. Front Microbiol. 2024 | Количественная оценка неживого ингредиента, ожидания по безопасности | Consensus |
| Б-3 | Aguilar-Toalá J. E. et al. Postbiotics — when simplification fails to clarify. Nat Rev Gastroenterol Hepatol. 2021 | Термин спорный — честно показать дискуссию | Consensus |
| Б-4 | Актуальное заявление EFSA BIOHAZ о списке QPS (последнее обновление) с таблицей видов | Статус QPS для P. freudenreichii, бифидобактерий, лактобацилл | Поиск: обновление 2021 года включает P. freudenreichii; для 2023 года таблица не проверена |
| Б-5 | Deptula P. et al. Food-like growth conditions support production of active vitamin B12 by P. freudenreichii 2067… Front Microbiol. 2017 | B12: активная форма, а не псевдовитамин | Consensus |
| Б-6 | Chamlagain B. et al. In situ production of active vitamin B12 in cereal matrices using P. freudenreichii. Food Sci Nutr. 2017 | Как измеряют B12: UHPLC против микробиологического метода | Consensus |
| Б-7 | Работа о DHNA (1,4-дигидрокси-2-нафтойная кислота) у P. freudenreichii — оригинальная статья о выделении | Бифидогенный фактор: механизм | Поиск ограничен лимитом запросов, оригинал не найден |
| Б-8 | Обзор физиологии P. freudenreichii (пропионат, ацетат, цикл Вуда — Веркмана) | Пропионовая кислота как метаболит | Не найден |
| Б-9 | Balasundaram B., Harrison S. T. L. Study of physical and biological factors involved in the disruption of E. coli by hydrodynamic cavitation. Biotechnol Prog. 2006 | Кавитационный лизис: что разрушается и чем измеряется (белок, ферменты-маркеры) | Consensus |
| Б-10 | Žlahtič Zupanc M. et al. Effects of cavitation on different microorganisms… Ultrason Sonochem. 2019 | Механизмы кавитационного разрушения | Consensus |
| Б-11 | Gomes T. A. et al. An overview of cell disruption methods for intracellular biomolecules recovery. Prep Biochem Biotechnol. 2020 | Сравнение способов лизиса | Consensus |
| Б-12 | Обзор ферментативного лизиса клеточной стенки грамположительных бактерий (лизоцим, пептидогликан-гидролазы) | Ферментативный и протеолитический лизис | Не найден |

## В. Спецификации конкурентов (5–7 штук)

Открытых спецификаций поиск не нашёл: поставщики отдают их по запросу. Кандидаты для загрузки:
- спецификации инактивированных / лизатных ингредиентов из лактобацилл и бифидобактерий у 3–4 поставщиков;
- **все найденные ингредиенты на основе Propionibacterium** (это и есть проверка «редкости» для шага 2.4);
- GRAS-уведомления FDA (раздел Specifications) — открытые и с таблицами: найдено уведомление GRN 810 (живой L. paracasei F-19; только как образец формата).

Пока их нет, блок «пропионовокислые лизаты — редкость» на странице остаётся пустым шаблоном.

## Хосты, которые нужно открыть, чтобы я собрал всё сам

bialgam.ru, www.bialgam.ru, patents.google.com, jsms.elpub.ru, doi.org, api.crossref.org,
pubmed.ncbi.nlm.nih.gov, pmc.ncbi.nlm.nih.gov, eutils.ncbi.nlm.nih.gov, www.efsa.europa.eu,
efsa.onlinelibrary.wiley.com, zenodo.org, elibrary.ru, www.elibrary.ru, www1.fips.ru, new.fips.ru,
www.nature.com, www.frontiersin.org, onlinelibrary.wiley.com, www.fda.gov.

ЕГРЮЛ (капча) и eLIBRARY (вход) всё равно потребуют ручной загрузки.
