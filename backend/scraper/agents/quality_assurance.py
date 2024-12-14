from pydantic import BaseModel, Field
from typing import List
from scraper.agents.agent import Agent
from core.utils import Utils

class QualityAssuranceSchema(BaseModel):
    """
    Schema for the quality assessment.
    """
    quality: int = Field(default=0,
                         description=f"Overall quality score of the document content on a scale from 1 to 10.")
    comments: List[str] = Field(default=[], description="Specific comments or feedback regarding the document content.")


class QualityAssuranceAgent(Agent):
    """
    Agent to evaluate the quality of the generated content based on provided document and schema.
    """
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

    def __init__(self, model_type, local_model_name, max_quality_checks):
        super().__init__(model_type=model_type, local_model_name=local_model_name)
        self.max_quality_checks = max_quality_checks

    @property
    def prompt(self):
        return self.PROMPT_TEMPLATE

    @property
    def schema(self):
        return QualityAssuranceSchema

    def act(self, state):
        state['logger'].info("Checking response quality.")
        if state["quality_check_count"] >= self.max_quality_checks:
            state['logger'].info(f"---MAX QUALITY CHECKS REACHED. FINISHING.---")
            state["quality"] = 10
            return {**state, "quality": 10}

        response = self.get_chain().invoke({"document_content": state["documents"], "response": state["generation"]})
        quality = Utils.get_value_or_default(response, "quality", 10, state["logger"])
        comments = Utils.get_value_or_default(response, "comments", [], state["logger"])
        state['logger'].debug(f"Quality checked. Found: {quality}. Details: {comments}")
        return {
            **state,
            "quality_check_count": state["quality_check_count"] + 1,
            "quality": quality,
            "comments": state["comments"] + comments
        }
