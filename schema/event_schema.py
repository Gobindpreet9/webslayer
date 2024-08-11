from langchain_core.pydantic_v1 import BaseModel, Field
from typing import List


class EventSchema(BaseModel):
    event_name: str = Field(description="Name of the event")
    event_date: str = Field(default=None, description="Date of the event.")
    description: str = Field(description="Description of the event")
    event_tags: str = Field(description="Tags that can be assigned to this event. For example music, sports, festival "
                                        "etc.")


class EventsSchema(BaseModel):
    events: List[EventSchema]
