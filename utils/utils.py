class Utils:
    @staticmethod
    def get_value_or_default(response, key, default, logger):
        if key in response:
            return response[key]
        else:
            logger.debug(f"Key {key} not found in {response}. Using default value.")
            return default
