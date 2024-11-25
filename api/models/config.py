from pydantic import BaseModel, Field

class CrawlConfig(BaseModel):
    enable_crawling: bool = Field(default=False)
    max_depth: int = Field(default=2, ge=1, le=10)
    max_urls: int = Field(default=3, ge=1, le=1000)
    enable_chunking: bool = Field(default=True)
    chunk_size: int = Field(default=5000, ge=1000, le=1000000)
    chunk_overlap: int = Field(default=100, ge=0, le=100000)

class ScraperConfig(BaseModel):
    max_hallucination_checks: int = Field(default=2, ge=0, le=5)
    max_quality_checks: int = Field(default=2, ge=0, le=5) 