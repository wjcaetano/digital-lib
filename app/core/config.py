from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Digital Library API"
    API_V1_STR: str = "/api/v1"
    
    # Defaults para rodar localmente, docker-compose irá sobrescrever
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/digital_lib"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Regras de Negócio
    LOAN_PERIOD_DAYS: int = 14
    MAX_ACTIVE_LOANS_PER_USER: int = 3
    LATE_FEE_PER_DAY: float = 2.0

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
