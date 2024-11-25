from .schema_routes import router as schema_router
from .scrape_routes import router as scraping_router
from .reports_routes import router as reports_router

__all__ = ["schema_router", "scraping_router", "reports_router"]