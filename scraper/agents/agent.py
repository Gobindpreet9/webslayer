from abc import ABC, abstractmethod
from langchain_community.llms.ollama import Ollama
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate
from utils.config import Config


class Agent(ABC):

    def __init__(self, schema=None):
        self._schema = schema
        self.parser = None
        self.llm = None
        self.prompt_template = None
        self.configure_default_agent()

    @property
    @abstractmethod
    def prompt(self):
        """
            This is an abstract property that should be implemented by subclasses.
            It is expected to return a string that represents a prompt.

            Returns:
                str: A string that represents a prompt.
        """
        pass

    @property
    @abstractmethod
    def schema(self):
        """
            This is an abstract property that should be implemented by subclasses.
            It is expected to return a schema.

            Returns:
                Any: The schema of agent response.
        """
        return self._schema

    @schema.setter
    def schema(self, value):
        self._schema = value

    def configure_default_prompt_template(self, prompt=None):
        self.prompt_template = PromptTemplate(
            template=prompt or self.prompt,
            input_variables=["data"],
            partial_variables={"format_instructions": self.parser.get_format_instructions()},
        )

    def configure_default_llm(self):
        """
            Method configures the LLM instance. The default LLM is llama3.
        """
        self.llm = Ollama(
            model=Config.MODEL_TO_USE,
            num_ctx=8000,
            temperature=0.4,
            format='json'
        )

    def configure_default_json_parser(self, schema=None):
        """
            Method configures the JSON parser instance.
        :param schema: The schema of the agent response.
        """
        self.parser = JsonOutputParser(pydantic_object=schema or self.schema)

    def configure_default_agent(self):
        """
            Method configures the default agent. It sets up the prompt template, LLM, and JSON parser.
        """
        self.configure_default_json_parser()  # Ensure parser is configured first
        self.configure_default_prompt_template()  # Then configure the prompt template
        self.configure_default_llm()

    def get_chain(self):
        return self.prompt_template | self.llm | self.parser

    @abstractmethod
    def act(self, state):
        """
            This is an abstract method that should be implemented by subclasses.
            It is expected to return an object that represents the agent's response.

            Parameters:
                state (GraphState): The current graph state.

            Returns:
                Any (GraphState): The updated graph state."""
        pass
