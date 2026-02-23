from typing import Optional, List
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.domain.entities.book import Book, Author

class BookRepository(BaseRepository[Book]):
    def get_by_isbn(self, db: Session, isbn: str) -> Optional[Book]:
        return db.query(Book).filter(Book.isbn == isbn).first()

    def get_by_author(self, db: Session, author_id: int, skip: int = 0, limit: int = 100) -> List[Book]:
        return db.query(Book).filter(Book.author_id == author_id).offset(skip).limit(limit).all()

class AuthorRepository(BaseRepository[Author]):
    pass

book_repository = BookRepository(Book)
author_repository = AuthorRepository(Author)
