FROM python:3.11-slim

WORKDIR /workspace

# Install plantuml library and dependencies
RUN pip install --no-cache-dir \
    plantuml \
    requests \
    click \
    six

# Create utility script
COPY plantuml-tools.py /usr/local/bin/plantuml-tools
RUN chmod +x /usr/local/bin/plantuml-tools

# Volume for input/output
VOLUME ["/data"]

# Default command shows help
ENTRYPOINT ["python", "/usr/local/bin/plantuml-tools"]
CMD ["--help"]
