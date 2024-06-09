from schema.event_schema import EventSchema
from scraper.data_fetcher import DataFetcher
from scraper.scraper import Scraper


def main(url, tags, schema):
    print(f"Getting data from {url}.")
    fetcher = DataFetcher()
    website_data = fetcher.get_data(url)
    print(f"Scraped data:\n{website_data}")

    print("Extracting data using LLM.")
    extractor = Scraper(schema)
    extracted_data = extractor.extract(website_data)
    print(f"Response:\n{extracted_data}")


if __name__ == "__main__":
    victoria_buzz_url = "https://www.victoriabuzz.com/category/events/"
    main(victoria_buzz_url, ["span"], EventSchema)
