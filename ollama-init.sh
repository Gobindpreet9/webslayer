   #!/bin/sh

   echo "Waiting for Ollama service..."
   until curl -s -f http://ollama:11434/ > /dev/null 2>&1; do
       echo "Waiting for Ollama to be ready..."
       sleep 5
   done

   echo "Ollama is ready. Pulling model..."
   curl -X POST http://ollama:11434/api/pull \
       -H "Content-Type: application/json" \
       -d '{"name":"llama3.1:8b-instruct-q5_0"}' \
       --no-buffer