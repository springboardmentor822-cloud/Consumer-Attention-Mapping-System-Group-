FROM python:3.12-slim

ARG INSTALL_ML=false

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# ffmpeg supports file/stream decoding; libglib and libgomp are common
# runtime dependencies of headless OpenCV and CPU inference wheels.
RUN apt-get update \
    && apt-get install --yes --no-install-recommends ffmpeg libgl1 libglib2.0-0 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt requirements-ml.txt ./
RUN python -m pip install --upgrade pip \
    && python -m pip install --requirement requirements.txt

# The API/streaming image is lean by default. Set INSTALL_ML=true at build
# time when this container must execute YOLO training or inference jobs.
RUN if [ "$INSTALL_ML" = "true" ]; then \
      python -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu \
      && python -m pip install --requirement requirements-ml.txt; \
    fi

COPY . .
RUN mkdir -p /app/artifacts/models

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
