from typing import List, Optional
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from api.models import SchemaDefinition as SchemaDefinitionPydantic, Report as ReportPydantic, ReportFilter
from api.models.report import ReportMetadata
from api.models.project import Project as ProjectPydantic
from core.adapters.data_adapter_interface import DataAdapterInterface
from core.models.schema import SchemaDefinition, SchemaField
from core.models.project import Project as ProjectDBModel
from core.models.report import Report
from sqlalchemy.orm import selectinload
import uuid
from datetime import datetime

class PostgresAdapter(DataAdapterInterface):
    async def get_all_schemas(self, db: AsyncSession) -> List[SchemaDefinitionPydantic]:
        try:
            result = await db.execute(select(SchemaDefinition.name))
            names = result.scalars().all()
            return names
        except HTTPException:
            # Re-raise HTTP exceptions to be handled by FastAPI
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Database error: {str(e)}"
            )

    async def get_schema_by_name(self, db: AsyncSession, name: str) -> SchemaDefinitionPydantic:
        try:
            result = await db.execute(
                select(SchemaDefinition).where(SchemaDefinition.name == name).options(selectinload(SchemaDefinition.fields))
            )
            schema = result.scalar_one_or_none()
            if schema is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Schema with name '{name}' not found."
                )
            return schema.to_pydantic()
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Database error: {str(e)}"
            )

    async def upsert_schema(self, db: AsyncSession, schema: SchemaDefinitionPydantic) -> SchemaDefinitionPydantic:
        try:
            async with db.begin():
                db_schema = SchemaDefinition(
                    name=schema.name,
                    fields=[
                        SchemaField(**field.model_dump())
                        for field in schema.fields
                    ]
                )
                db_schema = await db.merge(db_schema)
                return db_schema.to_pydantic()
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Database error: {str(e)}"
            )
    
    async def delete_schema(self, db: AsyncSession, name: str) -> bool:
        """Delete a schema"""
        try:
            result = await db.execute(delete(SchemaDefinition).where(SchemaDefinition.name == name))
            await db.commit()
            return result.rowcount > 0
        except HTTPException:
            raise
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Database error: {str(e)}"
            )

    async def create_report(self, db: AsyncSession, report: ReportPydantic) -> ReportPydantic:
        try:
            schema_exists = await db.execute(
                select(SchemaDefinition).where(SchemaDefinition.name == report.schema_name)
            )
            if not schema_exists.scalar_one_or_none():
                raise HTTPException(
                    status_code=404,
                    detail=f"Schema '{report.schema_name}' not found"
                )

            db_report = Report(
                name=report.name,
                schema_name=report.schema_name,
                content=report.content,
            )
            db.add(db_report)
            await db.commit()
            await db.refresh(db_report)
            return db_report
        except HTTPException:
            raise
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create report: {str(e)}"
            )

    async def get_report_by_name(self, db: AsyncSession, name: str) -> ReportPydantic:
        try:
            result = await db.execute(
                select(Report).where(Report.name == name)
            )
            report = result.scalar_one_or_none()
            if not report:
                raise HTTPException(
                    status_code=404,
                    detail=f"Report '{name}' not found"
                )
            return report.to_pydantic()
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to retrieve report: {str(e)}"
            )

    async def get_reports(self, db: AsyncSession, filters: ReportFilter) -> List[ReportMetadata]:
        try:
            query = select(
                Report.name,
                Report.schema_name,
                Report.timestamp,
                Report.created_at
            )
            if filters.schema_name:
                query = query.where(Report.schema_name == filters.schema_name)
            if filters.start_time:
                query = query.where(Report.timestamp >= filters.start_time)
            if filters.end_time:
                query = query.where(Report.timestamp <= filters.end_time)
            
            query = query.order_by(Report.timestamp.desc())
            query = query.limit(filters.limit)
            
            result = await db.execute(query)
            reports = result.all()
            return [
                ReportMetadata(
                    name=report.name,
                    schema_name=report.schema_name,
                    timestamp=report.timestamp
                ) 
                for report in reports
            ]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to retrieve reports: {str(e)}"
            )

    async def delete_report(self, db: AsyncSession, name: str) -> bool:
        try:
            result = await db.execute(
                delete(Report).where(Report.name == name)
            )
            await db.commit()
            return result.rowcount > 0
        except HTTPException:
            raise
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to delete report: {str(e)}"
            )

    # --- Project CRUD Methods ---

    async def upsert_project(self, db: AsyncSession, project: ProjectPydantic) -> ProjectPydantic:
        try:
            async with db.begin():
                schema_exists = await db.execute(
                    select(SchemaDefinition).where(SchemaDefinition.name == project.schema_name)
                    )
                if not schema_exists.scalar_one_or_none():
                    raise HTTPException(
                        status_code=404,
                        detail=f"Schema '{report.schema_name}' not found"
                    )
                # Convert HttpUrl objects to strings for JSON serialization
                urls_as_strings = [str(url) for url in project.urls]

                db_project = ProjectDBModel(
                    name=project.name,
                    urls=urls_as_strings, # Use the converted list
                    llm_type=project.llm_type,
                    llm_model_name=project.llm_model_name,
                    schema_name=project.schema_name,
                    crawl_config=project.crawl_config # Pass the dict directly
                )
                merged_project = await db.merge(db_project)
                pydantic_project = merged_project.to_pydantic()
                return pydantic_project 
        except HTTPException as http_exc:
            await db.rollback() 
            raise http_exc
        except Exception as e:
            await db.rollback()
            # Add more specific error logging if needed
            import traceback
            print(f"Error during upsert_project: {traceback.format_exc()}") 
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upsert project: {str(e)}" 
            )

    async def get_project_by_name(self, db: AsyncSession, project_name: str) -> Optional[ProjectPydantic]:
        try:
            result = await db.execute(select(ProjectDBModel).filter(ProjectDBModel.name == project_name))
            db_project = result.scalar_one_or_none()
            return db_project.to_pydantic() if db_project else None
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to retrieve project: {str(e)}"
            )

    async def get_all_projects(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[ProjectPydantic]:
        try:
            result = await db.execute(
                select(ProjectDBModel).offset(skip).limit(limit)
            )
            projects = result.scalars().all()
            return [project.to_pydantic() for project in projects]
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to retrieve projects: {str(e)}"
            )

    async def update_project(self, db: AsyncSession, project_name: str, project_update: ProjectPydantic) -> ProjectPydantic:
        try:
            existing_project_sql = await db.scalar(
                select(ProjectDBModel).where(ProjectDBModel.name == project_name)
            )
            if not existing_project_sql:
                raise HTTPException(status_code=404, detail=f"Project '{project_name}' not found")

            update_data = project_update.model_dump(exclude_unset=True)

            if update_data: 
                update_data['updated_at'] = datetime.utcnow()
                stmt = (
                    update(ProjectDBModel)
                    .where(ProjectDBModel.name == project_name) 
                    .values(**update_data)
                    .returning(ProjectDBModel)
                )
                result = await db.execute(stmt)
                updated_project_sql = result.scalar_one()
                await db.commit()
                return updated_project_sql.to_pydantic()
            else:
                return existing_project_sql.to_pydantic()

        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update project: {str(e)}"
            )

    async def delete_project(self, db: AsyncSession, project_name: str) -> bool:
        try:
            result = await db.execute(
                delete(ProjectDBModel).where(ProjectDBModel.name == project_name) 
            )
            await db.commit()
            return result.rowcount > 0
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to delete project: {str(e)}"
            )