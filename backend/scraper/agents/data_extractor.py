import json

from scraper.agents.agent import Agent
from langchain_text_splitters import RecursiveCharacterTextSplitter

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

    def __init__(self, model_type, local_model_name, schema, enable_chunking, chunk_size, chunk_overlap_size):
        super().__init__(model_type=model_type, local_model_name=local_model_name, schema=schema)
        self.enable_chunking = enable_chunking
        self.chunk_size = chunk_size
        self.chunk_overlap_size = chunk_overlap_size

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
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap_size,
            length_function=len,
        )
        texts = []
        for document in state["documents"]:
            if self.enable_chunking and len(document) > self.chunk_size:
                split_docs = text_splitter.create_documents([document])
                texts.extend(split_docs)
                state['logger'].debug("Chunked document into " + str(len(split_docs)) + " chunks.")
            else:
                texts.append(document)

        results = self.get_chain().batch(
            [{"data": document, "comments": state["comments"] or ""} for document in texts],
            {"max_concurrency": 1},
        )
        combined_result = self.combine_results(results)

        state['logger'].debug("Data Extracted: " + json.dumps(combined_result))
        return {**state, "generation": combined_result}
