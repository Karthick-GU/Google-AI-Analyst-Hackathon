# Use Python image
FROM python:3.10-slim

# Set workdir
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .

# Upgrade pip and install dependencies
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy rest of the app
COPY . .

## Deleting .env file if exists to avoid conflicts
RUN rm -f .env
# Define default command
CMD ["uvicorn", "main_app:app", "--host", "0.0.0.0", "--port", "8000"]
