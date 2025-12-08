FROM python:3.11-slim

# Tắt buffering để log realtime
ENV PYTHONUNBUFFERED=1

# Cài thư viện cần thiết để build scikit-surprise
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Tạo thư mục app
WORKDIR /app

# Copy file requirements trước
COPY requirements.txt .

# Cài dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ project vào container
COPY . .

# Expose port ML API dùng
EXPOSE 8000

# Lệnh chạy API
CMD ["uvicorn", "movie_recommends.hybrid_api:app", "--host", "0.0.0.0", "--port", "8000"]
