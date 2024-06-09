from langchain_core.pydantic_v1 import BaseModel, Field
from typing import List
from scraper.agents.agent import Agent

"""
Schema for the quality assessment.
"""


class QualityAssuranceSchema(BaseModel):
    quality: int = Field(default=0,
                         description="Overall quality score of the document content on a scale from 1 to 10.")
    comments: List[str] = Field(default=[], description="Specific comments or feedback regarding the document content.")


"""
Agent to evaluate the quality of the generated content based on provided document and schema.
"""


class QualityAssuranceAgent(Agent):
    PROMPT_TEMPLATE = """
        You are tasked with evaluating the provided document content based on overall quality and providing specific 
        comments or feedback. Your response should strictly adhere to the requested JSON output format and should not 
        include any extraneous information. Methodically analyze the document content and provide an overall quality 
        score on a scale from 1 to 10, along with any specific comments or feedback.

        Format Instructions:
        {format_instructions}

        Document Content:
        {document_content}

        Here is the quality assessment: {response}
    """

    @property
    def prompt(self):
        return self.PROMPT_TEMPLATE

    @property
    def schema(self):
        return QualityAssuranceSchema

    def act(self, state):
        response = self.get_chain().invoke({"document_content": state["documents"], "response": state["generation"]})
        state["quality"] = response["quality"]
        state["comments"] = state["comments"].append(response["comments"])
