"""Кейс «было = стало» для акционеров: модель до начала работ (методика Proba Lab, адаптирована к B2B).

Один источник цифр: допущения ниже → расчёт → docs/shareholders-case.md и .html.
    python3 -I docs/case.py
"""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
N = 100          # первых B2B-покупателей за период
PERIOD = "12 месяцев"
CHECK = 150_000  # ₽ за заказ — пример, не данные клиента

# Все допущения — [предположение]: данных завода нет.
SCEN = {
    "Осторожно": dict(base=0.30, rep_base=0.40, ref=0.03, new=3),
    "База":      dict(base=0.50, rep_base=0.50, ref=0.05, new=6),
    "Хорошо":    dict(base=0.70, rep_base=0.60, ref=0.08, new=10),
}
REP_WITHOUT = 0.30  # повторы без нас — одинаково во всех сценариях и в «было»


def calc(s):
    in_base = N * s["base"]
    rep_from_base = in_base * s["rep_base"]
    rep_outside = (N - in_base) * REP_WITHOUT
    after = rep_from_base + rep_outside
    before = N * REP_WITHOUT
    growth = after / before - 1
    by_ref = in_base * s["ref"]
    extra = (after - before) + by_ref + s["new"]
    return dict(in_base=in_base, rep_from_base=rep_from_base, rep_outside=rep_outside, after=after,
                before=before, growth=growth, by_ref=by_ref, new=s["new"], extra=extra, money=extra * CHECK)


R = {k: calc(v) for k, v in SCEN.items()}
b = R["База"]
# ручная проверка базового сценария
assert abs(b["in_base"] - 50) < 1e-9 and abs(b["rep_from_base"] - 25) < 1e-9 and abs(b["rep_outside"] - 15) < 1e-9
assert abs(b["after"] - 40) < 1e-9 and abs(b["before"] - 30) < 1e-9 and abs(b["by_ref"] - 2.5) < 1e-9
assert abs(b["extra"] - 18.5) < 1e-9


def n(x, d=1):
    s = f"{x:,.{d}f}".replace(",", " ").replace(".", ",")
    return s[:-2] if d and s.endswith(",0") else s


def pct(x):
    return f"{round(x * 100):d} %"


def rub(x):
    return n(round(x), 0) + " ₽"


cols = list(SCEN)
assume = "\n".join([
    "| Допущение | Пометка | " + " | ".join(cols) + " |",
    "|---|---|" + "---|" * len(cols),
    "| Подключились к сопровождению (доля «в базе») | [предположение] | " + " | ".join(pct(SCEN[c]["base"]) for c in cols) + " |",
    f"| Повторная закупка без нас | [предположение]; заменить данными завода | " + " | ".join(pct(REP_WITHOUT) for _ in cols) + " |",
    "| Повторная закупка из базы | [предположение] | " + " | ".join(pct(SCEN[c]["rep_base"]) for c in cols) + " |",
    "| Порекомендовали другой компании | [предположение] | " + " | ".join(pct(SCEN[c]["ref"]) for c in cols) + " |",
    f"| Новые покупатели из каналов (на {N}) | [предположение] | " + " | ".join(str(SCEN[c]["new"]) for c in cols) + " |",
])
res = "\n".join([
    f"| На {N} первых покупателей за {PERIOD} | Было | " + " | ".join(cols) + " |",
    "|---|---|" + "---|" * len(cols),
    "| В программе сопровождения | 0 | " + " | ".join(n(R[c]["in_base"]) for c in cols) + " |",
    f"| Повторные закупки | {n(b['before'])} | " + " | ".join(n(R[c]["after"]) for c in cols) + " |",
    "| Рост повторных закупок | — | " + " | ".join(pct(R[c]["growth"]) for c in cols) + " |",
    "| По рекомендации | 0 | " + " | ".join(n(R[c]["by_ref"]) for c in cols) + " |",
    "| Новые из каналов | 0 | " + " | ".join(n(R[c]["new"]) for c in cols) + " |",
    "| **Дополнительные закупки** | — | " + " | ".join(f"**{n(R[c]['extra'])}**" for c in cols) + " |",
    f"| Дополнительная выручка при заказе {n(CHECK, 0)} ₽ [пример, не данные клиента] | — | " + " | ".join(rub(R[c]["money"]) for c in cols) + " |",
])
howto = (f"**Как считали базу:** в базе = {N} × 50 % = 50; повторы из базы = 50 × 50 % = 25; повторы вне базы = "
         f"(100 − 50) × 30 % = 15; стало = 25 + 15 = 40; было = 100 × 30 % = 30; рост = 40 / 30 − 1 = 33 %; "
         f"по рекомендации = 50 × 5 % = 2,5; дополнительные закупки = (40 − 30) + 2,5 + 6 = 18,5; "
         f"выручка = 18,5 × 150 000 ₽ = {rub(b['money'])}.")

md = Path(ROOT / "case_template.md").read_text(encoding="utf-8")
md = md.replace("{{ASSUMPTIONS}}", assume).replace("{{RESULTS}}", res).replace("{{HOWTO}}", howto)
md = md.replace("{{BASE_EXTRA}}", n(b["extra"])).replace("{{BASE_MONEY}}", rub(b["money"]))
md = md.replace("{{CAUTIOUS_EXTRA}}", n(R["Осторожно"]["extra"])).replace("{{GOOD_EXTRA}}", n(R["Хорошо"]["extra"]))
md = md.replace("{{BASE_GROWTH}}", pct(b["growth"]))
assert "{{" not in md, "не все поля шаблона заполнены"
out = ROOT / "shareholders-case.md"
out.write_text(md, encoding="utf-8")
subprocess.run(["pandoc", str(out), "-s", "--metadata", "title=Лизаты: было и стало — модель до начала работ",
                "--metadata", "lang=ru", "-c", "case.css", "--embed-resources", "-o", str(ROOT / "shareholders-case.html")],
               check=True, cwd=ROOT)
for k, v in R.items():
    print(f"{k:10} в базе {n(v['in_base'])}  стало {n(v['after'])}  было {n(v['before'])}  рост {pct(v['growth'])}  "
          f"рек {n(v['by_ref'])}  новые {v['new']}  доп {n(v['extra'])}  {rub(v['money'])}")
