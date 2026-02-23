import redis
import json
from app.core.config import settings
from app.core.logger import logger

try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
except Exception as e:
    logger.error(f"Could not connect to Redis: {e}")
    redis_client = None

def get_cache(key: str):
    if not redis_client:
        return None
    try:
        val = redis_client.get(key)
        return json.loads(val) if val else None
    except Exception as e:
        logger.warning(f"Error reading from cache: {e}")
        return None

def set_cache(key: str, value: any, expire: int = 300):
    if not redis_client:
        return
    try:
        redis_client.setex(key, expire, json.dumps(value))
    except Exception as e:
        logger.warning(f"Error setting cache: {e}")
