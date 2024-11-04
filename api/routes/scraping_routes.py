from fastapi import APIRouter, HTTPException
from ..models import JobRequest

router = APIRouter(
    prefix="/scrape",
    tags=["Web Scraping"],
    responses={404: {"description": "Not found"}}
)

@router.post("/start")
async def start_job(job_request: JobRequest):
    """Start a new job with specified schema and configuration"""
    # TODO: Placeholder response until Celery is implemented
    return {
        "job_id": "placeholder_id",
        "status": "accepted",
        "message": "Job queued for processing"
    }

@router.get("/{job_id}")
async def get_job_status(job_id: str):
    """Get the status of a job"""
    # TODO: Placeholder response until Celery is implemented
    return {
        "job_id": job_id,
        "status": "processing"
    } 