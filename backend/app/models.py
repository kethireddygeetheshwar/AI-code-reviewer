from datetime import datetime, timezone
from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


class ReviewRecord(Base):
    __tablename__ = "reviews"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(180), default="Untitled review")
    language: Mapped[str] = mapped_column(String(32), default="python")
    source_code: Mapped[str] = mapped_column(Text)
    review_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

