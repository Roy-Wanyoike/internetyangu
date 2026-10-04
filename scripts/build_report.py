"""LinkPulse investor concept report - ReportLab build engine.
Pipeline: body PDF (TocDocTemplate + multiBuild, clickable TOC) -> merge HTML
cover (Template 07 Crystal Blue, rendered separately via html2poster.js) as
page 0 -> single final PDF in download/.
Palette: Template 07 fixed Crystal Blue body subset (see typesetting/cover.md).
"""
import hashlib
import os
import sys

sys.path.insert(0, "/home/z/my-project/skills/pdf/scripts")

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (CondPageBreak, HRFlowable, Image, KeepTogether,
                                PageBreak, Paragraph, SimpleDocTemplate,
                                Spacer, Table, TableStyle)
from reportlab.platypus.tableofcontents import TableOfContents

from report_content import C

# ---------------------------------------------------------------- fonts
FONT_DIR = "/usr/share/fonts"
pdfmetrics.registerFont(TTFont("NotoSerifSC", f"{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf"))
pdfmetrics.registerFont(TTFont("NotoSerifSC-Bold", f"{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf"))
pdfmetrics.registerFont(TTFont("Noto Sans SC", f"{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf"))
pdfmetrics.registerFont(TTFont("Noto Sans SC Bold", f"{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf"))
pdfmetrics.registerFont(TTFont("SarasaMonoSC", f"{FONT_DIR}/truetype/chinese/SarasaMonoSC-Regular.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif", f"{FONT_DIR}/truetype/freefont/FreeSerif.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-Bold", f"{FONT_DIR}/truetype/freefont/FreeSerifBold.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-Italic", f"{FONT_DIR}/truetype/freefont/FreeSerifItalic.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-BoldItalic", f"{FONT_DIR}/truetype/freefont/FreeSerifBoldItalic.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuSans", f"{FONT_DIR}/truetype/dejavu/DejaVuSansMono.ttf"))

registerFontFamily("NotoSerifSC", normal="NotoSerifSC", bold="NotoSerifSC-Bold")
registerFontFamily("Noto Sans SC", normal="Noto Sans SC", bold="Noto Sans SC Bold")
registerFontFamily("FreeSerif", normal="FreeSerif", bold="FreeSerif-Bold",
                   italic="FreeSerif-Italic", boldItalic="FreeSerif-BoldItalic")
registerFontFamily("DejaVuSans", normal="DejaVuSans", bold="DejaVuSans")

from pdf import install_font_fallback  # noqa: E402
install_font_fallback()

# ------------------------------------------- Crystal Blue palette (fixed)
PAGE_BG      = colors.HexColor("#f5f8fc")   # XL
SECTION_BG   = colors.HexColor("#edf2f9")   # XL
CARD_BG      = colors.HexColor("#e4ecf5")   # L
TABLE_STRIPE = colors.HexColor("#eef3fa")   # L
HEADER_FILL  = colors.HexColor("#1a4a7a")   # M
BORDER       = colors.HexColor("#c0d0e2")   # S
ACCENT       = colors.HexColor("#2d7ab3")   # XS
TEXT_PRIMARY = colors.HexColor("#142840")
TEXT_MUTED   = colors.HexColor("#5a7a96")

TABLE_HEADER_COLOR = HEADER_FILL
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = TABLE_STRIPE

# ---------------------------------------------------------------- layout
MARGIN = 0.9 * inch
TOP_MARGIN = 0.95 * inch
BOT_MARGIN = 0.9 * inch
PAGE_W, PAGE_H = A4
AVAIL_W = PAGE_W - 2 * MARGIN
AVAIL_H = PAGE_H - TOP_MARGIN - BOT_MARGIN
H1_ORPHAN = AVAIL_H * 0.25
MAX_KEEP = PAGE_H * 0.4

DOC_TITLE = "LinkPulse - Universal Connectivity and Spend Monitor for East Africa"
OUT_BODY = "/home/z/my-project/scripts/assets/report_body.pdf"
OUT_COVER = "/home/z/my-project/scripts/assets/cover.pdf"
OUT_FINAL = "/home/z/my-project/download/LinkPulse_Investor_Concept_Report.pdf"

# ---------------------------------------------------------------- styles
body_s = ParagraphStyle("Body", fontName="FreeSerif", fontSize=10.5, leading=17,
                        alignment=TA_JUSTIFY, textColor=TEXT_PRIMARY,
                        spaceBefore=0, spaceAfter=10)
h1_s = ParagraphStyle("H1", fontName="FreeSerif", fontSize=19, leading=25,
                      textColor=HEADER_FILL, spaceBefore=16, spaceAfter=4)
h2_s = ParagraphStyle("H2", fontName="FreeSerif", fontSize=13.5, leading=18,
                      textColor=TEXT_PRIMARY, spaceBefore=12, spaceAfter=6)
bullet_s = ParagraphStyle("Bullet", fontName="FreeSerif", fontSize=10.5, leading=16,
                          alignment=TA_LEFT, textColor=TEXT_PRIMARY,
                          leftIndent=16, bulletIndent=4, spaceBefore=0, spaceAfter=7)
quote_s = ParagraphStyle("Quote", fontName="FreeSerif-Italic", fontSize=11.5, leading=17,
                         alignment=TA_LEFT, textColor=HEADER_FILL, leftIndent=6)
caption_s = ParagraphStyle("Caption", fontName="FreeSerif", fontSize=8.5, leading=12,
                           alignment=TA_CENTER, textColor=TEXT_MUTED,
                           spaceBefore=3, spaceAfter=6)
th_s = ParagraphStyle("TH", fontName="FreeSerif", fontSize=9.5, leading=12.5,
                      alignment=TA_LEFT, textColor=colors.white)
td_s = ParagraphStyle("TD", fontName="FreeSerif", fontSize=9.5, leading=13,
                      alignment=TA_LEFT, textColor=TEXT_PRIMARY)
stat_v_s = ParagraphStyle("StatV", fontName="FreeSerif", fontSize=17, leading=20,
                          alignment=TA_CENTER, textColor=ACCENT)
stat_l_s = ParagraphStyle("StatL", fontName="FreeSerif", fontSize=8, leading=10.5,
                          alignment=TA_CENTER, textColor=TEXT_MUTED)
toc_title_s = ParagraphStyle("TocTitle", fontName="FreeSerif", fontSize=19, leading=25,
                             textColor=HEADER_FILL, spaceAfter=14)
toc_l0 = ParagraphStyle("TOC0", fontName="FreeSerif", fontSize=11, leading=19,
                        leftIndent=6, textColor=TEXT_PRIMARY)


# ---------------------------------------------------------------- helpers
def safe_keep_together(elements):
    total_h = 0
    for el in elements:
        w, h = el.wrap(AVAIL_W, PAGE_H)
        total_h += h
    if total_h <= MAX_KEEP:
        return [KeepTogether(elements)]
    if len(elements) >= 2:
        return [KeepTogether(elements[:2])] + list(elements[2:])
    return list(elements)


def add_heading(text, style, level=0):
    key = "h_%s" % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/><b>%s</b>' % (key, text), style)
    p.bookmark_name = key
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p


def h1_block(text, first_flowable=None):
    """Chapter heading: orphan guard + heading + accent rule + first content."""
    items = [add_heading(text, h1_s, level=0),
             HRFlowable(width="100%", thickness=1.2, color=ACCENT,
                        spaceBefore=2, spaceAfter=12)]
    if first_flowable is not None:
        items.append(first_flowable)
    return [CondPageBreak(H1_ORPHAN)] + safe_keep_together(items)


def embed_image(path, max_width=None, max_height=None):
    if max_width is None:
        max_width = AVAIL_W
    if max_height is None:
        max_height = A4[1] * 0.35
    im = PILImage.open(path)
    ow, oh = im.size
    ratio = min(max_width / ow, max_height / oh, 1.0)
    return Image(path, width=ow * ratio, height=oh * ratio)


def stat_row(stats):
    """Row of stat callout cards (max 4)."""
    n = len(stats)
    card_w = min(108, (AVAIL_W - 10 * (n - 1)) / n)
    cells, widths = [], []
    for i, (val, lab) in enumerate(stats):
        inner = Table(
            [[Paragraph("<b>%s</b>" % val, stat_v_s)], [Paragraph(lab, stat_l_s)]],
            colWidths=[card_w])
        inner.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), CARD_BG),
            ("BOX", (0, 0), (-1, -1), 0.8, ACCENT),
            ("TOPPADDING", (0, 0), (-1, 0), 9),
            ("BOTTOMPADDING", (0, -1), (-1, -1), 8),
            ("TOPPADDING", (0, -1), (-1, -1), 2),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        cells.append(inner)
        widths.append(card_w)
        if i < n - 1:
            cells.append(Spacer(1, 1))
            widths.append(10)
    outer = Table([cells], colWidths=widths, hAlign="CENTER")
    outer.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return outer


def quote_block(text):
    t = Table([[Paragraph(text, quote_s)]], colWidths=[AVAIL_W * 0.92], hAlign="CENTER")
    t.setStyle(TableStyle([
        ("LINEBEFORE", (0, 0), (0, 0), 2.2, ACCENT),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def data_table(spec):
    ratios = spec["ratios"]
    col_w = [r * AVAIL_W for r in ratios]
    assert abs(sum(col_w) - AVAIL_W) < 1.0, "table width mismatch"
    data = [[Paragraph("<b>%s</b>" % h, th_s) for h in spec["header"]]]
    for row in spec["rows"]:
        data.append([Paragraph(c, td_s) for c in row])
    t = Table(data, colWidths=col_w, hAlign="CENTER", repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]
    for i in range(1, len(data)):
        style.append(("BACKGROUND", (0, i), (-1, i),
                      TABLE_ROW_ODD if i % 2 else TABLE_ROW_EVEN))
    t.setStyle(TableStyle(style))
    return t


# ---------------------------------------------------------------- chrome
def _chrome(canvas, doc, page_label):
    canvas.saveState()
    # header
    canvas.setFont("FreeSerif", 7.5)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(MARGIN, PAGE_H - 0.55 * inch, DOC_TITLE)
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(1.2)
    canvas.line(MARGIN, PAGE_H - 0.62 * inch, PAGE_W - MARGIN, PAGE_H - 0.62 * inch)
    # footer
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, 0.62 * inch, PAGE_W - MARGIN, 0.62 * inch)
    canvas.setFont("FreeSerif", 7.5)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(MARGIN, 0.45 * inch, "Prepared by Z.ai - concept document")
    canvas.drawRightString(PAGE_W - MARGIN, 0.45 * inch, page_label)
    canvas.restoreState()


ROMAN = {1: "i", 2: "ii", 3: "iii", 4: "iv", 5: "v"}


def on_first_page(canvas, doc):
    _chrome(canvas, doc, ROMAN.get(doc.page, str(doc.page)))


def on_later_pages(canvas, doc):
    if doc.page <= 1:
        _chrome(canvas, doc, ROMAN.get(doc.page, str(doc.page)))
    else:
        _chrome(canvas, doc, str(doc.page - 1))


# ---------------------------------------------------------------- doc
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, "bookmark_name"):
            level = getattr(flowable, "bookmark_level", 0)
            text = getattr(flowable, "bookmark_text", "")
            key = getattr(flowable, "bookmark_key", "")
            self.notify("TOCEntry", (level, text, self.page, key))


def build():
    doc = TocDocTemplate(
        OUT_BODY, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=TOP_MARGIN, bottomMargin=BOT_MARGIN,
        title=DOC_TITLE, author="Z.ai", creator="Z.ai",
        subject="Investor concept report: universal connectivity and spend monitor")

    story = []
    toc = TableOfContents()
    toc.levelStyles = [toc_l0]
    toc.dotsMinLevel = 0
    story.append(Paragraph("<b>Table of Contents</b>", toc_title_s))
    story.append(HRFlowable(width="100%", thickness=1.2, color=ACCENT,
                            spaceBefore=0, spaceAfter=14))
    story.append(toc)
    story.append(PageBreak())

    for ch in C:
        blocks = ch["blocks"]
        first = blocks[0]
        if first[0] == "p":
            lead = Paragraph(first[1], body_s)
            story.extend(h1_block(ch["title"], lead))
            rest = blocks[1:]
        else:
            story.extend(h1_block(ch["title"]))
            rest = blocks
        for kind, payload in rest:
            if kind == "p":
                story.append(Paragraph(payload, body_s))
            elif kind == "h2":
                nxt = Spacer(1, 0)
                story.extend(safe_keep_together(
                    [Paragraph("<b>%s</b>" % payload, h2_s), nxt]))
            elif kind == "bullets":
                for item in payload:
                    story.append(Paragraph(item, bullet_s, bulletText="\u2022"))
                story.append(Spacer(1, 4))
            elif kind == "stats":
                story.append(Spacer(1, 8))
                story.append(stat_row(payload))
                story.append(Spacer(1, 14))
            elif kind == "quote":
                story.append(Spacer(1, 6))
                story.append(quote_block(payload))
                story.append(Spacer(1, 12))
            elif kind == "table":
                story.append(Spacer(1, 12))
                story.append(data_table(payload))
                story.append(Spacer(1, 6))
                story.append(Paragraph(payload["title"], caption_s))
                story.append(Spacer(1, 12))
            elif kind == "chart":
                img = embed_image(payload["path"], max_width=AVAIL_W,
                                  max_height=payload.get("max_h", 300))
                story.append(Spacer(1, 14))
                story.extend(safe_keep_together(
                    [img, Paragraph(payload["caption"], caption_s)]))
                story.append(Spacer(1, 12))

    doc.multiBuild(story, onFirstPage=on_first_page, onLaterPages=on_later_pages)
    print("body built:", OUT_BODY)


def merge_cover():
    from pypdf import PdfReader, PdfWriter
    A4_W, A4_H = 595.28, 841.89

    def norm(page):
        w, h = float(page.mediabox.width), float(page.mediabox.height)
        if abs(w - A4_W) > 0.1 or abs(h - A4_H) > 0.1:
            page.scale_to(A4_W, A4_H)
            page.mediabox.lower_left = (0, 0)
            page.mediabox.upper_right = (A4_W, A4_H)
        return page

    writer = PdfWriter()
    writer.add_page(norm(PdfReader(OUT_COVER).pages[0]))
    for p in PdfReader(OUT_BODY).pages:
        writer.add_page(norm(p))
    writer.add_metadata({
        "/Title": DOC_TITLE, "/Author": "Z.ai", "/Creator": "Z.ai",
        "/Subject": "Investor concept report: universal connectivity and spend monitor",
    })
    os.makedirs(os.path.dirname(OUT_FINAL), exist_ok=True)
    with open(OUT_FINAL, "wb") as f:
        writer.write(f)
    print("final:", OUT_FINAL)


if __name__ == "__main__":
    build()
    merge_cover()
