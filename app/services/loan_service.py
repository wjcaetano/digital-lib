from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.domain.entities.loan import Loan, LoanStatus
from app.domain.dtos.loan import LoanCreate
from app.repositories.loan_repository import loan_repository
from app.repositories.book_repository import book_repository
from app.repositories.user_repository import user_repository

class LoanService:
    MAX_ACTIVE_LOANS = 3
    LATE_FEE_PER_DAY = 2.0  # R$ 2.00 per day

    def get_loans(self, db: Session, skip: int = 0, limit: int = 100) -> List[Loan]:
        return loan_repository.get_multi(db, skip=skip, limit=limit)

    def get_active_or_delayed_loans(self, db: Session, skip: int = 0, limit: int = 100) -> List[Loan]:
        return loan_repository.get_all_active_or_delayed(db, skip=skip, limit=limit)

    def get_user_loans(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Loan]:
        return loan_repository.get_by_user(db, user_id=user_id, skip=skip, limit=limit)

    def create_loan(self, db: Session, loan: LoanCreate) -> Loan:
        # Check User
        user = user_repository.get(db, id=loan.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check Active Loans Limit
        active_loans = loan_repository.get_active_by_user(db, user_id=loan.user_id)
        if len(active_loans) >= self.MAX_ACTIVE_LOANS:
            raise HTTPException(status_code=400, detail=f"User has reached the maximum limit of {self.MAX_ACTIVE_LOANS} active loans")

        # Check Book
        book = book_repository.get(db, id=loan.book_id)
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        if not book.is_available:
            raise HTTPException(status_code=400, detail="Book is not available for loan")

        # Create Loan & Update Book Status
        due_date = datetime.utcnow() + timedelta(days=14)
        db_loan = loan_repository.create(db=db, obj_in_data={
            "user_id": loan.user_id, 
            "book_id": loan.book_id,
            "due_date": due_date
        })
        book_repository.update(db, db_obj=book, obj_in_data={"is_available": False})
        
        return db_loan

    def return_loan(self, db: Session, loan_id: int) -> Loan:
        loan = loan_repository.get(db, id=loan_id)
        if not loan:
            raise HTTPException(status_code=404, detail="Loan not found")
            
        if loan.status == LoanStatus.RETURNED:
            raise HTTPException(status_code=400, detail="Loan is already returned")

        # Calculate late fee
        days_late = (datetime.utcnow() - loan.due_date).days
        fine_amount = 0.0
        
        if days_late > 0:
            fine_amount = days_late * self.LATE_FEE_PER_DAY
            
        # Update Loan Status & Apply Fine
        updated_loan = loan_repository.update(db, db_obj=loan, obj_in_data={
            "returned_at": datetime.utcnow(),
            "status": LoanStatus.RETURNED,
            "fine_amount": max(0.0, fine_amount)
        })

        # Make Book Available Again
        book = book_repository.get(db, id=loan.book_id)
        if book:
            book_repository.update(db, db_obj=book, obj_in_data={"is_available": True})

        return updated_loan

loan_service = LoanService()
