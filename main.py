from schema.event_schema import EventsSchema
from scraper.scraper import Scraper
import logging
from utils.config import Config
from utils.utils import Utils
import json

logger = logging.getLogger(__name__)


def main(urls, schema):
    scraper = Scraper(schema, urls, logger, Config.CRAWL_WEBSITE, Config.CRAWL_MAX_DEPTH)
    extracted_data = scraper.extract()
    formatted_response = json.dumps(extracted_data, indent=4)
    logger.info(f"Response:\n{formatted_response}")


if __name__ == "__main__":
    Utils.setup_logging(logger)
    main(Config.URLS, Config.SCHEMA)
