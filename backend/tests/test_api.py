import os
os.environ["DATABASE_URL"] = "sqlite:///./test_reviews.db"
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    assert client.get("/api/health").json()["status"] == "ok"

def test_create_review_baseline():
    response = client.post("/api/reviews", json={"code": "print('hello')", "language": "python", "title": "Hello"})
    assert response.status_code == 200
    assert 0 <= response.json()["review"]["score"] <= 100

