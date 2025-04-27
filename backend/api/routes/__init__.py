from .schema import router as schema_router
from .scraping import router as scraping_router
from .reports import router as reports_router
from .project import router as project_router

__all__ = [
    "schema_router",
    "scraping_router",
    "reports_router",
    "project_router",
]