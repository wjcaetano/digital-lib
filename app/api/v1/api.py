from fastapi import APIRouter

from app.api.v1.controllers import users, books, loans, auth

api_router = APIRouter()
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(books.router, prefix="/books", tags=["books"])
api_router.include_router(loans.router, prefix="/loans", tags=["loans"])
