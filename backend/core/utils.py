import logging
from typing import Dict, Any, Type, List
from datetime import date
from pydantic import BaseModel
from pydantic.fields import Field
from pydantic.main import create_model


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

        logger.propagate = False

    @staticmethod
    def create_dynamic_model(schema_def: Dict[str, Any]) -> Type[BaseModel]:
        """
        Creates a Pydantic model dynamically from a schema definition
        """
        TYPE_MAP = {
            "string": str,
            "integer": int,
            "float": float,
            "boolean": bool,
            "list": List,
            "date": date,
            "schema": Dict[str, Any],
        }

        def create_field_model(field_def):
            field_type_str = field_def['field_type'].lower()
            list_item_type = field_def.get('list_item_type', None)
            field_type = TYPE_MAP.get(field_type_str)

            if not field_type:
                raise ValueError(f"Unsupported field type: {field_type_str}")

            if field_type_str == 'list' and list_item_type == 'schema':
                if 'item_schema' not in field_def:
                    raise ValueError("item_schema is required for list type with list_item_type 'schema'")
                
                inner_model = create_model(
                    f"{field_def['item_schema']['name']}Item",
                    **{
                        field['name']: (
                            TYPE_MAP.get(field['field_type'].lower()),
                            Field(
                                default=field.get('default_value'),
                                description=field.get('description'),
                            )
                        )
                        for field in field_def['item_schema']['fields']
                    }
                )
                return (
                    List[inner_model],
                    Field(
                        default=field_def.get('default_value'),
                        description=field_def.get('description'),
                    )
                )

            return (
                field_type,
                Field(
                    default=field_def.get('default_value'),
                    description=field_def.get('description'),
                )
            )

        fields = {}
        for field in schema_def['fields']:
            fields[field['name']] = create_field_model(field)

        return create_model(
            schema_def['name'],
            **fields
        )