import redis
from app.core.config import settings
from app.core.logger import logger

# Redis client used via dependency injection (app/api/dependencies.py → get_redis_client)
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    redis_client.ping()
except Exception as e:
    logger.warning(f"Redis unavailable at startup: {e}. Cache will be disabled.")
    redis_client = None
