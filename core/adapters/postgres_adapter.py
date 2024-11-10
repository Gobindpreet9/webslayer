from typing import List
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from api.models import SchemaDefinition as SchemaDefinitionPydantic
from core.adapters.data_adapter_interface import DataAdapterInterface
from core.models.schema import SchemaDefinition, SchemaField
from sqlalchemy.orm import selectinload

class PostgresAdapter(DataAdapterInterface):
    async def get_all_schemas(self, db: AsyncSession) -> List[SchemaDefinitionPydantic]:
        try:
            result = await db.execute(select(SchemaDefinition.name))
            names = result.scalars().all()
            return names
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Database error: {str(e)}"
            )

    async def get_schema_by_name(self, db: AsyncSession, name: str) -> SchemaDefinitionPydantic:
        try:
            result = await db.execute(
                select(SchemaDefinition).where(SchemaDefinition.name == name).options(selectinload(SchemaDefinition.fields))
            )
            schema = result.scalar_one_or_none()
            if schema is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Schema with name '{name}' not found."
                )
            return schema.to_pydantic()
        except HTTPException:
            # Re-raise HTTP exceptions to be handled by FastAPI
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Database error: {str(e)}"
            )

    async def create_schema(self, db: AsyncSession, schema: SchemaDefinitionPydantic) -> SchemaDefinitionPydantic:
        try:
            async with db.begin():
                db_schema = SchemaDefinition(
                    name=schema.name,
                    fields=[
                        SchemaField(**field.model_dump())
                        for field in schema.fields
                    ]
                )
                db.add(db_schema)
                await db.flush()
                await db.refresh(db_schema, attribute_names=["fields"])
                return db_schema.to_pydantic()
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Database error: {str(e)}"
            )
    
    async def delete_schema(self, db: AsyncSession, name: str) -> bool:
        """Delete a schema"""
        try:
            result = await db.execute(delete(SchemaDefinition).where(SchemaDefinition.name == name))
            await db.commit()
            return result.rowcount > 0
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Database error: {str(e)}"
            )