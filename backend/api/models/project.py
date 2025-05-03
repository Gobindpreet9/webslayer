from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional
from datetime import datetime
import uuid
from .config import ScraperConfig

class CrawlConfig(BaseModel):
    enable_crawling: bool = Field(default=False)
    max_depth: int = Field(default=3, ge=1, le=10)
    max_urls: int = Field(default=100, ge=1, le=1000)

class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    urls: List[HttpUrl] = Field(default_factory=list) # Use HttpUrl for validation
    llm_type: str = Field(default='ollama')
    llm_model_name: str = Field(default='llama3')
    schema_name: Optional[str] = Field(default=None) # Made optional
    crawl_config: CrawlConfig = Field(default_factory=CrawlConfig)

class Project(ProjectBase):
    class Config:
        orm_mode = True # For SQLAlchemy compatibility if needed later