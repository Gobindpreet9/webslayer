from langchain_core.prompts import PromptTemplate
from langchain_community.llms import Ollama
from langchain_core.output_parsers import JsonOutputParser
from langchain.globals import set_debug
import torch

set_debug(True)  # enable when debugging


class DataExtractor:
    # ollama pull MODEL_ID before use
    # MODEL_ID = "phi3"
    MODEL_ID = "llama3"  # For more power
    PROMPT_TEMPLATE = "You are supposed to extract useful and valuable information for different events from the given " \
                      "web data collected. Do not add anything else in the response than the requested format. " \
                      "If there is no relevant data, return empty in format specified." \
                      "\n{format_instructions}\nData: {data}"

    def __init__(self, schema):
        self.schema = schema
        self.llm = self.configure_and_get_llm()
        self.output_parser = self.configure_and_get_parser()
        self.prompt = self.configure_and_get_prompt()

        # Clear GPU cache before running the model
        torch.cuda.empty_cache()

    def set_schema(self, schema):
        self.schema = schema

    def configure_and_get_llm(self):
        return Ollama(
            model=self.MODEL_ID,
            num_ctx=8000
        )

    def configure_and_get_parser(self):
        return JsonOutputParser(pydantic_object=self.schema)

    def configure_and_get_prompt(self):
        prompt = PromptTemplate(
            template=self.PROMPT_TEMPLATE,
            input_variables=["data"],
            partial_variables={"format_instructions": self.output_parser.get_format_instructions()},
        )
        return prompt

    def extract(self, content: str):
        chain = self.prompt | self.llm | self.output_parser
        response = chain.invoke({"data": content})
        return response
