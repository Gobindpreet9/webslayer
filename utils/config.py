import logging


class Config:
    # ollama pull MODEL_ID before use
    MODEL_ID_PHI = "phi3:instruct"
    MODEL_ID_LLAMA = "llama3.1:8b-instruct-q8_0"

    MODEL_TO_USE = MODEL_ID_LLAMA

    LOG_FILE_NAME = 'webslayer-logs.log'

    @staticmethod
    def setup_logging(logger):
        """
        Configures logging for application
        """
        logger.setLevel(logging.DEBUG)

        # Create a file handler
        file_handler = logging.FileHandler(Config.LOG_FILE_NAME, encoding='utf-8')
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
