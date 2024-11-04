from typing import Dict, Type
from pydantic import BaseModel, create_model
from api.models import SchemaDefinition, SchemaField, FieldType
from fastapi import HTTPException

class SchemaRegistry:

    @classmethod
    async def register(cls, schema_def: SchemaDefinition):
        """Register a new schema"""
        try:
            dynamic_model = cls._create_dynamic_model(schema_def)
            # TODO: Push to DB. If it already exists update it
            return {
                "status": "success",
                "message": f"Schema '{schema_def.name}' registered successfully"
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    async def get(cls, schema_name: str):
        """Get a registered schema"""
        # TODO: Fetch from db
        raise HTTPException(
            status_code=404,
            detail=f"Schema '{schema_name}' not found"
        )
    
    @classmethod
    async def get(cls):
        """Get a registered schema"""
        # TODO: Fetch from db
        raise HTTPException(
            status_code=404,
            detail="Unable to find any schema"
        )

    @staticmethod
    def _create_dynamic_model(schema_def: SchemaDefinition) -> Type[BaseModel]:
        """Create a Pydantic model dynamically based on schema definition"""
        # Implementation of create_dynamic_model from your original code
        pass 