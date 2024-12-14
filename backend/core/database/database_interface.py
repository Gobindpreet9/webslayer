from abc import ABC, abstractmethod
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession

class DatabaseInterface(ABC):
    """Interface for database operations"""
    
    @abstractmethod
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get database session"""
        pass
    
    @abstractmethod
    async def shutdown(self) -> None:
        """Cleanup database connections"""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check if database is healthy"""
        pass 