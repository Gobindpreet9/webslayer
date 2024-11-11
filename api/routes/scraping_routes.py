from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database.postgres_database import get_db
from core.adapters.postgres_adapter import PostgresAdapter
from core.tasks import scrape_urls
from api.models import JobRequest

router = APIRouter(
    prefix="/scrape",
    tags=["Web Scraping"],
    responses={404: {"description": "Not found"}}
)

async def get_schema_dict(db: AsyncSession, schema_name: str, return_as_list: bool = False) -> dict:
    """
    Gets a schema from the database in a dictionary format, optionally wrapping it in a list structure.
    """
    adapter = PostgresAdapter()
    schema = await adapter.get_schema_by_name(db, schema_name)
    
    base_schema = schema.to_dict()
    
    if not return_as_list:
        return base_schema
        
    return {
        "name": f"{schema.name}_list",
        "fields": [
            {
                "name": schema.name,
                "field_type": "list",
                "description": f"List of {schema.name} items",
                "required": True,
                "list_item_type": "schema",
                "item_schema": {
                    "name": schema.name,
                    "fields": base_schema["fields"]
                }
            }
        ]
    }

@router.post("/start")
async def start_job(job_request: JobRequest, db: AsyncSession = Depends(get_db)):
    """Start a new scraping job"""
    try:
        crawl_config = job_request.crawl_config.model_dump()
        scraper_config = job_request.scraper_config.model_dump()
        
        schema_dict = await get_schema_dict(db, job_request.schema_name, job_request.return_schema_list)

        # Start Celery task
        task = scrape_urls.delay(
            schema=schema_dict,
            urls=job_request.urls,
            model_type=job_request.model_type,
            local_model_name=job_request.local_model_name,
            crawl_config=crawl_config,
            scraper_config=scraper_config
        )
        
        return {
            "job_id": task.id,
            "status": "accepted",
            "message": "Job queued for processing"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start scraping job: {str(e)}"
        )

@router.get("/{job_id}")
async def get_job_status(job_id: str):
    """Get the status and result of a job"""
    task = scrape_urls.AsyncResult(job_id)
    
    if task.state == 'PENDING':
        response = {
            'status': 'pending',
            'job_id': job_id
        }
    elif task.state == 'FAILURE':
        response = {
            'status': 'failed',
            'job_id': job_id,
            'error': str(task.info)
        }
    else:
        response = {
            'status': task.state.lower(),
            'job_id': job_id,
            'result': task.info
        }
    
    return response 