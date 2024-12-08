#!/bin/sh

# Default to llama3.1 if not set
DEFAULT_LLM_MODEL=${DEFAULT_LLM_MODEL:-llama3.1:8b-instruct-q5_0}

echo "Waiting for Ollama service..."
until curl -s -f http://ollama:11434/ > /dev/null 2>&1; do
    echo "Waiting for Ollama to be ready..."
    sleep 5
done

echo "Ollama is ready. Pulling model: $DEFAULT_LLM_MODEL..."
curl -X POST http://ollama:11434/api/pull \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$DEFAULT_LLM_MODEL\"}" \
    --no-buffer