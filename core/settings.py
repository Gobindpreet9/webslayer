from pydantic_settings import BaseSettings

class Settings(BaseSettings):
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
    
    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    class Config:
        env_file = ".env"