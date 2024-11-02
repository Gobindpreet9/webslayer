import os
from abc import ABC, abstractmethod

from langchain_anthropic import ChatAnthropic
from langchain_ollama import OllamaLLM
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate
from utils.config import Config, Model


class Agent(ABC):
    ollama_host = os.getenv('OLLAMA_HOST', 'ollama')
    ollama_port = os.getenv('OLLAMA_PORT', '11434')

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
        if Config.MODEL_TO_USE == Model.Anthropic:
            self.llm = ChatAnthropic(
                    model="claude-3-5-sonnet-20240620",
                    temperature=0,
                    max_tokens=1024,
                    timeout=None,
                    max_retries=2
                )
        else:
            self.llm = OllamaLLM(
                base_url=f"http://{self.ollama_host}:{self.ollama_port}",
                model=Config.LOCAL_MODEL,
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
