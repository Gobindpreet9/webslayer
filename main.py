from schema.event_schema import EventsSchema
from scraper.scraper import Scraper
import logging
from utils.config import Config

logger = logging.getLogger(__name__)


def main(urls, tags, schema):
    extractor = Scraper(schema, urls, logger, crawl_website=True, crawl_max_depth=2)
    extracted_data = extractor.extract()
    logger.info(f"Response:\n{extracted_data['generation']}")  # todo format the json to make it more readable


if __name__ == "__main__":
    victoria_buzz_url = "https://www.victoriabuzz.com/category/events/"  # access denied
    victoria_downtown_url = "https://events.downtownvictoria.ca/events/"  # access allowed
    Config.setup_logging(logger)
    main([victoria_downtown_url], ["span"], EventsSchema)
