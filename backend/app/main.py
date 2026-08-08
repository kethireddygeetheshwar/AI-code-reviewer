import json
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy.orm import Session
from .config import get_settings
from .database import Base, engine, get_db
from .models import ReviewRecord
from .reporting import pdf_report
from .reviewer import answer_question, generate_tests, review_code
from .schemas import ChatRequest, HistoryItem, ReviewRequest, TestRequest

Base.metadata.create_all(bind=engine)
app = FastAPI(title="AI Code Reviewer", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=get_settings().origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.get("/api/health")
def health(): return {"status": "ok"}


@app.post("/api/reviews")
def create_review(payload: ReviewRequest, db: Session = Depends(get_db)):
    try:
        review = review_code(payload.code, payload.language, payload.focus)
        record = ReviewRecord(title=payload.title[:180], language=payload.language, source_code=payload.code, review_json=json.dumps(review))
        db.add(record); db.commit(); db.refresh(record)
        return {"id": record.id, "review": review}
    except Exception as exc:
        raise HTTPException(500, "We could not review that code right now. Please try again.") from exc


@app.get("/api/reviews", response_model=list[HistoryItem])
def list_reviews(db: Session = Depends(get_db)):
    records = db.query(ReviewRecord).order_by(ReviewRecord.created_at.desc()).limit(50).all()
    return [HistoryItem(id=x.id, title=x.title, language=x.language, created_at=x.created_at, score=json.loads(x.review_json).get("score", 0)) for x in records]


@app.get("/api/reviews/{review_id}")
def get_review(review_id: int, db: Session = Depends(get_db)):
    record = db.get(ReviewRecord, review_id)
    if not record: raise HTTPException(404, "Review not found")
    return {"id": record.id, "title": record.title, "language": record.language, "code": record.source_code, "review": json.loads(record.review_json), "created_at": record.created_at}


@app.get("/api/reviews/{review_id}/report")
def download_report(review_id: int, db: Session = Depends(get_db)):
    record = db.get(ReviewRecord, review_id)
    if not record: raise HTTPException(404, "Review not found")
    content = pdf_report(record.title, record.source_code, json.loads(record.review_json))
    return Response(content, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="review-{review_id}.pdf"'})


@app.post("/api/chat")
def chat(payload: ChatRequest):
    return {"answer": answer_question(payload.question, payload.code, payload.language, payload.review_context)}


@app.post("/api/generate-tests")
def tests(payload: TestRequest):
    return {"tests": generate_tests(payload.code, payload.language)}
