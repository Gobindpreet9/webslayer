from scraper.agents.agent import Agent


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
        combined_result = []
        # todo: should combine keys
        for result in results:
            combined_result.append(result)

        return combined_result

    def act(self, state):
        results = []

        # todo: use RecursiveCharacterTextSplitter or similar if documents are too large
        for document in state["documents"]:
            response = self.get_chain().invoke({
                "data": document,
                "comments": state["comments"] or ""
            })
            results.append(response)

        return {**state, "generation": self.combine_results(results)}
