from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.domain.entities.user import User
from app.domain.dtos.user import UserCreate, UserUpdate
from app.repositories.user_repository import user_repository
from app.core.security import get_password_hash

class UserService:
    def get_user(self, db: Session, user_id: int) -> Optional[User]:
        return user_repository.get(db, id=user_id)

    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        return user_repository.get_by_email(db, email=email)

    def get_users(self, db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        return user_repository.get_multi(db, skip=skip, limit=limit)

    def create_user(self, db: Session, user: UserCreate) -> User:
        db_user = self.get_user_by_email(db, email=user.email)
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
            
        hashed_password = get_password_hash(user.password)
        db_user_data = {
            "email": user.email,
            "name": user.name,
            "hashed_password": hashed_password
        }
        return user_repository.create(db=db, obj_in_data=db_user_data)

user_service = UserService()
