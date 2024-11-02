import logging
import unittest

from pydantic import BaseModel, Field

from schema.event_schema import EventSchema
from scraper.agents.agent import Agent
from scraper.scraper import Scraper
from tests.fake_events_data import fake_events_data


class TestGraderSchema(BaseModel):
    score: int = Field(default=0, description="0-10 grade of the content generated.")


class TestGraderAgent(Agent):
    PROMPT_TEMPLATE = """
        You are tasked with assessing the relevance of the response generated  by a scraping program from the provided 
        data requested in the given schema format. Your response should strictly adhere to the requested format and
        include a score between 0-10.

        Format Instructions:
        {format_instructions}
        
        Data:
        DATA IN REQUEST:
        {data}
        
        SCHEMA IN REQUEST:
        {schema}
        
        RESPONSE GENERATED:
        {response}
        """

    @property
    def prompt(self):
        return self.PROMPT_TEMPLATE

    @property
    def schema(self):
        return TestGraderSchema

    def act(self, data, response, schema):
        response = self.get_chain().invoke({
            "data": data,
            "schema": schema,
            "response": response
        })

        return response["score"]


class TestScraper(unittest.TestCase):

    def setUp(self):
        self.logger = logging.getLogger("test_logger")
        self.schema = EventSchema
        self.scraper = Scraper(schema=self.schema, logger=self.logger)

    def test_extract(self):
        extracted_data = self.scraper.extract(fake_events_data)
        print(extracted_data["generation"])
        score = TestGraderAgent().act(fake_events_data, extracted_data["generation"], self.schema)
        print(f"Score: {score}")
        self.assertGreater(score, 7)


if __name__ == "__main__":
    unittest.main()
