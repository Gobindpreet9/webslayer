from pydantic import BaseModel, Field
from typing import List
from scraper.agents.agent import Agent
from utils.config import Config
from utils.utils import Utils


class HallucinationGraderSchema(BaseModel):
    """
    Schema for the HallucinationGraderAgent
    """
    are_there_hallucinations: bool = Field(default=False,
                                      description="True if hallucinations are found, false otherwise.")
    hallucinations: List[str] = Field(default=[], description="A list providing details about existing hallucinations, "
                                                              "if any.")


class HallucinationGraderAgent(Agent):
    """
    Agent to evaluate the response based on provided data to identify any hallucinations.
    """
    MAX_HALLUCINATION_CHECKS = Config.MAX_HALLUCINATION_CHECKS
    PROMPT_TEMPLATE = """
       You are tasked with evaluating the provided document content to identify any hallucinations, which are instances
        of incorrect, misleading, or fabricated information. Your response should strictly adhere to the requested JSON 
        output format and should not include any extraneous information. Methodically analyze the document content and 
        compare it against known facts and reliable sources to determine the presence of hallucinations. If any 
        hallucinations are found, provide detailed descriptions of each along with the reasons why they are considered 
        hallucinations.
        
        Here are the facts:
        \n ------- \n
        {data} 
        \n ------- \n
        Here is the answer: {response} 
        \n ------- \n
        Format Instructions:
        {format_instructions}
    """

    @property
    def prompt(self):
        return self.PROMPT_TEMPLATE

    @property
    def schema(self):
        return HallucinationGraderSchema

    def act(self, state):
        state['logger'].info("Checking for hallucinations.")
        if state["hallucination_check_count"] >= self.MAX_HALLUCINATION_CHECKS:
            state['logger'].debug(f"---MAX HALLUCINATION CHECKS REACHED. PROCEEDING TO QUALITY CHECK.---")
            return {
                **state,
                "are_there_hallucinations": False,
                "hallucination_check_count": state["hallucination_check_count"] + 1
            }

        response = self.get_chain().invoke({"data": state["documents"], "response": state["generation"]})

        are_there_hallucinations = Utils.get_value_or_default(response, "are_there_hallucinations", False, state["logger"])
        hallucinations = Utils.get_value_or_default(response, "hallucinations", [], state["logger"])
        state['logger'].debug(f"Hallucinations checked. Found: {are_there_hallucinations}. Details: {hallucinations}")
        return {
            **state,
            "hallucination_check_count": state["hallucination_check_count"] + 1,
            "are_there_hallucinations": are_there_hallucinations,
            "comments": state["comments"] + hallucinations
        }
