FROM python:3.12-slim

WORKDIR /app

# system dependencies required by LightGBM/XGBoost
RUN apt-get update && apt-get install -y \
    libgomp1 \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# TODO: make a build script to load all ports and hosts from .env (do the same in config.py, frontend, etc.)
EXPOSE 8000

CMD ["python", "run.py"]