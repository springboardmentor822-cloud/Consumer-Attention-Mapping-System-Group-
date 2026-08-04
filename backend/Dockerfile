# Stage 1: Builder
FROM python:3.12-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /code

COPY requirements.txt .

# Compile dependencies to wheels
RUN pip wheel --no-cache-dir --wheel-dir /code/wheels -r requirements.txt

# Stage 2: Final Runtime
FROM python:3.12-slim

# Install runtime system dependencies for OpenCV and system checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgl1 \
    libgomp1 \
    ffmpeg \
    libsm6 \
    libxrender1 \
    libxext6 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /code

# Copy wheels from builder and install them
COPY --from=builder /code/wheels /wheels
COPY --from=builder /code/requirements.txt .
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.txt \
    && rm -rf /wheels

# Create space for data (models and videos)
RUN mkdir -p /code/data

# Copy code
COPY . .

# Make startup script executable
RUN chmod +x start.sh

EXPOSE 8000

CMD ["./start.sh"]
