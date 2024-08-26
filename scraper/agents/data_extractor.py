import json

from scraper.agents.agent import Agent
from langchain_text_splitters import RecursiveCharacterTextSplitter

from utils.config import Config


class DataExtractorAgent(Agent):
    """
    Agent class for extracting data from web data.
    """
    PROMPT_TEMPLATE = """
        You are tasked with extracting valuable information related to various events from the provided web data. 
        Your response should strictly adhere to the requested format and should not include any extraneous information. 
        Proceed methodically to identify and extract the most pertinent information according to the specified schema. 
        If no relevant data is available, return an empty response in the specified format.

        Format Instructions:
        {format_instructions}

        Data:
        {data}
            
        Comments, if any, from previous attempts of generating response to improve answer:
        Comments: 
        {comments}
        """

    def __init__(self, schema):
        super().__init__(schema=schema)

    @property
    def prompt(self):
        return self.PROMPT_TEMPLATE

    @property
    def schema(self):
        return self._schema

    @staticmethod
    def combine_results(results):
        def merge_values(v1, v2):
            if isinstance(v1, list) and isinstance(v2, list):
                return v1 + v2
            elif isinstance(v1, dict) and isinstance(v2, dict):
                return merge_dicts(v1, v2)
            elif isinstance(v1, list):
                return v1 + [v2]
            elif isinstance(v2, list):
                return [v1] + v2
            else:
                return [v1, v2]

        def merge_dicts(d1, d2):
            result = d1.copy()
            for key, value in d2.items():
                if key in result:
                    result[key] = merge_values(result[key], value)
                else:
                    result[key] = value
            return result

        combined_result = {}
        for result in results:
            combined_result = merge_dicts(combined_result, result)

        return combined_result

    def act(self, state):
        state['logger'].info("Extracting data using LLM.")

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=Config.CHUNK_SIZE,
            chunk_overlap=Config.CHUNK_OVERLAP_SIZE,
            length_function=len,
        )
        texts = []
        for document in state["documents"]:
            if Config.ENABLE_CHUNKING and len(document) > Config.CHUNKING_THRESHOLD:
                texts.extend(text_splitter.create_documents([document]))
            else:
                texts.extend(document)

        results = self.get_chain().batch(
            [{"data": document, "comments": state["comments"] or ""} for document in texts],
            {"max_concurrency": 1},
        )
        combined_result = self.combine_results(results)

        state['logger'].debug("Data Extracted: " + json.dumps(combined_result))
        return {**state, "generation": combined_result}
