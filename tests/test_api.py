import pytest
import uuid
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from unittest.mock import patch
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.core.config import settings
from app.api.dependencies import get_current_user
from app.domain.entities.user import User
from app.core.rate_limit import limiter

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


def override_get_current_user():
    """Bypasses JWT auth for tests. Controllers do not use current_user for business logic."""
    return User(id=999, name="Test Admin", email="testadmin@test.com", hashed_password="", is_active=True)


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    # Reset rate limiter counters so tests don't bleed into each other
    try:
        limiter._storage.reset()
    except Exception:
        pass
    yield


# ─── helpers ──────────────────────────────────────────────────────────────────

def create_user(name="Test User", email=None, password="password123"):
    email = email or f"user_{uuid.uuid4().hex[:8]}@example.com"
    resp = client.post(f"{settings.API_V1_STR}/users/", json={"name": name, "email": email, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()


def create_author(name="Author"):
    resp = client.post(f"{settings.API_V1_STR}/books/authors/", json={"name": name})
    assert resp.status_code == 200, resp.text
    return resp.json()


def create_book(author_id, title="Book", isbn=None):
    isbn = isbn or f"ISBN-{uuid.uuid4().hex[:8]}"
    resp = client.post(f"{settings.API_V1_STR}/books/", json={"title": title, "isbn": isbn, "author_id": author_id})
    assert resp.status_code == 200, resp.text
    return resp.json()


def create_loan(user_id, book_id):
    resp = client.post(f"{settings.API_V1_STR}/loans/", json={"user_id": user_id, "book_id": book_id})
    assert resp.status_code == 200, resp.text
    return resp.json()


# ─── basic endpoints ──────────────────────────────────────────────────────────

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_user():
    data = create_user()
    assert "id" in data
    assert data["is_active"] is True


def test_create_user_duplicate_email():
    email = f"dup_{uuid.uuid4().hex[:8]}@example.com"
    create_user(email=email)
    resp = client.post(f"{settings.API_V1_STR}/users/", json={"name": "X", "email": email, "password": "123"})
    assert resp.status_code == 400


def test_list_users():
    create_user()
    create_user()
    resp = client.get(f"{settings.API_V1_STR}/users/")
    assert resp.status_code == 200
    assert len(resp.json()) >= 2


def test_get_user_by_id():
    user = create_user()
    resp = client.get(f"{settings.API_V1_STR}/users/{user['id']}")
    assert resp.status_code == 200
    assert resp.json()["id"] == user["id"]


def test_get_user_not_found():
    resp = client.get(f"{settings.API_V1_STR}/users/99999")
    assert resp.status_code == 404


def test_create_author_and_book():
    author = create_author("George Orwell")
    book = create_book(author["id"], "1984")
    assert book["title"] == "1984"
    assert book["is_available"] is True
    assert book["author"]["name"] == "George Orwell"


def test_create_book_duplicate_isbn():
    author = create_author()
    isbn = f"ISBN-{uuid.uuid4().hex[:8]}"
    create_book(author["id"], isbn=isbn)
    resp = client.post(f"{settings.API_V1_STR}/books/", json={"title": "X", "isbn": isbn, "author_id": author["id"]})
    assert resp.status_code == 400


def test_create_book_author_not_found():
    resp = client.post(f"{settings.API_V1_STR}/books/", json={"title": "X", "isbn": "ISBN-NONE", "author_id": 99999})
    assert resp.status_code == 404


# ─── loan flow ────────────────────────────────────────────────────────────────

def test_loan_process():
    user = create_user()
    author = create_author()
    book = create_book(author["id"])

    loan = create_loan(user["id"], book["id"])
    assert loan["status"] == "ACTIVE"
    assert loan["late_fee"] == 0.0

    # Book must be unavailable after loan
    avail = client.get(f"{settings.API_V1_STR}/books/{book['id']}/availability")
    assert avail.json()["is_available"] is False

    # Return the loan
    ret = client.post(f"{settings.API_V1_STR}/loans/{loan['id']}/return")
    assert ret.status_code == 200
    data = ret.json()
    assert data["status"] == "RETURNED"
    assert data["return_date"] is not None

    # Book must be available again
    avail2 = client.get(f"{settings.API_V1_STR}/books/{book['id']}/availability")
    assert avail2.json()["is_available"] is True


def test_loan_already_returned():
    user = create_user()
    author = create_author()
    book = create_book(author["id"])
    loan = create_loan(user["id"], book["id"])
    client.post(f"{settings.API_V1_STR}/loans/{loan['id']}/return")

    # Second return must fail
    resp = client.post(f"{settings.API_V1_STR}/loans/{loan['id']}/return")
    assert resp.status_code == 400


def test_loan_book_unavailable():
    user = create_user()
    author = create_author()
    book = create_book(author["id"])
    create_loan(user["id"], book["id"])

    user2 = create_user()
    resp = client.post(f"{settings.API_V1_STR}/loans/", json={"user_id": user2["id"], "book_id": book["id"]})
    assert resp.status_code == 400


def test_loan_max_active_limit():
    user = create_user()
    author = create_author()

    for _ in range(3):
        book = create_book(author["id"])
        create_loan(user["id"], book["id"])

    # 4th loan must be rejected
    extra_book = create_book(author["id"])
    resp = client.post(f"{settings.API_V1_STR}/loans/", json={"user_id": user["id"], "book_id": extra_book["id"]})
    assert resp.status_code == 400
    assert "maximum" in resp.json()["detail"].lower()


def test_late_fee_calculation():
    """Validates that returning an overdue loan persists the correct late_fee."""
    user = create_user()
    author = create_author()
    book = create_book(author["id"])

    loan = create_loan(user["id"], book["id"])

    # Simulate 17 days passing: loan was created with due_date = now+14d.
    # When utcnow() returns now+17d at return time, days_late = 3 → fee = R$ 6.00.
    future_now = datetime.utcnow() + timedelta(days=17)
    with patch("app.services.loan_service.datetime") as mock_dt:
        mock_dt.utcnow.return_value = future_now
        ret = client.post(f"{settings.API_V1_STR}/loans/{loan['id']}/return")

    assert ret.status_code == 200
    data = ret.json()
    assert data["status"] == "RETURNED"
    assert data["late_fee"] == 3 * 2.0  # R$ 6.00


def test_user_loan_history():
    user = create_user()
    author = create_author()
    book1 = create_book(author["id"])
    book2 = create_book(author["id"])

    create_loan(user["id"], book1["id"])
    loan2 = create_loan(user["id"], book2["id"])
    client.post(f"{settings.API_V1_STR}/loans/{loan2['id']}/return")

    resp = client.get(f"{settings.API_V1_STR}/users/{user['id']}/loans")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_list_active_loans():
    user = create_user()
    author = create_author()
    book = create_book(author["id"])
    create_loan(user["id"], book["id"])

    resp = client.get(f"{settings.API_V1_STR}/loans/active-delayed")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1
