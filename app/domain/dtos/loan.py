from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.domain.entities.loan import LoanStatus

class LoanBase(BaseModel):
    book_id: int
    user_id: int

class LoanCreate(LoanBase):
    pass

class LoanResponse(LoanBase):
    id: int
    loan_date: datetime
    due_date: datetime
    return_date: Optional[datetime] = None
    status: LoanStatus
    late_fee: float

    class Config:
        from_attributes = True

class LoanReturn(BaseModel):
    pass
