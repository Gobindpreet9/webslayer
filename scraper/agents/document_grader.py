from langchain_core.pydantic_v1 import BaseModel, Field
from typing import List
from scraper.agents.agent import Agent

"""
Schema for the response of DocumentGraderAgent.
"""


class DocumentGraderSchema(BaseModel):
    is_more_search_required: bool = Field(default=False,
                                          description="True if more research is needed, false otherwise.")
    urls: List[str] = Field(default=[],
                            description="A list of URLs for further research if available from provided data.")


"""
Agent for analyzing the provided document content to assess its comprehensiveness based on the target schema.
"""


class DocumentGraderAgent(Agent):
    PROMPT_TEMPLATE = """
        You are tasked with analyzing the provided document content to assess its comprehensiveness based on the target 
        schema. Your response should strictly adhere to the requested JSON output format and should not include any 
        extraneous information. Proceed methodically to compare the document content against the target schema and 
        determine if more research is needed. If additional research is required, identify relevant URLs. If no further 
        research is needed, your response should reflect that by returning an empty list of URLs.

        Format Instructions:
        {format_instructions}

        Data:
        Document Content: "{document_content}"
        Target Schema: {target_schema}
    """

    @property
    def prompt(self):
        return self.PROMPT_TEMPLATE

    @property
    def schema(self):
        return DocumentGraderSchema

    def act(self, state):
        response = self.get_chain().invoke({
            "document_content": state["documents"],
            "target_schema": state["schema"]
        })

        return {
            **state,
            "web_search": response["is_more_search_required"],
            "urls_to_search": response["urls"]
        }
