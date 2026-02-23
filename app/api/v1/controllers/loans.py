from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.domain.dtos.loan import LoanCreate, LoanResponse
from app.api.dependencies import get_db, get_current_user
from app.services.loan_service import loan_service
from app.domain.entities.user import User
from app.core.rate_limit import limiter

router = APIRouter()

@router.post("/", response_model=LoanResponse)
@limiter.limit("5/minute")
def create_loan(
    request: Request, 
    loan: LoanCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Performs a book loan.
    - Default deadline is saved in the Model (14 days from registry).
    - Book must be valid and have `is_available = True`.
    - User cannot have 3 ACTIVE loans simultaneously.
    """
    return loan_service.create_loan(db=db, loan=loan)

@router.post("/{loan_id}/return", response_model=LoanResponse)
@limiter.limit("5/minute")
def return_loan(
    request: Request, 
    loan_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Processes a loan return.
    - Automatically calculates the fine (if any) at R$ 2.00/day.
    - Releases the book's `is_available` status.
    """
    return loan_service.return_loan(db=db, loan_id=loan_id)

@router.get("/active-delayed", response_model=List[LoanResponse])
@limiter.limit("20/minute")
def read_active_or_delayed_loans(request: Request, skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Lists all active (within deadline) or delayed (overdue and not returned) loans system-wide.
    """
    return loan_service.get_active_or_delayed_loans(db, skip=skip, limit=limit)
