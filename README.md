Webslayer is an in-development tool that leverages the power of LLMs and AI agents to provide quality, formatted data from provided URLs.

---

## Project Structure
- **backend/**: Python backend (API, Celery workers, scraping, DB logic)
- **frontend/**: Remix frontend app
- **docker-compose*.yml**: Compose files to orchestrate different stacks

---

## How to Run

### Prerequisites
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed
- Copy or create a `.env` file in the project root (already present)
- Check models available on Ollama or have a valid API key for OpenAI, Claude or Gemini

### Common Setups

#### 1. Full Stack (Backend, Frontend, LLM, PgAdmin)
```bash
docker-compose -f docker-compose.yml -f docker-compose.frontend.yml -f docker-compose.ollama.yml -f docker-compose.override.yml up --build
```
- Backend API: http://localhost:8000/docs
- Frontend (Remix): http://localhost:5173
- Ollama (LLM): http://localhost:11434
- PgAdmin: http://localhost:5050

#### 2. Backend Only
```bash
docker-compose up --build
```

#### 3. Backend + Frontend
```bash
docker-compose -f docker-compose.yml -f docker-compose.frontend.yml up --build
```

#### 4. Backend + LLM
```bash
docker-compose -f docker-compose.yml -f docker-compose.ollama.yml up --build
```

---

## Frontend Development
1. Enter frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start dev server:
   ```bash
   npm run dev
   ```

---

## VS Code Debugging

This project includes ready-to-use VS Code launch configurations in `.vscode/launch.json`:

- **Python: Remote Attach (Webslayer)** — Attach debugger to backend API in Docker (port 5678).
- **Python: Remote Attach (Celery Worker)** — Attach debugger to Celery worker in Docker (port 5679).
- **Python Debugger: Main** — Run and debug backend locally.
- **Debug Remix Frontend** — Launch and debug the frontend dev server.

### Usage

1. Open the project in VS Code.
2. Start the relevant services (e.g., with Docker Compose).
3. Go to the Run & Debug panel in VS Code.
4. Select the desired configuration and press Start.

> For remote attach, ensure the backend and/or worker containers are running with debugpy enabled (as configured in Docker).

---

## Stopping Services
```bash
docker-compose down
```

---
