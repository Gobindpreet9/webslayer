from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_TITLE: str = "WebSlayer API"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Web scraping and data extraction API"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    POSTGRES_PASSWORD: str = ""
    
    class Config:
        env_file = ".env"