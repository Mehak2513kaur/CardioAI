# --- Stage 1: Build Frontend ---
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# --- Stage 2: Final Image ---
FROM python:3.9-slim

# Install system dependencies for OpenCV and other ML libs
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Set up user for Hugging Face Spaces (UID 1000)
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

# Copy and install backend dependencies
COPY --chown=user backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --upgrade -r backend/requirements.txt

# Copy backend source code
COPY --chown=user backend/ ./backend/

# Copy built frontend from Stage 1
COPY --chown=user --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set working directory to backend to run the app
WORKDIR /app/backend

# Expose the port HF Spaces expects
EXPOSE 7860

# Run the application with Gunicorn
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:7860", "--timeout", "120"]
