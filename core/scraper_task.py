import logging
import traceback
from celery import Task
from fastapi import HTTPException
from core.celery_app import celery_app
from scraper.scraper import Scraper
from core.utils import Utils
import asyncio
from datetime import datetime, timezone
from core.database.postgres_database import get_db
from core.adapters.postgres_adapter import PostgresAdapter
from api.models import Report

logger = logging.getLogger(__name__)
Utils.setup_logging(logger, True)

class ScraperTask(Task):
    abstract = True
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.error(f"Task {task_id} failed: {exc}")
        logger.error(f"Exception Info: {einfo}")
        logger.error(f"Task Arguments: {args}")
        logger.error(f"Task Keyword Arguments: {kwargs}")
        if einfo:
            logger.error(f"Traceback:\n{einfo.traceback}")
        super().on_failure(exc, task_id, args, kwargs, einfo)

    def on_success(self, retval, task_id, args, kwargs):
        logger.info(f"Task {task_id} completed successfully")
        logger.debug(f"Task return value: {retval}")
        super().on_success(retval, task_id, args, kwargs)

@celery_app.task(bind=True, base=ScraperTask)
def scrape_urls(self, schema, schema_name, urls, model_type, local_model_name, crawl_config, scraper_config):
    try:
        logger.info(f"Starting scraping task with config: model_type={model_type}, urls={urls}")
        loop = asyncio.get_event_loop()
        scraper = loop.run_until_complete(Scraper.create(
            schema=schema,
            urls_to_search=urls,
            model_type=model_type,
            local_model_name=local_model_name,
            logger=logger,
            crawl_config=crawl_config,
            scraper_config=scraper_config
        ))
        result = loop.run_until_complete(scraper.extract())
        logger.info(f"Scraping completed successfully")
        logger.debug(f"Scraping result: {result}")

        return {
            'status': 'completed',
            'result': result,
            'schema_name': schema_name
        }
    except HTTPException as e:
        return {
            'status': 'failed',
            'error': str(e.detail),
            'status_code': e.status_code
        }
    except Exception as e:
        logger.error(f"Unexpected error: {traceback.format_exc()}")
        return {
            'status': 'failed',
            'error': "An unexpected error occurred while processing your request. Please try again or contact support if the issue persists.",
            'status_code': 500
        }