from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from core.database.postgres_database import get_db
from core.adapters.postgres_adapter import PostgresAdapter
from api.models import SchemaDefinition
from api.examples.schema_examples import SCHEMA_EXAMPLES

router = APIRouter(
    prefix="/schema",
    tags=["Schemas"],
    responses={404: {"description": "Not found"}}
)

@router.get("/")
async def get_schemas(db: AsyncSession = Depends(get_db)):
    """Gets all the existing schema names from the db"""
    adapter = PostgresAdapter()
    return await adapter.get_all_schemas(db)

@router.get("/{schema_name}")
async def get_schema(schema_name: str, db: AsyncSession = Depends(get_db)):
    """Get a registered schema definition"""
    adapter = PostgresAdapter()
    return await adapter.get_schema_by_name(db, schema_name)

@router.post("/",
    response_model=SchemaDefinition,
    responses={404: {"description": "Not found"}},
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "examples": SCHEMA_EXAMPLES
                }
            }
        }
    }
)
async def register_schema(schema_def: SchemaDefinition, db: AsyncSession = Depends(get_db)):
    """Adds a new schema definition or updates an existing one"""
    adapter = PostgresAdapter()
    return await adapter.upsert_schema(db, schema_def)

@router.delete("/{schema_name}")
async def delete_schema(schema_name: str, db: AsyncSession = Depends(get_db)):
    """Delete a registered schema definition"""
    adapter = PostgresAdapter()
    return await adapter.delete_schema(db, schema_name)