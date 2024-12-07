from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_KEY: str | None = None
    APP_TITLE: str = "WebSlayer API"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Web scraping and data extraction API"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    POSTGRES_PASSWORD: str
    POSTGRES_USER: str = "webslayer_user"
    POSTGRES_DB: str = "webslayer_db"
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"
    OLLAMA_HOST: str = 'ollama'
    OLLAMA_PORT: int = 11434
    IGNORE_ROBOTS: bool = False
    
    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    class Config:
        env_file = ".env"