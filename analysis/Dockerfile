# Python analysis container
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy analysis script
COPY grocery_analysis.py .

# Create output directory
RUN mkdir -p /app/output

# Set environment variables
ENV DATABASE_URL=postgresql://postgres:postgres123@db:5432/grocery_db
ENV PYTHONUNBUFFERED=1

# Run the analysis
ENTRYPOINT ["python", "grocery_analysis.py"]
CMD ["--output", "/app/output/analysis.html", "--dashboard"]