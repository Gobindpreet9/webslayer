from pydantic import BaseModel, Field
from typing import List, Optional
from .enums import ModelType
from .config import CrawlConfig, ScraperConfig
from core.settings import Settings

settings = Settings()

class JobRequest(BaseModel):
    urls: List[str]
    schema_name: str
    return_schema_list: bool = Field(
        default=False,
        description="If True, returns list of type Schema, else a single Schema"
    )
    llm_model_type: ModelType = Field(
        default=ModelType(settings.DEFAULT_LLM_TYPE),
        description="Type of model to use for processing (Ollama, Claude, or OpenAI)"
    )
    llm_model_name: str = Field(
        default=settings.DEFAULT_LLM_MODEL,
        description="Name of the LLM model to use for processing."
    )
    crawl_config: Optional[CrawlConfig] = Field(
        default_factory=lambda: CrawlConfig(
            enable_crawling=settings.ENABLE_CRAWLING,
            max_depth=settings.MAX_DEPTH,
            max_urls=settings.MAX_URLS,
            enable_chunking=settings.ENABLE_CHUNKING,
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP
        )
    )
    scraper_config: Optional[ScraperConfig] = Field(
        default_factory=lambda: ScraperConfig(
            max_hallucination_checks=settings.MAX_HALLUCINATION_CHECKS,
            max_quality_checks=settings.MAX_QUALITY_CHECKS,
            enable_quality_check=settings.ENABLE_QUALITY_CHECK,
            enable_hallucination_check=settings.ENABLE_HALLUCINATION_CHECK
        )
    ) 