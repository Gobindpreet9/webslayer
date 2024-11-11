from pydantic import BaseModel, Field
from typing import List, Optional, Any
from enum import Enum

class FieldTypePydantic(str, Enum):
    string = "string"
    integer = "integer"
    float = "float"
    boolean = "boolean"
    list = "list"
    date = "date"
    schema = "schema"

class ModelType(str, Enum):
    ollama = "Ollama"
    claude = "Claude"

class SchemaField(BaseModel):
    name: str
    field_type: FieldTypePydantic
    description: Optional[str] = None
    required: bool = True
    list_item_type: Optional[FieldTypePydantic] = None
    default_value: Optional[Any] = None

class SchemaDefinition(BaseModel):
    name: str
    fields: List[SchemaField]

    def to_dict(self) -> dict:
        """Convert SchemaDefinition to a dictionary format"""
        return {
            "name": self.name,
            "fields": [
                {
                    "name": field.name,
                    "field_type": field.field_type,
                    "description": field.description,
                    "required": field.required,
                    "list_item_type": field.list_item_type,
                    "default_value": field.default_value
                }
                for field in self.fields
            ]
        }

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
    return_schema_list: bool = Field(
        default=False,
        description="If True, returns list of type Schema, else a single Schema"
    )
    model_type: ModelType = Field(
        default=ModelType.ollama,
        description="Type of model to use for processing (Ollama or Claude)"
    )
    local_model_name: str = Field(
        default="llama3.1:8b-instruct-q5_0",
        description="Name of the LLM model to use for processing. For Ollama only."
    )
    crawl_config: Optional[CrawlConfig] = CrawlConfig()
    scraper_config: Optional[ScraperConfig] = ScraperConfig()
    
