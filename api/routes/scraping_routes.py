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

@router.post("/start")
async def start_job(job_request: JobRequest, db: AsyncSession = Depends(get_db)):
    """Start a new scraping job"""
    try:
        adapter = PostgresAdapter()
        schema = await adapter.get_schema_by_name(db, job_request.schema_name)
        
        crawl_config = job_request.crawl_config.model_dump()
        scraper_config = job_request.scraper_config.model_dump()
        schema_dict = {
            "name": schema.name,
            "fields": [
            {
                "name": field.name,
                "field_type": field.field_type,
                "description": field.description,
                "required": field.required,
                "list_item_type": field.list_item_type,
                "default_value": field.default_value
            }
            for field in schema.fields
            ]
        }

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