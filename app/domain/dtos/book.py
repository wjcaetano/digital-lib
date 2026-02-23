from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AuthorBase(BaseModel):
    name: str

class AuthorCreate(AuthorBase):
    pass

class AuthorResponse(AuthorBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class BookBase(BaseModel):
    title: str
    isbn: Optional[str] = None
    is_available: bool = True

class BookCreate(BookBase):
    author_id: int

class BookUpdate(BaseModel):
    title: Optional[str] = None
    isbn: Optional[str] = None
    is_available: Optional[bool] = None

class BookResponse(BookBase):
    id: int
    author_id: int
    created_at: datetime
    author: AuthorResponse

    class Config:
        from_attributes = True
