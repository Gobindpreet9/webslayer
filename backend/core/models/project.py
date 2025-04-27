import uuid
from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime

from .base import Base
from api.models.project import Project as ProjectPydantic # Import Pydantic model for conversion

class Project(Base):
    __tablename__ = "projects"

    name = Column(String(100), primary_key=True, nullable=False, index=True)
    urls = Column(ARRAY(String), nullable=False, default=[])
    llm_type = Column(String, nullable=False, default='ollama')
    llm_model_name = Column(String, nullable=False, default='llama3')
    schema_name = Column(String, nullable=False)
    crawl_config = Column(JSON, nullable=False, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def to_pydantic(self) -> ProjectPydantic:
        """Convert SQLAlchemy model instance to Pydantic model."""
        return ProjectPydantic(
            name=self.name,
            urls=[str(url) for url in self.urls], # Ensure URLs are strings
            llm_type=self.llm_type,
            llm_model_name=self.llm_model_name,
            schema_name=self.schema_name,
            crawl_config=self.crawl_config, # Already JSON/dict
            created_at=self.created_at,
            updated_at=self.updated_at,
        )
