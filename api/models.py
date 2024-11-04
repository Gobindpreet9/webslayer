from pydantic import BaseModel, Field
from enum import Enum
from typing import List, Optional, Any

class FieldType(str, Enum):
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    LIST = "list"
    DICT = "dict"
    DATE = "date"

class SchemaField(BaseModel):
    name: str
    field_type: FieldType
    description: Optional[str] = None
    required: bool = True
    list_item_type: Optional[FieldType] = None
    default: Optional[Any] = None

class SchemaDefinition(BaseModel):
    name: str
    fields: List[SchemaField]

class CrawlConfig(BaseModel):
    enable_crawling: bool = Field(default=False)
    max_depth: int = Field(default=2, ge=1, le=10)
    max_urls: int = Field(default=3, ge=1, le=1000)
    enable_chunking: bool = Field(default=True)
    chunk_size: int = Field(default=5000, ge=1000, le=10000)
    chunk_overlap: int = Field(default=100, ge=0, le=1000)

class ScraperConfig(BaseModel):
    max_hallucination_checks: int = Field(default=2, ge=0, le=5)
    max_quality_checks: int = Field(default=2, ge=0, le=5)

class JobRequest(BaseModel):
    urls: List[str]
    schema_name: str
    llm_model: str = Field(
        default="llama3.1:8b-instruct-q5_0",
        description="Name of the LLM model to use for processing. For Ollama only."
    )
    crawl_config: Optional[CrawlConfig] = CrawlConfig()
    scraper_config: Optional[ScraperConfig] = ScraperConfig()
