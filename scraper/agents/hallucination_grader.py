from langchain_core.pydantic_v1 import BaseModel, Field
from typing import List
from scraper.agents.agent import Agent

"""
Schema for the HallucinationGraderAgent 
"""


class HallucinationGraderSchema(BaseModel):
    is_content_accurate: bool = Field(default=False,
                                      description="True if no hallucinations are found, false otherwise.")
    hallucinations: List[str] = Field(default=[], description="A list providing details about existing hallucinations, "
                                                              "if any.")


"""
Agent to evaluate the response based on provided data to identify any hallucinations.
"""


class HallucinationGraderAgent(Agent):
    PROMPT_TEMPLATE = """
       You are tasked with evaluating the provided document content to identify any hallucinations, which are instances
        of incorrect, misleading, or fabricated information. Your response should strictly adhere to the requested JSON 
        output format and should not include any extraneous information. Methodically analyze the document content and 
        compare it against known facts and reliable sources to determine the presence of hallucinations. If any 
        hallucinations are found, provide detailed descriptions of each along with the reasons why they are considered 
        hallucinations.
        
        Format Instructions:
        {format_instructions}
        
        Here are the facts:
        \n ------- \n
        {data} 
        \n ------- \n
        Here is the answer: {response} 
    """

    @property
    def prompt(self):
        return self.PROMPT_TEMPLATE

    @property
    def schema(self):
        return HallucinationGraderSchema

    def act(self, state):
        response = self.get_chain().invoke({"data": state["documents"], "response": state["generation"]})
        state["are_there_hallucinations"] = response["is_content_accurate"]
        state["comments"] = state["comments"].append(response["hallucinations"])
