"""Собирает бриф для директора по науке из brief.yaml:
dist/brief_science_director.docx (для заполнения) и brief_science_director.md (для репозитория).

    python3 -I build/brief.py
"""
from pathlib import Path

import yaml
from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = Path(__file__).resolve().parent.parent
B = yaml.safe_load((ROOT / "brief.yaml").read_text(encoding="utf-8"))

ACCENT = RGBColor(0x1F, 0x4F, 0x43)
MUTED = RGBColor(0x4E, 0x55, 0x52)
COLS = [Cm(1.2), Cm(7.0), Cm(6.2), Cm(2.6)]  # №, вопрос, ответ, публикация


def shade(cell, hex_fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_fill)
    tc_pr.append(shd)


def repeat_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    el = OxmlElement("w:tblHeader")
    el.set(qn("w:val"), "true")
    tr_pr.append(el)


def no_split(row):
    tr_pr = row._tr.get_or_add_trPr()
    tr_pr.append(OxmlElement("w:cantSplit"))


def cell_text(cell, text, bold=False, size=9.5, color=None, italic=False):
    cell.text = ""
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run(text)
    r.bold, r.italic, r.font.size = bold, italic, Pt(size)
    if color is not None:
        r.font.color.rgb = color
    return p


def para(doc, text, size=10.5, bold=False, color=None, italic=False, after=4, style=None):
    p = doc.add_paragraph(style=style)
    p.paragraph_format.space_after = Pt(after)
    r = p.add_run(text)
    r.font.size, r.bold, r.italic = Pt(size), bold, italic
    if color is not None:
        r.font.color.rgb = color
    return p


def heading(doc, text, level=1):
    h = doc.add_heading(text, level=level)
    for r in h.runs:
        r.font.color.rgb = ACCENT
        r.font.name = "Arial"
    return h


def boxed(doc, label, text, fill="FBF6E6"):
    t = doc.add_table(rows=1, cols=1)
    t.style = "Table Grid"
    c = t.rows[0].cells[0]
    shade(c, fill)
    p = c.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run(label + " ")
    r.bold, r.font.size = True, Pt(9.5)
    r2 = p.add_run(text)
    r2.font.size = Pt(9.5)
    doc.add_paragraph().paragraph_format.space_after = Pt(0)


def question_table(doc, groups):
    """groups: list of (group_name or None, [question dicts])"""
    t = doc.add_table(rows=1, cols=4)
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = t.rows[0]
    for c, txt in zip(hdr.cells, ["№", "Вопрос", "Ответ или ссылка на документ (файл, пункт)", "Публикация\nО / З / NDA"]):
        cell_text(c, txt, bold=True, size=8.5, color=MUTED)
        shade(c, "EEF3F0")
    repeat_header(hdr)
    for name, qs in groups:
        if name:
            row = t.add_row()
            merged = row.cells[0].merge(row.cells[3])
            gp = cell_text(merged, name, bold=True, size=9.5, color=ACCENT)
            gp.paragraph_format.keep_with_next = True
            shade(merged, "F6F5F1")
            no_split(row)
        for q in qs:
            row = t.add_row()
            no_split(row)
            cell_text(row.cells[0], q["id"], bold=True, size=9)
            p = cell_text(row.cells[1], q["q"], size=9.5)
            if q.get("hint"):
                r = p.add_run("\n" + q["hint"])
                r.italic, r.font.size = True, Pt(8.5)
                r.font.color.rgb = MUTED
            cell_text(row.cells[2], "")
            cell_text(row.cells[3], "")
    set_widths(t, COLS)
    doc.add_paragraph().paragraph_format.space_after = Pt(0)


def set_widths(t, widths):
    t.autofit = False
    grid = t._tbl.tblGrid
    for gc, w in zip(grid.findall(qn("w:gridCol")), widths):
        gc.set(qn("w:w"), str(int(w.twips)))
    for row in t.rows:
        for c, w in zip(row.cells, widths):
            c.width = w


def build_docx(path):
    doc = Document()
    st = doc.styles["Normal"]
    st.font.name, st.font.size = "Arial", Pt(10.5)
    st.element.rPr.rFonts.set(qn("w:eastAsia"), "Arial")
    sec = doc.sections[0]
    sec.orientation = WD_ORIENT.PORTRAIT
    sec.page_width, sec.page_height = Cm(21), Cm(29.7)
    for side in ("left_margin", "right_margin"):
        setattr(sec, side, Cm(1.8))
    sec.top_margin = sec.bottom_margin = Cm(1.8)
    fp = sec.footer.paragraphs[0]
    fr = fp.add_run(f"{B['title']} · версия {B['version']}")
    fr.font.size, fr.font.color.rgb = Pt(8), MUTED

    t = doc.add_heading(B["title"], level=0)
    for r in t.runs:
        r.font.color.rgb, r.font.name = ACCENT, "Arial"
    para(doc, B["subtitle"], size=12, color=MUTED, after=10)
    for s in B["intro"]:
        para(doc, s)
    heading(doc, "Как заполнять", 2)
    for s in B["how_to"]:
        para(doc, s, style="List Bullet", after=2)

    heading(doc, "Кто заполнил", 2)
    ft = doc.add_table(rows=0, cols=2)
    ft.style = "Table Grid"
    for f in B["filler"]:
        row = ft.add_row()
        cell_text(row.cells[0], f, size=9.5)
    set_widths(ft, [Cm(6), Cm(11)])
    doc.add_paragraph()

    heading(doc, B["common"]["title"], 1)
    question_table(doc, [(None, B["common"]["questions"])])

    card = B["product_card"]
    groups = [(g["name"], g["questions"]) for g in card["groups"]]
    for prod in B["products"]:
        doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
        heading(doc, f"{card['title']}: {prod['name']}", 1)
        boxed(doc, "Что нам известно сейчас:", prod["known"])
        boxed(doc, "На что обратить внимание:", prod["focus"], fill="EEF3F0")
        para(doc, card["note"], size=9, color=MUTED, italic=True)
        question_table(doc, groups)

    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
    na = B["not_asked"]
    heading(doc, na["title"], 1)
    para(doc, na["intro"])
    for s in na["items"]:
        para(doc, s, style="List Bullet", after=2)
    para(doc, na["commercial"], italic=True, color=MUTED, after=10)

    so = B["signoff"]
    heading(doc, so["title"], 1)
    para(doc, so["text"])
    st_ = doc.add_table(rows=0, cols=2)
    st_.style = "Table Grid"
    for f in so["fields"]:
        row = st_.add_row()
        row.height = Cm(1.0)
        cell_text(row.cells[0], f, size=9.5)
    set_widths(st_, [Cm(6), Cm(11)])
    doc.save(path)


def md_cell(s):
    return str(s).replace("|", "\\|").replace("\n", " ")


def build_md(path):
    L = [f"# {B['title']}", "", f"_{B['subtitle']}. Версия {B['version']}._", "",
         "> Этот файл собран из `brief.yaml` командой `python3 -I build/brief.py`. "
         "Для отправки директору по науке используйте `dist/brief_science_director.docx`.", ""]
    L += [s + "\n" for s in B["intro"]]
    L += ["## Как заполнять", ""] + [f"- {s}" for s in B["how_to"]] + [""]
    L += ["## Кто заполнил", ""] + [f"- {s}: ____________" for s in B["filler"]] + [""]

    def table(groups):
        out = ["| № | Вопрос | Ответ или ссылка на документ | Публикация О / З / NDA |", "|---|---|---|---|"]
        for name, qs in groups:
            if name:
                out.append(f"| | **{md_cell(name)}** | | |")
            for q in qs:
                txt = md_cell(q["q"]) + (f" _{md_cell(q['hint'])}_" if q.get("hint") else "")
                out.append(f"| {q['id']} | {txt} | | |")
        return out + [""]

    L += [f"## {B['common']['title']}", ""] + table([(None, B["common"]["questions"])])
    card = B["product_card"]
    L += [f"## {card['title']}", "", card["note"], "",
          "В Word-версии карточка повторена для каждого продукта. Продукты и что о них известно:", "",
          "| Продукт | Что нам известно сейчас | На что обратить внимание |", "|---|---|---|"]
    L += [f"| {md_cell(p['name'])} | {md_cell(p['known'])} | {md_cell(p['focus'])} |" for p in B["products"]] + [""]
    L += ["### Вопросы карточки", ""] + table([(g["name"], g["questions"]) for g in card["groups"]])
    na = B["not_asked"]
    L += [f"## {na['title']}", "", na["intro"], ""] + [f"- {s}" for s in na["items"]] + ["", f"_{na['commercial']}_", ""]
    so = B["signoff"]
    L += [f"## {so['title']}", "", so["text"], ""] + [f"- {f}: ____________" for f in so["fields"]] + [""]
    path.write_text("\n".join(L), encoding="utf-8")


if __name__ == "__main__":
    (ROOT / "dist").mkdir(exist_ok=True)
    build_docx(ROOT / "dist" / "brief_science_director.docx")
    build_md(ROOT / "brief_science_director.md")
    n_card = sum(len(g["questions"]) for g in B["product_card"]["groups"])
    print(f"Бриф: {len(B['common']['questions'])} общих вопросов, {n_card} в карточке × {len(B['products'])} продуктов")
