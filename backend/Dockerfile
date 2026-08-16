# Backend Dockerfile for Consumer Attention Mapping System (CAMS)
FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install system dependencies required for OpenCV, PyTorch, and PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose backend API port
EXPOSE 8001

# Command to seed DB, populate history, prepare datasets, and launch FastAPI server
CMD ["sh", "-c", "python seed.py && python populate_history.py && python download_datasets.py && uvicorn app.main:app --host 0.0.0.0 --port 8001"]
