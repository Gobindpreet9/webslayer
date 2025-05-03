import uuid
from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from core.database.postgres_database import Base
from api.models.project import Project as ProjectPydantic # Import Pydantic model for conversion

class Project(Base):
    __tablename__ = "projects"

    name = Column(String(100), primary_key=True, nullable=False, index=True)
    urls = Column(JSON, nullable=True, default=list)
    llm_type = Column(String, nullable=True, default='ollama')
    llm_model_name = Column(String, nullable=True, default='llama3')
    schema_name = Column(String, nullable=True)
    crawl_config = Column(JSON, nullable=True, default={})

    def to_pydantic(self) -> ProjectPydantic:
        """Convert SQLAlchemy model instance to Pydantic model."""
        return ProjectPydantic(
            name=self.name,
            urls=[str(url) for url in self.urls], # Ensure URLs are strings
            llm_type=self.llm_type,
            llm_model_name=self.llm_model_name,
            schema_name=self.schema_name,
            crawl_config=self.crawl_config, # Already JSON/dict
        )
