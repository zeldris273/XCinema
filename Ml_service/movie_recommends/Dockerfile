FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN test -f hybrid_api.py || (echo "ERROR: hybrid_api.py not found!" && exit 1)
RUN test -f recommend_model.pkl || (echo "ERROR: recommend_model.pkl not found!" && exit 1)
RUN test -f ratings.csv || (echo "ERROR: ratings.csv not found!" && exit 1)

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/docs')" || exit 1

CMD ["uvicorn", "hybrid_api:app", "--host", "0.0.0.0", "--port", "8000"]
