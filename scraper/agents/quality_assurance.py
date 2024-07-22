from langchain_core.pydantic_v1 import BaseModel, Field
from typing import List
from scraper.agents.agent import Agent

"""
Schema for the quality assessment.
"""

MAX_QUALITY = 10


class QualityAssuranceSchema(BaseModel):
    quality: int = Field(default=0,
                         description=f"Overall quality score of the document content on a scale from 1 to {MAX_QUALITY}.")
    comments: List[str] = Field(default=[], description="Specific comments or feedback regarding the document content.")


"""
Agent to evaluate the quality of the generated content based on provided document and schema.
"""


class QualityAssuranceAgent(Agent):
    MAX_QUALITY_CHECKS = 3
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
        if state["quality_check_count"] >= self.MAX_QUALITY_CHECKS:
            state['logger'].info(f"---MAX QUALITY CHECKS REACHED. FINISHING.---")
            state["quality"] = MAX_QUALITY

        state["quality_check_count"] = state["quality_check_count"] + 1
        response = self.get_chain().invoke({"document_content": state["documents"], "response": state["generation"]})
        state["quality"] = response["quality"]
        state["comments"] = state["comments"].append(response["comments"])
