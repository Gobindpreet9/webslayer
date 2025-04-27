from contextlib import asynccontextmanager
from fastapi import FastAPI
import logging
import uvicorn

from api.routes import schema_router, scraping_router, reports_router, project_router
from core.settings import Settings
from core.utils import Utils
from core.database.postgres_database import db

settings = Settings()

logger = logging.getLogger(__name__)
Utils.setup_logging(logger, settings.DEBUG)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up WebSlayer API")
    yield
    logger.info("Shutting down WebSlayer API")
    await db.shutdown()

# Initialize FastAPI with lifespan
app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION,
    lifespan=lifespan,
    servers=[]
)

# Include routers
app.include_router(schema_router, prefix="/webslayer")
app.include_router(scraping_router, prefix="/webslayer")
app.include_router(reports_router, prefix="/webslayer")
app.include_router(project_router, prefix="/webslayer")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )