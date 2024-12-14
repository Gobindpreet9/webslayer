from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ReportBase(BaseModel):
    name: str = Field(..., description="Unique name of the report")
    schema_name: str = Field(..., description="Name of the related schema")

class ReportMetadata(ReportBase):
    timestamp: datetime = Field(default_factory=datetime.utcnow, frozen=True)

class ReportCreate(ReportBase):
    content: dict = Field(..., min_length=1)

class Report(ReportCreate, ReportMetadata):
    pass
 
class ReportFilter(BaseModel):
    schema_name: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    limit: int = Field(default=10, ge=1, le=100) 