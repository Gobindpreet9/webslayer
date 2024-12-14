from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from api.models.report import Report
from core.database.postgres_database import get_db
from core.adapters.postgres_adapter import PostgresAdapter
from core.scraper_task import scrape_urls
from api.models import JobRequest
from datetime import datetime, timezone

router = APIRouter(
    prefix="/scrape",
    tags=["Scrape"],
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

@router.post("/start", 
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "example": {
                        "urls": ["https://example.com"],
                        "schema_name": "schema_name",
                        "return_schema_list": True
                    }
                }
            }
        }
    }
)
async def start_job(job_request: JobRequest, db: AsyncSession = Depends(get_db)):
    """Start a new scraping job"""
    try:
        crawl_config = job_request.crawl_config.model_dump()
        scraper_config = job_request.scraper_config.model_dump()
        
        schema_dict = await get_schema_dict(db, job_request.schema_name, job_request.return_schema_list)

        # Start Celery task
        task = scrape_urls.delay(
            schema=schema_dict,
            schema_name=job_request.schema_name,
            urls=job_request.urls,
            model_type=job_request.llm_model_type,
            model_name=job_request.llm_model_name,
            crawl_config=crawl_config,
            scraper_config=scraper_config
        )
        
        return {
            "job_id": task.id,
            "message": "Job queued for processing"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start scraping job: {str(e)}"
        )

@router.get("/{job_id}")
async def get_job_status(job_id: str, db: AsyncSession = Depends(get_db)):
    """Get the status and result of a job"""
    task = scrape_urls.AsyncResult(job_id)
    
    if task.state == 'PENDING':
        response = {
            'status': 'pending'
        }
    elif task.state == 'FAILURE' or task.info.get('status') == 'failed':
        response = {
            'status': 'failed',
            'error': str(task.info)
        }
    elif task.state == 'SUCCESS' and task.info.get('status') == 'completed':
        try:
            # Create report name using timestamp
            report_name = f"{task.info.get('schema_name')}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
            
            # Create report object
            report = Report(
                name=report_name,
                schema_name=task.info.get('schema_name'),
                content=task.info.get('result')
            )

            # Save report
            adapter = PostgresAdapter()
            print(f"Report object: {report}")
            await adapter.create_report(db, report)

            response = {
                'status': 'success',
                'report_name': report_name
            }
        except Exception as e:
            response = {
                'status': 'failed',
                'error': f"Failed to create report: {str(e)}"
            }
    else:
        response = {
            'status': task.state.lower(),
            'result': task.info,
            'error': "Unexpected task state. Please contact support."
        }
    
    return response 