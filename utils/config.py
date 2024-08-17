import logging

from schema.event_schema import EventsSchema


class Config:
    # ollama pull MODEL_ID before use
    MODEL_ID_PHI = "phi3:instruct"
    MODEL_ID_LLAMA = "llama3.1:8b-instruct-q4_0"

    FORBIDDEN_EVENTS_URL = "https://www.victoriabuzz.com/category/events/"
    EVENTS_URL = "https://events.downtownvictoria.ca/events/"

    # Model configuration
    MODEL_TO_USE = MODEL_ID_LLAMA

    # Logger configuration
    LOG_FILE_NAME = 'webslayer-logs.log'
    LOGGING_LEVEL = logging.INFO

    # Scraper configuration
    CRAWL_WEBSITE = True
    CRAWL_MAX_DEPTH = 2
    MAX_URLS_TO_SEARCH = 3
    URLS = [EVENTS_URL]
    SCHEMA = EventsSchema
