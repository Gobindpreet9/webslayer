from langchain_core.pydantic_v1 import BaseModel, Field
from typing import List


class PhilosophersSchema(BaseModel):
    name: str = Field(description="Name of the philosopher")
    description: str = Field(description="Description of the philosopher")
    area_of_expertise: str = Field(description="Area of expertise of the philosopher")


class Philosophers(BaseModel):
    philosophers: List[PhilosophersSchema] = Field(description="List of philosophers")

