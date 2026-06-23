from io import BytesIO

from bs4 import BeautifulSoup
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


def html_to_pdf_bytes(title: str, html: str) -> bytes:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 72
    pdf.setTitle(title)
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(72, y, title[:90])
    y -= 30
    pdf.setFont("Helvetica", 11)
    text = BeautifulSoup(html or "", "html.parser").get_text("\n")
    for line in text.splitlines():
        if y < 72:
            pdf.showPage()
            pdf.setFont("Helvetica", 11)
            y = height - 72
        pdf.drawString(72, y, line[:110])
        y -= 16
    pdf.save()
    return buffer.getvalue()

