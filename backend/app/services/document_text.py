"""Extract plain text from uploaded resumes (PDF, DOCX, TXT)."""

import re
from pathlib import Path

from docx import Document as DocxDocument
from pypdf import PdfReader

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt"}


def _fragmented(text: str) -> bool:
    """True when most lines hold a single word: some PDFs (often exported from Word) come out
    of pypdf's default mode one word per line, separated by blank lines. Measured on a real
    resume: 5,192 characters, every phrase split, no line starting with a section heading."""
    lines = [ln for ln in text.splitlines() if ln.strip()]
    return len(lines) >= 30 and sum(len(ln.split()) <= 1 for ln in lines) / len(lines) > 0.6


def extract_text(path: Path) -> str:
    ext = path.suffix.lower()
    if ext == ".pdf":
        reader = PdfReader(path)
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        # Fall back to layout mode, which rebuilds lines from character positions (tables keep
        # their rows: "Examination  University/Board  Institute  Year  CPI/%"). Not the default:
        # it is slower and pads columns with spaces, which _clean collapses anyway.
        if _fragmented(text):
            text = "\n".join(page.extract_text(extraction_mode="layout") or "" for page in reader.pages)
    elif ext == ".docx":
        doc = DocxDocument(str(path))
        parts = [p.text for p in doc.paragraphs]
        # Many resume templates put content in tables; read those cells too.
        for table in doc.tables:
            for row in table.rows:
                parts.append(" | ".join(cell.text for cell in row.cells))
        text = "\n".join(parts)
    elif ext == ".txt":
        text = path.read_text(encoding="utf-8", errors="ignore")
    else:
        raise ValueError(f"Unsupported file type: {ext}")
    return _clean(text)


def _clean(text: str) -> str:
    text = text.replace(" ", " ")
    text = re.sub(r"[ \t]+", " ", text)  # collapse runs of spaces
    text = re.sub(r"\n\s*\n\s*\n+", "\n\n", text)  # at most one blank line
    return text.strip()
