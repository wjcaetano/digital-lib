import json
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from redis import Redis

from app.domain.entities.book import Book, Author
from app.domain.dtos.book import BookCreate, AuthorCreate
from app.repositories.book_repository import book_repository, author_repository

class BookService:
    CACHE_KEY_PREFIX = "books_list"

    def __init__(self, redis_client: Optional[Redis] = None):
        self.redis_client = redis_client

    def _clear_books_cache(self):
        if self.redis_client:
            keys = self.redis_client.keys(f"{self.CACHE_KEY_PREFIX}:*")
            if keys:
                self.redis_client.delete(*keys)

    def create_author(self, db: Session, author: AuthorCreate) -> Author:
        return author_repository.create(db=db, obj_in_data={"name": author.name})

    def get_authors(self, db: Session, skip: int = 0, limit: int = 100) -> List[Author]:
        return author_repository.get_multi(db, skip=skip, limit=limit)

    def create_book(self, db: Session, book: BookCreate) -> Book:
        db_author = author_repository.get(db=db, id=book.author_id)
        if not db_author:
            raise HTTPException(status_code=404, detail="Author not found")
            
        db_book = book_repository.get_by_isbn(db=db, isbn=book.isbn)
        if db_book:
            raise HTTPException(status_code=400, detail="ISBN already registered")
            
        new_book = book_repository.create(db=db, obj_in_data=book.model_dump())
        self._clear_books_cache()
        return new_book

    def get_books(self, db: Session, skip: int = 0, limit: int = 100) -> List[Book]:
        cache_key = f"{self.CACHE_KEY_PREFIX}:{skip}:{limit}"

        if self.redis_client:
            cached = self.redis_client.get(cache_key)
            if cached:
                books_data = json.loads(cached)
                books = []
                for data in books_data:
                    author_data = data.pop("author", None)
                    book = Book(**data)
                    if author_data:
                        from app.domain.entities.book import Author
                        book.author = Author(**author_data)
                    books.append(book)
                return books

        books = book_repository.get_multi(db, skip=skip, limit=limit)

        if self.redis_client:
            books_dict = [
                {
                    "id": b.id,
                    "title": b.title,
                    "isbn": b.isbn,
                    "is_available": b.is_available,
                    "author_id": b.author_id,
                    "created_at": b.created_at.isoformat() if b.created_at else None,
                    "author": {
                        "id": b.author.id,
                        "name": b.author.name,
                        "created_at": b.author.created_at.isoformat() if b.author.created_at else None,
                    } if b.author else None,
                }
                for b in books
            ]
            self.redis_client.setex(cache_key, 3600, json.dumps(books_dict))

        return books

    def get_book(self, db: Session, book_id: int) -> Optional[Book]:
        return book_repository.get(db, id=book_id)

book_service = BookService()
