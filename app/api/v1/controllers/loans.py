from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.domain.dtos.loan import LoanCreate, LoanResponse
from app.api.dependencies import get_db
from app.services.loan_service import loan_service
from app.core.rate_limit import limiter

router = APIRouter()

@router.post("/", response_model=LoanResponse)
@limiter.limit("10/minute")
def create_loan(request: Request, loan: LoanCreate, db: Session = Depends(get_db)):
    """
    Realiza o empréstimo de um livro.
    - O prazo padrão fica salvo na Model (14 dias do registro).
    - O livro precisa ser válido e estar `is_available = True`.
    - O Usuário não pode ter 3 empréstimos ATIVOS simultaneamente.
    """
    return loan_service.create_loan(db=db, loan=loan)

@router.post("/{loan_id}/return", response_model=LoanResponse)
@limiter.limit("10/minute")
def return_loan(request: Request, loan_id: int, db: Session = Depends(get_db)):
    """
    Processa a devolução de um empréstimo.
    - Calcula automaticamente a multa (se houver) de acordo com R$ 2,00/dia.
    - Libera o `is_available` do Livro em questão.
    """
    return loan_service.return_loan(db=db, loan_id=loan_id)

@router.get("/active-delayed", response_model=List[LoanResponse])
@limiter.limit("20/minute")
def read_active_or_delayed_loans(request: Request, skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Lista todos os empréstimos ativos (em prazo) ou atrasados (vencidos ainda não devolvidos) do sistema global.
    """
    return loan_service.get_active_or_delayed_loans(db, skip=skip, limit=limit)
