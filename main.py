from scraper.data_fetcher import DataFetcher
from schema.event_schema import event_schema


def main(url, tags, schema):
    print(f"Getting data from {url}")

    fetcher = DataFetcher()
    website_data = fetcher.get_data(url);
    print(website_data)

    print("Extracting data using LLM")


if __name__ == "__main__":
    victoria_buzz_url = "https://www.victoriabuzz.com/category/events/"
    main(victoria_buzz_url, ["span"], event_schema)
