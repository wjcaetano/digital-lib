import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.core.config import settings

# Setup test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def run_around_tests():
    # Setup - clear data
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    # Teardown

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_create_user():
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    response = client.post(
        f"{settings.API_V1_STR}/users/",
        json={"name": "Test User", "email": unique_email, "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == unique_email
    assert "id" in data

def test_create_author_and_book():
    # Create Author
    response_author = client.post(
        f"{settings.API_V1_STR}/books/authors/",
        json={"name": "Author 1"}
    )
    assert response_author.status_code == 200
    author_id = response_author.json()["id"]

    unique_isbn = f"ISBN-{uuid.uuid4().hex[:8]}"
    # Create Book
    response_book = client.post(
        f"{settings.API_V1_STR}/books/",
        json={"title": "Test Book", "isbn": unique_isbn, "author_id": author_id}
    )
    assert response_book.status_code == 200
    data = response_book.json()
    assert data["title"] == "Test Book"
    assert data["is_available"] == True

def test_loan_process():
    # Setup User and Book
    unique_email = f"u1_{uuid.uuid4().hex[:8]}@e.com"
    user_resp = client.post(f"{settings.API_V1_STR}/users/", json={"name": "U1", "email": unique_email, "password": "123"})
    user_id = user_resp.json()["id"]

    author_resp = client.post(f"{settings.API_V1_STR}/books/authors/", json={"name": "A1"})
    author_id = author_resp.json()["id"]

    unique_isbn = f"ISBN-{uuid.uuid4().hex[:8]}"
    book_resp = client.post(f"{settings.API_V1_STR}/books/", json={"title": "B1", "isbn": unique_isbn, "author_id": author_id})
    book_id = book_resp.json()["id"]

    # Action: Create Loan
    loan_resp = client.post(f"{settings.API_V1_STR}/loans/", json={"user_id": user_id, "book_id": book_id})
    assert loan_resp.status_code == 200
    loan_id = loan_resp.json()["id"]

    # Check Book Availability changed
    avail_resp = client.get(f"{settings.API_V1_STR}/books/{book_id}/availability")
    assert avail_resp.json()["is_available"] == False

    # Action: Return Loan
    return_resp = client.post(f"{settings.API_V1_STR}/loans/{loan_id}/return")
    assert return_resp.status_code == 200
    assert return_resp.json()["status"] == "RETURNED"
