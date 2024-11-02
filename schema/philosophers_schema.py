from pydantic import BaseModel, Field
from typing import List


class PhilosophersSchema(BaseModel):
    name: str = Field(description="Name of the philosopher")
    description: str = Field(description="Description of the philosopher")
    area_of_expertise: str = Field(description="Specific area of expertise in philosophy")


class Philosophers(BaseModel):
    philosophers: List[PhilosophersSchema] = Field(description="List of philosophers")

