from pydantic import BaseModel, Field
from typing import List, Optional
from .enums import ModelType
from .config import CrawlConfig, ScraperConfig

class JobRequest(BaseModel):
    urls: List[str]
    schema_name: str
    return_schema_list: bool = Field(
        default=False,
        description="If True, returns list of type Schema, else a single Schema"
    )
    llm_model_type: ModelType = Field(
        default=ModelType.ollama,
        description="Type of model to use for processing (Ollama, Claude, or OpenAI)"
    )
    llm_model_name: str = Field(
        default="llama3.1:8b-instruct-q5_0",
        description="Name of the LLM model to use for processing."
    )
    crawl_config: Optional[CrawlConfig] = CrawlConfig()
    scraper_config: Optional[ScraperConfig] = ScraperConfig() 