FROM python:3.12-slim

ENV TZ=America/New_York
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN curl https://install.duckdb.org | sh
RUN export PATH='/root/.duckdb/cli/latest':$PATH

RUN --mount=type=bind,source=requirements.txt,target=/tmp/requirements.txt \
    pip install --break-system-packages --no-cache-dir --requirement /tmp/requirements.txt

RUN mkdir -p data

COPY main.py .

EXPOSE 80

HEALTHCHECK --timeout=5s --retries=5 --interval=5m \
    CMD curl --fail http://localhost:80/health || exit 1

CMD ["fastapi", "run", "main.py", "--port", "80"]
