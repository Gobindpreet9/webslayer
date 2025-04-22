from enum import Enum

class FieldTypePydantic(str, Enum):
    string = "string"
    integer = "integer"
    float = "float"
    boolean = "boolean"
    list = "list"
    date = "date"
    schema = "schema"

class ModelType(str, Enum):
    ollama = "Ollama"
    claude = "Claude"
    openai = "OpenAI"
    gemini = "Gemini"