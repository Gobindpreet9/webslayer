from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text

from core.settings import Settings
from core.database.database_interface import DatabaseInterface

class Base(DeclarativeBase):
    """Base class for SQLAlchemy models"""
    pass

class PostgresDatabase(DatabaseInterface):
    def __init__(self, settings: Settings):
        self.settings = settings
        self.engine = create_async_engine(
            settings.database_url,
            echo=settings.DEBUG,
        )
        self.async_session = async_sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False
        )

    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get database session"""
        async with self.async_session() as session:
            try:
                yield session
            finally:
                await session.close()

    async def shutdown(self) -> None:
        """Cleanup database connections"""
        await self.engine.dispose()
    
    async def health_check(self) -> bool:
        """Check if database is healthy"""
        try:
            async with self.engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
                await conn.commit()
                return True
        except Exception:
            return False

# Factory for creating database instances
class DatabaseFactory:
    @staticmethod
    def create_database(settings: Settings) -> DatabaseInterface:
        return PostgresDatabase(settings)

# Create database instance
settings = Settings()
db = DatabaseFactory.create_database(settings)

# Dependency for routes
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in db.get_session():
        yield session 