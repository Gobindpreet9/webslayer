from typing import List
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from api.models import SchemaDefinition as SchemaDefinitionPydantic, Report as ReportPydantic, ReportFilter
from api.models.report import ReportMetadata
from core.adapters.data_adapter_interface import DataAdapterInterface
from core.models.schema import SchemaDefinition, SchemaField
from sqlalchemy.orm import selectinload
from core.models.report import Report

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
                timestamp=report.timestamp
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