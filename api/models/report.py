from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ReportMetadata(BaseModel):
    name: str = Field(..., description="Unique name of the report")
    schema_name: str = Field(..., description="Name of the related schema")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Report(ReportMetadata):
    content: dict = Field(..., min_length=1)

class ReportFilter(BaseModel):
    schema_name: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    limit: int = Field(default=10, ge=1, le=100) 