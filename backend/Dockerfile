# build from the repo root: docker build -f backend/Dockerfile .
FROM python:3.13-slim
COPY --from=ghcr.io/astral-sh/uv:0.13.1 /uv /bin/

WORKDIR /app

# system dependencies required by LightGBM/XGBoost
RUN apt-get update && apt-get install -y \
  libgomp1 build-essential && apt-get clean && rm -rf /var/lib/apt/lists/*

ENV UV_LINK_MODE=copy UV_COMPILE_BYTECODE=1 UV_PYTHON_DOWNLOADS=never
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv uv sync --locked --no-dev
ENV PATH="/app/.venv/bin:$PATH"

COPY backend/ .

# TODO: make a build script to load all ports and hosts from .env (do the same in config.py, frontend, etc.)
EXPOSE 8000

CMD ["python", "run.py"]
