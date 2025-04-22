from abc import ABC, abstractmethod

from api.models import ModelType
from langchain_anthropic import ChatAnthropic
from langchain_ollama import OllamaLLM
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate
from core.settings import Settings
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI

settings = Settings()

class Agent(ABC):
    def __init__(self, model_type, local_model_name, schema=None):
        self.model_type = model_type
        self.local_model_name = local_model_name
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
        Method configures the LLM instance based on the selected model type.
        """
        if self.model_type == ModelType.claude or self.model_type == ModelType.openai or self.model_type == ModelType.gemini:
            if not settings.API_KEY:
                raise ValueError(f"{self.model_type} API key is required in settings")
            
            if self.model_type == ModelType.claude:
                self.llm = ChatAnthropic(
                    api_key=settings.API_KEY,
                    model=self.local_model_name,
                    temperature=0,
                    timeout=None,
                    max_retries=2
                )
            elif self.model_type == ModelType.openai:  # OpenAI
                self.llm = ChatOpenAI(
                    api_key=settings.API_KEY,
                    model=self.local_model_name,
                    temperature=0,
                    timeout=None,
                    max_retries=2
                )
            elif self.model_type == ModelType.gemini:
                self.llm = ChatGoogleGenerativeAI(
                    model=self.local_model_name,
                    temperature=0,
                    max_tokens=None,
                    timeout=None,
                    google_api_key=settings.API_KEY
                )
        elif self.model_type == ModelType.ollama:
            self.llm = OllamaLLM(
                base_url=f"http://{settings.OLLAMA_HOST}:{settings.OLLAMA_PORT}",
                model=self.local_model_name,
                num_ctx=8000,
                temperature=0.4,
                format='json'
            )
        else:
            raise ValueError(f"Unsupported model type: {self.model_type}")

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
