import os
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from core.database.postgres_database import get_db
from core.adapters.postgres_adapter import PostgresAdapter
from api.models import Report, ReportFilter
import json
import tempfile
from datetime import datetime

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
    responses={404: {"description": "Not found"}}
)

@router.get("/", response_model=List[Report])
async def list_reports(
    schema_name: Optional[str] = Query(None),
    start_time: Optional[datetime] = Query(None),
    end_time: Optional[datetime] = Query(None),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get list of reports with optional filtering"""
    adapter = PostgresAdapter()
    filters = ReportFilter(
        schema_name=schema_name,
        start_time=start_time,
        end_time=end_time,
        limit=limit
    )
    return await adapter.get_reports(db, filters)

@router.get("/{name}", response_model=Report)
async def get_report(name: str, db: AsyncSession = Depends(get_db)):
    """Get a specific report by name"""
    adapter = PostgresAdapter()
    return await adapter.get_report_by_name(db, name)

@router.get("/file/{name}")
async def download_report(name: str, db: AsyncSession = Depends(get_db)):
    """Download report as a JSON file"""
    adapter = PostgresAdapter()
    report = await adapter.get_report_by_name(db, name)
    
    # Create a temporary file
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as tmp_file:
        json.dump(report.content, tmp_file, indent=2)
        tmp_file_path = tmp_file.name
    
    return FileResponse(
        path=tmp_file_path,
        filename=f"{name}.json",
        media_type='application/json',
        background=BackgroundTask(lambda: os.unlink(tmp_file_path))
    )

@router.delete("/{name}")
async def delete_report(name: str, db: AsyncSession = Depends(get_db)):
    """Delete a specific report"""
    adapter = PostgresAdapter()
    deleted = await adapter.delete_report(db, name)
    if not deleted:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"message": "Report deleted successfully"}

@router.post("/", response_model=Report, include_in_schema=False)
async def create_report(report: Report, db: AsyncSession = Depends(get_db)):
    """Create a new report. Hidden API for testing purposes."""
    adapter = PostgresAdapter()
    return await adapter.create_report(db, report) 