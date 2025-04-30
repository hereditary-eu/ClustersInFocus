FROM python:3.12-slim

WORKDIR /app

# Install system dependencies required by LightGBM
RUN apt-get update && apt-get install -y \
  libgomp1 build-essential && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN --mount=type=cache,target=/root/.cache/pip pip install --upgrade --break-system-packages pip poetry poetry-plugin-export
COPY ./pyproject.toml /app/pyproject.toml
COPY ./poetry.lock /app/poetry.lock
RUN poetry export -f requirements.txt >requirements.txt
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt

COPY . .

# TODO: make a build script to load all ports and hosts from .env (do the same in config.py, frontend, etc.)
EXPOSE 8000

CMD ["python", "run.py"]
