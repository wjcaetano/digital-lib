from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.domain.entities.user import User

class UserRepository(BaseRepository[User]):
    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

user_repository = UserRepository(User)
