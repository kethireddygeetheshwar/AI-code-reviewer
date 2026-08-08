from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Preformatted


def pdf_report(title: str, code: str, review: dict) -> bytes:
    buffer = BytesIO()
    styles = getSampleStyleSheet()
    story = [Paragraph(f"AI Code Reviewer — {title}", styles["Title"]), Spacer(1, 12), Paragraph(f"Code Quality: {review.get('score', 0)} / 100", styles["Heading2"]), Paragraph(review.get("summary", ""), styles["BodyText"]), Spacer(1, 12)]
    for heading, value in [("Bugs", review.get("bugs", [])), ("Optimizations", review.get("optimizations", [])), ("Security", review.get("security", [])), ("Complexity", review.get("complexity", {}))]:
        story += [Paragraph(heading, styles["Heading2"]), Paragraph(str(value), styles["BodyText"]), Spacer(1, 8)]
    story += [Paragraph("Original Code", styles["Heading2"]), Preformatted(code, styles["Code"]), Paragraph("Suggested Code", styles["Heading2"]), Preformatted(review.get("improved_code", ""), styles["Code"])]
    SimpleDocTemplate(buffer, pagesize=letter, title=title).build(story)
    return buffer.getvalue()

