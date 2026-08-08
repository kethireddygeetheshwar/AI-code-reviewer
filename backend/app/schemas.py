from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ReviewRequest(BaseModel):
    code: str = Field(min_length=1, max_length=30000)
    language: str = "python"
    title: str = "Untitled review"
    focus: str = "balanced"


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    code: str = Field(min_length=1, max_length=30000)
    language: str = "python"
    review_context: dict | None = None


class TestRequest(BaseModel):
    code: str = Field(min_length=1, max_length=30000)
    language: str = "python"


class HistoryItem(BaseModel):
    id: int
    title: str
    language: str
    created_at: datetime
    score: int

    model_config = ConfigDict(from_attributes=True)
