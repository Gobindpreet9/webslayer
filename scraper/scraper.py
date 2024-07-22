import logging
from typing import List

import torch
from langchain_core.pydantic_v1 import BaseModel
from langgraph.graph import StateGraph, END
from typing_extensions import TypedDict

from scraper.agents.data_extractor import DataExtractorAgent
from scraper.agents.document_grader import DocumentGraderAgent
from scraper.agents.hallucination_grader import HallucinationGraderAgent
from scraper.agents.quality_assurance import QualityAssuranceAgent


class GraphState(TypedDict):
    """
    Represents the state of our graph.

    Attributes:
        schema: schema model
        question: question
        generation: LLM generation
        web_search: whether to add search
        urls_to_search: list of URLs to search
        comments: list of comments
        documents: list of documents
        are_there_hallucinations: whether there are hallucinations
        quality: quality score
        logger: logger
        hallucination_check_count: number of hallucination checks done
        quality_check_count: number of quality checks done
    """
    schema: BaseModel
    question: str
    generation: str
    web_search: bool
    urls_to_search: List[str]
    comments: List[str]
    documents: str
    are_there_hallucinations: bool
    quality: int
    logger: logging.Logger
    hallucination_check_count: int
    quality_check_count: int


class Scraper:
    GRADE_DOCUMENTS = "grade_documents"

    def __init__(self, schema, logger):
        self.logger = logger
        self.state = GraphState(
            schema=schema,
            question="",
            generation="",
            web_search=False,
            urls_to_search=[],
            comments=[],
            documents="",
            are_there_hallucinations=False,
            quality=0,
            logger=logger,
            hallucination_check_count=0,
            quality_check_count=0
        )

        # Clear GPU cache before running the model
        torch.cuda.empty_cache()

    def set_schema(self, schema):
        self.state.schema = schema

    def extract(self, document: str):
        """
            Extracts data from a document using an extraction team.

            Args:
                document (str): The document to extract data from.

            Returns:
                dict: The extracted data.
            """
        self.state["documents"] = document
        extraction_team = self.init_extraction_team()
        graph = extraction_team.compile()
        extracted_data = graph.invoke(self.state)
        return extracted_data

    def init_extraction_team(self) -> StateGraph:
        """
        Initializes the extraction team.
        :return: The initialized extraction team.
        """
        # Initialize agents
        document_grader_agent = DocumentGraderAgent()
        data_extractor_agent = DataExtractorAgent(schema=self.state["schema"])
        hallucination_grader_agent = HallucinationGraderAgent()
        quality_assurance_agent = QualityAssuranceAgent()

        workflow = StateGraph(GraphState)

        # Add nodes for each agent
        workflow.add_node(self.GRADE_DOCUMENTS, document_grader_agent.act)
        workflow.add_node("extract_data", data_extractor_agent.act)
        workflow.add_node("grade_hallucinations", hallucination_grader_agent.act)
        workflow.add_node("quality_assurance", quality_assurance_agent.act)
        # TODO: Add node for more web search

        # Add edges
        workflow.set_entry_point(self.GRADE_DOCUMENTS)
        workflow.add_conditional_edges(
            self.GRADE_DOCUMENTS,
            decide_to_generate,
            {
                "extract_data": "extract_data"
                # TODO: "web_search": "web_search"
            })
        workflow.add_edge("extract_data", "grade_hallucinations")
        workflow.add_conditional_edges(
            "grade_hallucinations",
            decide_to_regenerate,
            {
                "regenerate": "extract_data",
                "quality_assurance": "quality_assurance"
            })
        workflow.add_conditional_edges(
            "quality_assurance",
            grade_generation,
            {
                "useful": END,
                "not useful": "extract_data"
            })
        return workflow


# Conditional edges

def decide_to_generate(state: GraphState) -> str:
    """
       Determines whether to generate an answer, or add web search

       Args:
           state (dict): The current graph state

       Returns:
           str: Binary decision for next node to call
       """
    state['logger'].info("---ASSESS GRADED DOCUMENTS---")
    is_more_search_required = state["web_search"]

    if is_more_search_required:
        state['logger'].info("---DECISION: ALL DOCUMENTS ARE NOT RELEVANT TO QUESTION, DO WEB SEARCH---")
        return "extract_data"  # TODO: return websearch
    else:
        state['logger'].info("---DECISION: GENERATE---")
        return "extract_data"


def decide_to_regenerate(state) -> str:
    """
       Determines whether to generate an answer, or add web search

       Args:
           state (dict): The current graph state

       Returns:
           str: Binary decision for next node to call
       """

    state['logger'].info(f"---ASSESS HALLUCINATION CHECK RESULTS. ATTEMPT {state['hallucination_check_count']}---")

    if state["are_there_hallucinations"]:
        state['logger'].info(
            "---DECISION: INCLUDES HALLUCINATIONS, RE-GENERATE WITH COMMENTS---"
        )
        return "extract_data"
    else:
        state['logger'].info("---DECISION: NO HALLUCINATIONS, CHECK QUALITY---")
        return "quality_assurance"


def grade_generation(state) -> str:
    """
        Grades the quality of the generation.

        Args:
            state (GraphState): The current graph state.

        Returns:
            str: Binary decision for next node to call.
    """
    state['logger'].info(f"---ASSESS ANSWER QUALITY. ATTEMPT {state['quality_check_count']}---")

    if state["quality"] > 7:
        state['logger'].info("---DECISION: QUALITY ACCEPTED---")
        return "useful"
    else:
        state['logger'].info("---DECISION: ANSWER NOT UP TO PAR, RE-GENERATE WITH COMMENTS---")
        return "not useful"
