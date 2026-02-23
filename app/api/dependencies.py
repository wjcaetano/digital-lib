from typing import Generator
import redis
from app.core.database import SessionLocal
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from pydantic import ValidationError

from app.core.config import settings
from app.services.user_service import user_service
from app.domain.entities.user import User

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login"
)

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_redis_client():
    try:
        client = redis.from_url(settings.REDIS_URL)
        yield client
    except redis.ConnectionError:
        yield None
    finally:
        pass

def get_current_user(
    db: SessionLocal = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = payload.get("sub")
    except (jwt.PyJWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = user_service.get_user(db, user_id=int(token_data))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

