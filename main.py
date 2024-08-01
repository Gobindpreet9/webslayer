from schema.event_schema import EventSchema
from scraper.data_fetcher import DataFetcher
from scraper.scraper import Scraper
import urllib.robotparser
import logging

logger = logging.getLogger(__name__)
LOG_FILE_NAME = 'webslayer-logs.log'


def main(url, tags, schema):
    validator = setup_robots_validator(url)
    if validator and not validator.can_fetch("*", url):
        logger.debug("Access denied. Please check the robots.txt file.")
        return

    logger.info(f"Getting data from {url}.")
    fetcher = DataFetcher(logger)
    website_data = fetcher.get_data(url)

    logger.info(f"Scraped data:\n{website_data}")

    logger.info("Extracting data using LLM.")
    extractor = Scraper(schema, logger)
    extracted_data = extractor.extract(website_data)

    logger.info(f"Response:\n{extracted_data['generation']}")


def setup_robots_validator(url):
    """
    Configures validator using robots.txt for url permissions
    :param url: url to scrape
    """
    robots = urllib.robotparser.RobotFileParser()
    parsed_url = urllib.parse.urlparse(url)
    base_url = f"{parsed_url.scheme}://{parsed_url.netloc}/"
    robots.set_url(base_url + "robots.txt")
    robots.read()
    return robots


def setup_logging():
    """
    Configures logging for application
    """
    logger.setLevel(logging.DEBUG)

    # Create a file handler
    file_handler = logging.FileHandler(LOG_FILE_NAME, encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)

    # Create a console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)

    # Create a formatter and set it for both handlers
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)

    # Add the handlers to the logger
    logging.getLogger().handlers[0].setFormatter(formatter)  # root logger
    logger.addHandler(file_handler)


if __name__ == "__main__":
    victoria_buzz_url = "https://www.victoriabuzz.com/category/events/"  # access denied
    victoria_downtown_url = "https://events.downtownvictoria.ca/events/"  # access allowed
    setup_logging()
    main(victoria_downtown_url, ["span"], EventSchema)
