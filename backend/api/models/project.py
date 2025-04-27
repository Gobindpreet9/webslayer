from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional
from datetime import datetime
import uuid

class CrawlConfig(BaseModel):
    enable_crawling: bool = Field(default=True)
    max_depth: int = Field(default=3, ge=1, le=10)
    max_urls: int = Field(default=100, ge=1, le=1000)

class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    urls: List[HttpUrl] = Field(default_factory=list) # Use HttpUrl for validation
    llm_type: str = Field(default='ollama')
    llm_model_name: str = Field(default='llama3')
    schema_name: str = Field(..., min_length=1)
    crawl_config: CrawlConfig = Field(default_factory=CrawlConfig)

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        orm_mode = True # For SQLAlchemy compatibility if needed later

class ProjectUpdate(BaseModel):
    urls: Optional[List[HttpUrl]] = None
    llm_type: Optional[str] = None
    llm_model_name: Optional[str] = None
    schema_name: Optional[str] = Field(None, min_length=1)
    crawl_config: Optional[CrawlConfig] = None
    scraper_config: Optional[ScraperConfig] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)
