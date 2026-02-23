from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.domain.dtos.user import UserCreate, UserResponse, UserUpdate
from app.api.dependencies import get_db
from app.services.user_service import user_service
from app.services.loan_service import loan_service
from app.domain.dtos.loan import LoanResponse
from app.core.rate_limit import limiter
from app.domain.dtos.loan import LoanResponse

router = APIRouter()

@router.post("/", response_model=UserResponse)
@limiter.limit("5/minute")
def create_user(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    """
    Cadastra um novo usuário.
    """
    return user_service.create_user(db=db, user=user)

@router.get("/", response_model=List[UserResponse])
@limiter.limit("20/minute")
def read_users(request: Request, skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Lista todos os usuários com paginação.
    """
    return user_service.get_users(db, skip=skip, limit=limit)

@router.get("/{user_id}", response_model=UserResponse)
@limiter.limit("30/minute")
def read_user(request: Request, user_id: int, db: Session = Depends(get_db)):
    """
    Busca um usuário por ID.
    """
    user = user_service.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/{user_id}/loans", response_model=List[LoanResponse])
@limiter.limit("30/minute")
def read_user_loans(request: Request, user_id: int, skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Lista todos os empréstimos (histórico) associados a um usuário.
    """
    user = user_service.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return loan_service.get_user_loans(db=db, user_id=user_id, skip=skip, limit=limit)
