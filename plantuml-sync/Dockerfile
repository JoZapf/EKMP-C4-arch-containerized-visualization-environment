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

# Health check - requests ist bereits installiert
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import requests, sys; r=requests.get('http://localhost:5001/health', timeout=3); sys.exit(0 if r.status_code==200 else 1)"

# Run application
CMD ["python", "app.py"]
