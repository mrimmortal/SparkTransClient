import html
import re
import zipfile
from difflib import SequenceMatcher
from io import BytesIO

from bs4 import BeautifulSoup
from docx import Document as DocxDocument
from fastapi import HTTPException, UploadFile, status


def sanitize_html(value: str) -> str:
    soup = BeautifulSoup(value, "html.parser")
    for tag in soup(["script", "style", "iframe", "object", "embed"]):
        tag.decompose()
    for tag in soup.find_all(True):
        for attr in list(tag.attrs):
            if attr.lower().startswith("on"):
                del tag.attrs[attr]
    return str(soup)


async def extract_docx_html(upload: UploadFile, max_bytes: int) -> tuple[str, str]:
    filename = upload.filename or "template.docx"
    if not filename.lower().endswith(".docx"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only .docx templates are supported")
    content = await upload.read(max_bytes + 1)
    if len(content) > max_bytes:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Template is too large")
    if not zipfile.is_zipfile(BytesIO(content)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid .docx file")

    doc = DocxDocument(BytesIO(content))
    paragraphs = [html.escape(paragraph.text.strip()) for paragraph in doc.paragraphs if paragraph.text.strip()]
    content_html = "".join(f"<p>{paragraph}</p>" for paragraph in paragraphs)
    return filename, sanitize_html(content_html)


def normalize_query(value: str) -> str:
    return re.sub(r"\s+", " ", value.lower()).strip()


def fuzzy_score(query: str, candidate: str) -> float:
    normalized_query = normalize_query(query)
    normalized_candidate = normalize_query(candidate)
    if not normalized_query or not normalized_candidate:
        return 0.0
    if normalized_query in normalized_candidate:
        return 1.0
    return SequenceMatcher(None, normalized_query, normalized_candidate).ratio()

