"""Render an optimized resume as an ATS-friendly DOCX.

ATS-friendly means boring on purpose: one column, no tables/text boxes/images, standard
headings (Summary, Skills, Experience...), a common font, real bullet characters. Fancy
two-column templates often get scrambled when an ATS extracts their text.
"""

from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Pt, RGBColor

from app.schemas.optimizer import OptimizedEntry, OptimizedResume
from app.schemas.profile import CandidateProfile

ACCENT = RGBColor(0x4E, 0x66, 0x54)  # dark sage, matching the app


def _heading(doc, text: str) -> None:
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run(text.upper())
    run.bold = True
    run.font.size = Pt(11)
    run.font.color.rgb = ACCENT


def _entry(doc, entry: OptimizedEntry) -> None:
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(0)
    p.add_run(entry.heading).bold = True
    if entry.subheading:
        p.add_run(f"  |  {entry.subheading}").font.color.rgb = RGBColor(0x55, 0x55, 0x55)
    for bullet in entry.bullets:
        b = doc.add_paragraph(bullet.text, style="List Bullet")
        b.paragraph_format.space_after = Pt(0)


def render_docx(resume: OptimizedResume, profile: CandidateProfile, path: Path) -> Path:
    doc = Document()
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(10.5)
    for section in doc.sections:
        section.left_margin = section.right_margin = Pt(54)
        section.top_margin = section.bottom_margin = Pt(42)

    c = profile.contact
    name = doc.add_paragraph()
    name.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = name.add_run(c.name or "")
    run.bold = True
    run.font.size = Pt(18)
    contact_line = " | ".join(x for x in [c.email, c.phone, c.location, *c.links] if x)
    if contact_line:
        line = doc.add_paragraph(contact_line)
        line.alignment = WD_ALIGN_PARAGRAPH.CENTER

    if resume.summary:
        _heading(doc, "Summary")
        doc.add_paragraph(resume.summary)
    if resume.skills:
        _heading(doc, "Skills")
        doc.add_paragraph(", ".join(resume.skills))
    if resume.experience:
        _heading(doc, "Experience")
        for e in resume.experience:
            _entry(doc, e)
    if resume.projects:
        _heading(doc, "Projects")
        for p in resume.projects:
            _entry(doc, p)
    if profile.education:
        _heading(doc, "Education")
        for ed in profile.education:
            dates = " - ".join(d for d in [ed.start_date, ed.end_date] if d)
            extra = " | ".join(x for x in [dates, ed.grade] if x)
            p = doc.add_paragraph()
            p.paragraph_format.space_after = Pt(0)
            p.add_run(f"{ed.degree}, {ed.institution}").bold = True
            if extra:
                p.add_run(f"  |  {extra}")
    if profile.certifications:
        _heading(doc, "Certifications")
        for cert in profile.certifications:
            doc.add_paragraph(cert, style="List Bullet")

    path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(path))
    return path
