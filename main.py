from schema.event_schema import EventSchema
from scraper.data_fetcher import DataFetcher
from scraper.scraper import Scraper
import urllib.robotparser


def main(url, tags, schema):
    validator = setup_robots_validator(url)
    if validator and not validator.can_fetch("*", url):
        print("Access denied. Please check the robots.txt file.")
        return

    print(f"Getting data from {url}.")
    fetcher = DataFetcher()
    website_data = fetcher.get_data(url)
    print(f"Scraped data:\n{website_data}")

    print("Extracting data using LLM.")
    extractor = Scraper(schema)
    extracted_data = extractor.extract(website_data)
    print(f"Response:\n{extracted_data}")


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


if __name__ == "__main__":
    victoria_buzz_url = "https://www.victoriabuzz.com/category/events/" # access denied
    victoria_downtown_url = "https://events.downtownvictoria.ca/events/" # access allowed
    main(victoria_downtown_url, ["span"], EventSchema)
