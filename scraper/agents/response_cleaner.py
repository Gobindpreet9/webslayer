import json

from scraper.agents.agent import Agent


class ResponseCleanerAgent(Agent):
    """
    Agent to evaluate if the provided urls should be used by a web scraping program to generate response
    """
    PROMPT_TEMPLATE = """
        You are an editor tasked with cleaning and refining data extracted from various sources. Your goal is to ensure
        the output adheres strictly to the specified schema, removes duplicates, and standardizes formats where 
        appropriate.
    
        Format Instructions:
        {format_instructions}
    
        Follow these guidelines:
        1. Remove any duplicate entries based on all fields in the schema.
        2. Remove any entries that lack essential information as defined by the schema.
        3. Standardize formats for dates, numbers, and other consistent data types if present.
        4. Ensure the output strictly follows the specified schema.
        5. Do not add any information that is not present in the input data.
    
        Data to be cleaned:
        {data}
    
        Instructions:
        - Do not include the schema in your response.
        - Provide only the cleaned and refined data matching the schema.
    
        Please provide the cleaned and refined data in the format specified by the schema. If no valid entries remain 
        after cleaning, return an empty list or appropriate empty structure as defined by the schema.
    """

    def __init__(self, model_type, local_model_name, schema):
        super().__init__(model_type=model_type, local_model_name=local_model_name, schema=schema)

    @property
    def prompt(self):
        return self.PROMPT_TEMPLATE

    @property
    def schema(self):
        return self._schema

    def act(self, state):
        state['logger'].info("Editing response.")
        response = self.get_chain().invoke({"data": state["generation"]})
        state['logger'].debug("Response Cleaned: " + json.dumps(response))
        return {
            **state,
            "generation": response
        }
