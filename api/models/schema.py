from pydantic import BaseModel
from typing import List
from .fields import SchemaField

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