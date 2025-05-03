from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

# Import the actual database session dependency and the adapter
from core.database.postgres_database import get_db
from core.adapters.postgres_adapter import PostgresAdapter
from api.models.project import Project, ProjectBase
from core.models.project import Project as ProjectDBModel

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
)

@router.post("/")
async def create_project(project: Project, db: AsyncSession = Depends(get_db)):
    """Create or update a project using PostgresAdapter."""
    adapter = PostgresAdapter()
    db_project = ProjectDBModel(**project.model_dump())
    return await adapter.upsert_project(db, db_project)

@router.get("/", response_model=List[Project])
async def get_projects(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    """Retrieve a list of projects using PostgresAdapter."""
    adapter = PostgresAdapter()
    projects = await adapter.get_all_projects(db, skip=skip, limit=limit)
    return projects

@router.get("/{project_name}", response_model=Project)
async def get_project(project_name: str, db: AsyncSession = Depends(get_db)):
    """Retrieve a specific project by its name using PostgresAdapter."""
    adapter = PostgresAdapter()
    project = await adapter.get_project_by_name(db, project_name)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project '{project_name}' not found")
    return project

@router.delete("/{project_name}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_name: str, db: AsyncSession = Depends(get_db)):
    """Delete a project using PostgresAdapter."""
    adapter = PostgresAdapter()
    deleted = await adapter.delete_project(db, project_name)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project '{project_name}' not found")
    return None
