from pydantic import BaseModel

event_schema = {
    "properties": {
        "event_name": {"type": "string"},
        "date": {"type": "date"},
        "description": {"type": "string"},
        "type": {"type": "string"}
    },
    "required": ["event_name", "date", "description"],
}