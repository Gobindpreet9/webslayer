import logging
from enum import Enum
import getpass
import os
from schema.event_schema import EventsSchema
from langchain.globals import set_debug
from schema.philosophers_schema import Philosophers


class Model(Enum):
    Local = 'local'
    Anthropic = 'anthropic'


class Config:
    DEBUG = True

    # ollama pull MODEL_ID before use
    MODEL_ID_PHI = "phi3:instruct"
    MODEL_ID_LLAMA = "llama3.1:8b-instruct-q8_0"
    MODEL_MISTRAL = "mistral-nemo:12b-instruct-2407-q4_0"
    # todo: add anthropic or openai support
    FORBIDDEN_EVENTS_URL = "https://www.victoriabuzz.com/category/events/"
    EVENTS_URL = "https://events.downtownvictoria.ca/events/"
    PHILOSOPHY_URL = "https://avestura.dev/blog/tldr-goat-philosophers"

    # Model configuration
    MODEL_TO_USE = Model.Anthropic
    # Set your API key and uncomment if using Anthropic
    os.environ["ANTHROPIC_API_KEY"] = getpass.getpass("Enter your ANTHROPIC_API_KEY: ")
    LOCAL_MODEL = MODEL_ID_LLAMA

    # Logger configuration
    LOG_FILE_NAME = 'webslayer-logs.log'
    # debug logging level if DEBUG = True
    LOGGING_LEVEL = logging.DEBUG if DEBUG else logging.INFO
    # set_debug(DEBUG) # enables logs for langchain

    # Scraper configuration
    CRAWL_WEBSITE = True
    CRAWL_MAX_DEPTH = 2
    MAX_URLS_TO_SEARCH = 3
    URLS = [PHILOSOPHY_URL]
    SCHEMA = Philosophers
    # todo: add max hallucination check count and quality check count configuration
