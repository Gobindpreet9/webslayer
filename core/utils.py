import logging

from core.settings import Settings

class Utils:
    LOG_FILE_NAME: str = "webslayer-logs.log"

    @staticmethod
    def get_value_or_default(response, key, default, logger):
        if key in response:
            return response[key]
        else:
            logger.debug(f"Key {key} not found in {response}. Using default value.")
            return default
    
    
    @staticmethod
    def setup_logging(logger, is_debug):
        """
        Configures logging for application
        """
        logging_level = logging.DEBUG if is_debug else logging.INFO

        logger.handlers.clear()
        # Set logger level
        logger.setLevel(logging_level)

        # Create a file handler
        file_handler = logging.FileHandler(Utils.LOG_FILE_NAME, encoding='utf-8')
        file_handler.setLevel(logging.DEBUG)

        # Create a console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.DEBUG)

        # Create a formatter and set it for both handlers
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)

        # Add the handlers to the logger
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)

        logger.propagate = True