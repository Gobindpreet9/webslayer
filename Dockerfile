FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN adduser --disabled-password --gecos '' appuser
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN playwright install --with-deps firefox \
    && playwright install-deps firefox \
    && chmod -R 777 /root/.cache/ms-playwright

# Install PyTorch for cuda support
RUN python3 -m pip install torch --extra-index-url https://download.pytorch.org/whl/torch_stable.html

COPY . .

RUN chown -R appuser:appuser /app

# Command to run the application
CMD ["python", "main.py"]