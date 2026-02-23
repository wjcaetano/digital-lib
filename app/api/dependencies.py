from typing import Generator
import redis
from app.core.database import SessionLocal
from app.core.config import settings

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
