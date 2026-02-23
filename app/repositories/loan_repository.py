from typing import List, Optional
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.domain.entities.loan import Loan, LoanStatus

class LoanRepository(BaseRepository[Loan]):
    def get_active_by_user(self, db: Session, user_id: int) -> List[Loan]:
        return db.query(Loan).filter(
            Loan.user_id == user_id, 
            Loan.status == LoanStatus.ACTIVE
        ).all()
    
    def get_by_user(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Loan]:
        return db.query(Loan).filter(Loan.user_id == user_id).offset(skip).limit(limit).all()

    def get_all_active_or_delayed(self, db: Session, skip: int = 0, limit: int = 100) -> List[Loan]:
        return db.query(Loan).filter(
            Loan.status.in_([LoanStatus.ACTIVE, LoanStatus.DELAYED])
        ).offset(skip).limit(limit).all()

loan_repository = LoanRepository(Loan)
