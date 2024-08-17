import logging
from typing import List

import torch
from langchain_core.pydantic_v1 import BaseModel
from langgraph.graph import StateGraph, END
from typing_extensions import TypedDict

from scraper.agents.data_extractor import DataExtractorAgent
from scraper.agents.hallucination_grader import HallucinationGraderAgent
from scraper.agents.quality_assurance import QualityAssuranceAgent
from scraper.agents.response_cleaner import ResponseCleanerAgent
from scraper.data_fetcher import DataFetcher


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
    documents: List[str]
    are_there_hallucinations: bool
    quality: int
    logger: logging.Logger
    hallucination_check_count: int
    quality_check_count: int


class Scraper:
    def __init__(self, schema, urls_to_search, logger, crawl_website=False, crawl_max_depth=3):
        self.logger = logger
        self.crawl_website = crawl_website
        self.crawl_max_depth = crawl_max_depth
        self.state = GraphState(
            schema=schema,
            question="",
            generation="",
            crawl_website=crawl_website,
            urls_to_search=urls_to_search,
            comments=[],
            documents=[],
            are_there_hallucinations=False,
            quality=0,
            logger=logger,
            hallucination_check_count=0,
            quality_check_count=0
        )
        # Clear GPU cache before running the model
        torch.cuda.empty_cache()
        self.state["documents"] = self.fetch_data()

    def set_schema(self, schema):
        self.state.schema = schema

    def fetch_data(self):
        self.logger.info(f"Getting data from {self.state['urls_to_search']}.")
        fetcher = DataFetcher(self.logger, self.crawl_website, self.crawl_max_depth)
        docs = fetcher.fetch_data(self.state['urls_to_search'])
        self.logger.debug(f"Scraped data:\n{docs}")
        return docs

    def extract(self):
        """
            Extracts data from a document using an extraction team.

            Returns:
                dict: The extracted data.
            """
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
        data_extractor_agent = DataExtractorAgent(schema=self.state["schema"])
        response_cleaner_agent = ResponseCleanerAgent(schema=self.state["schema"])
        hallucination_grader_agent = HallucinationGraderAgent()
        quality_assurance_agent = QualityAssuranceAgent()

        workflow = StateGraph(GraphState)

        # Add nodes for each agent
        workflow.add_node("extract_data", data_extractor_agent.act)
        workflow.add_node("clean_response", response_cleaner_agent.act)
        workflow.add_node("grade_hallucinations", hallucination_grader_agent.act)
        workflow.add_node("quality_assurance", quality_assurance_agent.act)

        # Add edges
        workflow.set_entry_point("extract_data")
        workflow.add_edge("extract_data", "clean_response")
        workflow.add_edge("clean_response", "grade_hallucinations")
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
        return "regenerate"
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

    if state["quality"] >= 6:
        state['logger'].info("---DECISION: QUALITY ACCEPTED---")
        return "useful"
    else:
        state['logger'].info("---DECISION: ANSWER NOT UP TO PAR, RE-GENERATE WITH COMMENTS---")
        return "not useful"
