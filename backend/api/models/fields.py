from pydantic import BaseModel
from typing import Optional, Any
from .enums import FieldTypePydantic

class SchemaField(BaseModel):
    name: str
    field_type: FieldTypePydantic
    description: Optional[str] = None
    required: bool = True
    list_item_type: Optional[FieldTypePydantic] = None
    default_value: Optional[Any] = None 