from fastapi import HTTPException
import json
import logging
from typing import List

import torch
from pydantic import BaseModel
from langgraph.graph import StateGraph, END
from typing_extensions import TypedDict

from scraper.agents.data_extractor import DataExtractorAgent
from scraper.agents.hallucination_grader import HallucinationGraderAgent
from scraper.agents.quality_assurance import QualityAssuranceAgent
from scraper.agents.response_cleaner import ResponseCleanerAgent
from scraper.data_fetcher import DataFetcher
from core.utils import Utils
import asyncio


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
    """
    The scraper class.

    Args:
        schema: schema model of the response
        urls_to_search: list of URLs to search
        logger: logger
        crawl_config: configuration for the crawler
        scraper_config: configuration for the scraper
    """
    def __init__(self, schema, urls_to_search, model_type, local_model_name, logger, crawl_config, scraper_config):
        self.logger = logger
        self.crawl_config = crawl_config
        self.scraper_config = scraper_config
        self.model_type = model_type
        self.local_model_name = local_model_name
        
        # Create dynamic model from schema definition
        if isinstance(schema, dict):
            schema = Utils.create_dynamic_model(schema)
        
        self.state = GraphState(
            schema=schema,
            question="",
            generation="",
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

    def set_schema(self, schema):
        self.state.schema = schema

    @classmethod
    async def create(cls, schema, urls_to_search, model_type, local_model_name, logger, crawl_config, scraper_config):
        self = cls(schema, urls_to_search, model_type, local_model_name, logger, crawl_config, scraper_config)
        await self.initialize_fetcher()
        return self

    async def initialize_fetcher(self):
        self.fetcher = DataFetcher(
            self.logger,
            self.crawl_config.get('enable_crawling', False),
            self.crawl_config.get('max_depth', 3),
            self.crawl_config.get('max_urls_to_search', 100)
        )
        await asyncio.sleep(0.1)  # Yield control to ensure DataFetcher initializes asynchronously

    async def fetch_data(self):
        return await self.fetcher.fetch_data(self.state.get("urls_to_search", []))

    async def extract(self):
        """
            Extracts data from a document using an extraction team.

            Returns:
                str: The extracted generation text.
            """
        self.state["documents"] = await self.fetch_data()
        if not self.state.get("documents"):
            raise HTTPException(status_code=400, detail="Unable to fetch data from provided URLs")
        
        extraction_team = self.init_extraction_team()
        graph = extraction_team.compile()
        extracted_data = graph.invoke(self.state)

        if not extracted_data or not extracted_data.get("generation"):
            raise HTTPException(status_code=400, detail="Unable to extract relevant information")
        
        self.state["logger"].info(f"Result: {json.dumps(extracted_data['generation'])}")
        return extracted_data['generation']

    def init_extraction_team(self) -> StateGraph:
        """
        Initializes the extraction team workflow.

        Returns:
            StateGraph: The workflow graph.
        """
        data_extractor_agent = DataExtractorAgent(
            model_type=self.model_type,
            local_model_name=self.local_model_name,
            schema=self.state["schema"], 
            enable_chunking=self.crawl_config.get('enable_chunking', True), 
            chunk_size=self.crawl_config.get('chunk_size', 6000), 
            chunk_overlap_size=self.crawl_config.get('chunk_overlap', 150)
        )
        response_cleaner_agent = ResponseCleanerAgent(
            model_type=self.model_type,
            local_model_name=self.local_model_name,
            schema=self.state["schema"])
        hallucination_grader_agent = HallucinationGraderAgent(
            model_type=self.model_type,
            local_model_name=self.local_model_name,
            max_hallucination_checks=self.scraper_config.max_hallucination_checks
        )
        quality_assurance_agent = QualityAssuranceAgent(
            model_type=self.model_type,
            local_model_name=self.local_model_name,
            max_quality_checks=self.scraper_config.max_quality_checks
        )

        workflow = StateGraph(GraphState)

        # Add nodes for each agent
        workflow.add_node("extract_data", data_extractor_agent.act)
        workflow.add_node("clean_response", response_cleaner_agent.act)
        workflow.add_node("grade_hallucinations", hallucination_grader_agent.act)
        workflow.add_node("quality_assurance", quality_assurance_agent.act)

        # Add edges
        workflow.set_entry_point("extract_data")
        workflow.add_edge("extract_data", "clean_response")

        if self.scraper_config.enable_hallucination_check:
            workflow.add_edge("clean_response", "grade_hallucinations")
            workflow.add_conditional_edges(
                "grade_hallucinations",
                decide_to_regenerate,
                {
                    "regenerate": "extract_data",
                    "quality_assurance": "quality_assurance" if self.scraper_config.enable_quality_check else END
                })
        else:
            workflow.add_edge("clean_response", "quality_assurance" if self.scraper_config.enable_quality_check else END)

        if self.scraper_config.enable_quality_check:
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
