from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Digital Library API"
    API_V1_STR: str = "/api/v1"
    
    # Defaults for local running, docker-compose will overwrite them
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/digital_lib"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Business Rules
    LOAN_PERIOD_DAYS: int = 14
    MAX_ACTIVE_LOANS_PER_USER: int = 3
    LATE_FEE_PER_DAY: float = 2.0

    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
