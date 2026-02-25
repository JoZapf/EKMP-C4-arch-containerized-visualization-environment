FROM python:3.11-slim
LABEL maintainer="EMPC4 Team"
LABEL description="PlantUML Real-Time Collaboration Server"
WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir \
    flask \
    flask-socketio \
    python-socketio \
    eventlet \
    requests

# Copy application
COPY app.py /app/

# Expose WebSocket port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:5001/health')" || exit 1

# Run application
CMD ["python", "app.py"]
