from typing import List
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.domain.dtos.book import BookCreate, BookResponse, AuthorCreate, AuthorResponse
from app.api.dependencies import get_db, get_current_user, get_redis_client
from app.domain.entities.user import User
from app.core.rate_limit import limiter
from app.services.book_service import BookService

router = APIRouter()

@router.post("/authors/", response_model=AuthorResponse)
@limiter.limit("5/minute")
def create_author(
    request: Request, 
    author: AuthorCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Registers a new author.
    """
    # Create a local service instance without Redis requirement for authors
    service = BookService()
    return service.create_author(db=db, author=author)

@router.get("/authors/", response_model=List[AuthorResponse])
@limiter.limit("30/minute")
def read_authors(request: Request, skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Lists authors with pagination.
    """
    service = BookService()
    return service.get_authors(db, skip=skip, limit=limit)

@router.post("/", response_model=BookResponse)
@limiter.limit("5/minute")
def create_book(
    request: Request, 
    book: BookCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    redis_client: Optional[redis.Redis] = Depends(get_redis_client)
):
    """
    Registers a new book linked to an existing author. CLEARS the book list CACHE.
    """
    service = BookService(redis_client=redis_client)
    return service.create_book(db=db, book=book)

@router.get("/", response_model=List[BookResponse])
@limiter.limit("60/minute")
def read_books(request: Request, skip: int = 0, limit: int = 10, db: Session = Depends(get_db), redis_client = Depends(get_redis_client)):
    """
    Lists books with pagination.
    Attempts to fetch via Cache (Redis) first. If absent, requests from DB and sets Cache for 1 hr.
    """
    service = BookService(redis_client=redis_client)
    return service.get_books(db, skip=skip, limit=limit)

@router.get("/{book_id}/availability")
@limiter.limit("60/minute")
def check_availability(request: Request, book_id: int, db: Session = Depends(get_db)):
    """
    Checks if a book is available for loan.
    """
    service = BookService()
    book = service.get_book(db, book_id=book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    return {"book_id": book.id, "is_available": book.is_available}
