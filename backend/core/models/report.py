from sqlalchemy import DateTime, String, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from sqlalchemy.sql import func

from core.database.postgres_database import Base
from core.models.base import CreatedAtMixin
from api.models import Report as ReportPydantic

class Report(Base, CreatedAtMixin):
    __tablename__ = "reports"

    name: Mapped[str] = mapped_column(String(255), primary_key=True)
    schema_name: Mapped[str] = mapped_column(String(255), ForeignKey("schema_definitions.name"))
    content: Mapped[dict] = mapped_column(JSON)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
        nullable=False
    )

    def to_pydantic(self) -> ReportPydantic:
        """Convert SQLAlchemy model to Pydantic model"""
        return ReportPydantic(
            name=self.name,
            schema_name=self.schema_name,
            content=self.content,
            timestamp=self.timestamp
        )
