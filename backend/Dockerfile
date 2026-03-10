FROM python:3.13-slim

WORKDIR /app

# Install system dependencies (asyncpg needs libpq headers)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Install pip / uv
RUN pip install --no-cache-dir uv

# Copy dependency manifest and install
COPY pyproject.toml .
RUN uv pip install --system --no-cache ".[docker]"

# Copy application source
COPY app/ ./app/

# Create images directory for local fallback
RUN mkdir -p /app/images

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
