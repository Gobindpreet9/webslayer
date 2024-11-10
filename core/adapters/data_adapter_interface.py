from abc import ABC, abstractmethod
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from api.models import SchemaDefinition

class DataAdapterInterface(ABC):
    """Interface for database adapters"""
    
    @abstractmethod
    async def get_all_schemas(self, db: AsyncSession) -> List[SchemaDefinition]:
        """Get all schemas from the database"""
        pass
    
    @abstractmethod
    async def get_schema_by_name(self, db: AsyncSession, name: str) -> Optional[SchemaDefinition]:
        """Get a specific schema by name"""
        pass
    
    @abstractmethod
    async def create_schema(self, db: AsyncSession, schema: SchemaDefinition) -> SchemaDefinition:
        """Create a new schema"""
        pass
    
    @abstractmethod
    async def delete_schema(self, db: AsyncSession, name: str) -> bool:
        """Delete a schema"""
        pass 