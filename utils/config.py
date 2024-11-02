import logging
from enum import Enum
import getpass
import os
from schema.event_schema import EventsSchema
from langchain.globals import set_debug
from schema.philosophers_schema import Philosophers


class Model(Enum):
    Ollama = 'ollama'
    Anthropic = 'anthropic'


class Config:
    DEBUG = True

    # ollama pull MODEL_ID before use
    MODEL_ID_PHI = "phi3:instruct"
    MODEL_ID_LLAMA = "llama3.1:8b-instruct-q5_0"
    MODEL_MISTRAL = "mistral-nemo:12b-instruct-2407-q4_0"
    MODEL_GEMMA = "gemma2:27b-instruct-q3_K_M"
    FORBIDDEN_EVENTS_URL = "https://www.victoriabuzz.com/category/events/"
    EVENTS_URL = "https://events.downtownvictoria.ca/events/"
    PHILOSOPHY_URL = "https://avestura.dev/blog/tldr-goat-philosophers"

    # Model configuration
    MODEL_TO_USE = Model.Ollama
    if MODEL_TO_USE == Model.Anthropic:
        os.environ["ANTHROPIC_API_KEY"] = getpass.getpass("Enter your ANTHROPIC_API_KEY: ")
    LOCAL_MODEL = MODEL_ID_LLAMA

    # Logger configuration
    LOG_FILE_NAME = 'webslayer-logs.log'
    # debug logging level if DEBUG = True
    LOGGING_LEVEL = logging.DEBUG if DEBUG else logging.INFO
    # set_debug(DEBUG) # enables logs for langchain

    # Scraper configuration
    CRAWL_WEBSITE = False
    CRAWL_MAX_DEPTH = 2
    MAX_URLS_TO_SEARCH = 3
    MAX_HALLUCINATION_CHECKS = 2
    MAX_QUALITY_CHECKS = 2
    # Chunking provides better results for small local models with slower performance, use for larger models if required
    ENABLE_CHUNKING = True if MODEL_TO_USE == Model.Ollama else False
    CHUNK_SIZE = 5000  # Split documents into chunks if too large
    CHUNK_OVERLAP_SIZE = 100
    CHUNKING_THRESHOLD = 5000  # Split documents if larger than CHUNKING_THRESHOLD
    URLS = [PHILOSOPHY_URL]
    SCHEMA = Philosophers
