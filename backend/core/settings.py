from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # API Configuration
    API_KEY: Optional[str] = None
    APP_TITLE: str = "WebSlayer API"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Web scraping and data extraction API"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database Configuration
    POSTGRES_PASSWORD: str
    POSTGRES_USER: str = "webslayer_user"
    POSTGRES_DB: str = "webslayer_db"
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432

    # Celery Configuration
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"

    # LLM Configuration
    OLLAMA_HOST: str = 'ollama'
    OLLAMA_PORT: int = 11434
    DEFAULT_LLM_MODEL: str = "llama3.1:8b-instruct-q5_0"
    DEFAULT_LLM_TYPE: str = "Ollama"

    # Crawler Configuration
    ENABLE_CRAWLING: bool = False
    IGNORE_ROBOTS: bool = False
    MAX_DEPTH: int = 2
    MAX_URLS: int = 10
    ENABLE_CHUNKING: bool = True
    CHUNK_SIZE: int = 15000
    CHUNK_OVERLAP: int = 200

    # Scraper Configuration
    MAX_HALLUCINATION_CHECKS: int = 2
    MAX_QUALITY_CHECKS: int = 2
    ENABLE_HALLUCINATION_CHECK: bool = False
    ENABLE_QUALITY_CHECK: bool = False
    
    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    class Config:
        env_file = (".env", "../.env")