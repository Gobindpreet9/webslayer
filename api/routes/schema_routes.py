from fastapi import APIRouter
from ..models import SchemaDefinition
from core.schema_registry import SchemaRegistry

router = APIRouter(
    prefix="/schema",
    tags=["Schema Management"],
    responses={404: {"description": "Not found"}}
)

@router.post("/")
async def register_schema(schema_def: SchemaDefinition):
    """Adds a new schema definition or updates an existing one"""
    return await SchemaRegistry.register(schema_def)

@router.get("/")
async def get_schema():
    """Gets all the existing schemas from the db"""
    return await SchemaRegistry.get() 

@router.get("/{schema_name}")
async def get_schema(schema_name: str):
    """Get a registered schema definition"""
    return await SchemaRegistry.get(schema_name) 