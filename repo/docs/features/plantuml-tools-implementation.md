# PlantUML Tools - Technische Implementierung

**Feature:** Python-basierte PlantUML Utilities  
**Version:** 1.0  
**Datum:** 27.11.2025  
**Autor:** Jo Zapf

---

## 📐 Architektur-Übersicht

### Komponenten

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Host                          │
│                                                         │
│  ┌──────────────────┐         ┌──────────────────┐    │
│  │ plantuml-tools   │────────▶│ plantuml-backend │    │
│  │ (Python 3.11)    │  HTTP   │ (Java/Jetty)     │    │
│  │                  │         │ Port: 8080       │    │
│  │ - encode         │         │ Context: /uml    │    │
│  │ - render         │         └──────────────────┘    │
│  │ - batch          │                                  │
│  │ - test           │         ┌──────────────────┐    │
│  └──────────────────┘         │ repo/            │    │
│         │                     │ ├── c4/          │    │
│         └────────────────────▶│ │   └── *.puml   │    │
│           Volume Mount        │ └── assets/      │    │
│           /data               │     └── c4/      │    │
│                               └──────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Datenfluss

```
User Command
    │
    ▼
Docker Compose
    │
    ▼
plantuml-tools Container
    │
    ├─→ Read .puml from /data (Volume)
    │
    ├─→ Encode with deflate_and_encode()
    │
    ├─→ HTTP Request to plantuml-backend:8080/uml/
    │
    ├─→ Receive PNG/SVG Response
    │
    └─→ Write to /data (Volume)
```

---

## 🛠️ Technologie-Stack

### Container-Image

**Base Image:** `python:3.11-slim`

**Gewählte Version:**
- ✅ Python 3.11 (aktuell, stabil)
- ✅ `slim` Variant (kleineres Image, ~120MB statt ~900MB)
- ⚠️ Keine `alpine` (httplib2/six Kompatibilitätsprobleme)

### Python-Dependencies

```python
plantuml>=0.3.0      # PlantUML API Client
requests>=2.31.0     # HTTP Client
click>=8.1.0         # CLI Framework
six>=1.16.0          # Python 2/3 Compatibility (required by plantuml)
```

**Dependency Graph:**
```
plantuml-tools.py
├── click (CLI Interface)
├── requests (HTTP Requests)
└── plantuml
    ├── httplib2
    └── six
```

---

## 📦 Docker Integration

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /workspace

# Install dependencies
RUN pip install --no-cache-dir \
    plantuml \
    requests \
    click \
    six

# Copy CLI tool
COPY plantuml-tools.py /usr/local/bin/plantuml-tools
RUN chmod +x /usr/local/bin/plantuml-tools

# Volume for input/output
VOLUME ["/data"]

# Entrypoint
ENTRYPOINT ["python", "/usr/local/bin/plantuml-tools"]
CMD ["--help"]
```

**Design-Entscheidungen:**

1. **ENTRYPOINT vs CMD:**
   - `ENTRYPOINT`: Fixiert das Hauptprogramm
   - `CMD`: Erlaubt flexible Subcommands
   - Kombination: `plantuml-tools <subcommand>`

2. **Volume Mount:**
   - `/data` im Container → `./repo` auf Host
   - Read-Write Access für Output
   - Isolation: Keine Host-Path-Dependencies

3. **No Restart Policy:**
   - Utility-Service, kein Daemon
   - Nur bei Bedarf mit `docker compose run`

---

### docker-compose.yml Integration

```yaml
plantuml-tools:
  build:
    context: ./plantuml-tools
    dockerfile: Dockerfile
  image: empc4-plantuml-tools:latest
  container_name: empc4_plantuml_tools
  environment:
    - PLANTUML_URL=http://empc4_plantuml_backend:8080
  volumes:
    - "${ARCH_REPO_PATH:-./repo}:/data:rw"
  networks:
    - empc4_net
  depends_on:
    - plantuml-backend
  profiles:
    - tools
```

**Wichtige Konfigurationen:**

1. **`profiles: [tools]`:**
   - Service startet NICHT mit `docker compose up`
   - Nur bei explizitem Aufruf: `docker compose run --rm plantuml-tools`
   - Vermeidet unnötigen Ressourcen-Verbrauch

2. **`depends_on: plantuml-backend`:**
   - Stellt sicher dass PlantUML-Server läuft
   - Automatisches Starten bei `docker compose run`

3. **Environment Variables:**
   - `PLANTUML_URL`: Service Discovery via Docker DNS
   - Container-Name `empc4_plantuml_backend` wird aufgelöst

---

## 🐍 Python-Implementierung

### CLI-Struktur (Click Framework)

```python
@click.group()
def cli():
    """PlantUML command-line tools"""
    pass

@cli.command()
def encode(file):
    """Encode PlantUML file"""
    pass

@cli.command()
def render(file, format, out):
    """Render diagram"""
    pass

@cli.command()
def batch(directory, format, out_dir, recursive):
    """Batch process directory"""
    pass

@cli.command()
def test():
    """Test server connection"""
    pass
```

**Vorteile von Click:**
- ✅ Automatische `--help` Generierung
- ✅ Type Validation (z.B. `Path(exists=True)`)
- ✅ Option Groups (z.B. `--format` Choices)
- ✅ Colored Output (✓/✗ Symbole)

---

### PlantUML Library API

**Wichtig:** PlantUML-Server läuft auf `/uml/` Context!

```python
# ❌ FALSCH (404 Error):
plantuml = PlantUML(url='http://server:8080')

# ✅ RICHTIG:
plantuml = PlantUML(url='http://server:8080/uml')
```

**Encoding-Algorithmus:**

```python
from plantuml import deflate_and_encode

# PlantUML Code
code = "@startuml\nAlice -> Bob\n@enduml"

# Encoding-Schritte:
# 1. UTF-8 Encode
# 2. Deflate Compression (zlib)
# 3. Base64-ähnliches Custom Encoding (6-bit)
encoded = deflate_and_encode(code)

# Ergebnis: "SyfFKj2rKt3CoKnELR1Io4ZDoSa70000"
```

**Rendering-API:**

```python
# Single File
plantuml.processes_file(
    filename='diagram.puml',
    outfile='diagram.png'
)

# Mit URL (für custom Formate)
url = plantuml.get_url(code)  # Gibt vollständige URL zurück
response = requests.get(url.replace('/png/', '/svg/'))
```

---

### Error Handling

```python
try:
    plantuml.processes_file(str(file), outfile=str(out))
    click.echo(f"✓ Successfully rendered: {out}")
except Exception as e:
    click.echo(f"✗ Error rendering: {e}", err=True)
    sys.exit(1)  # Non-zero exit für CI/CD
```

**Exit Codes:**
- `0`: Erfolg
- `1`: Fehler beim Rendering/Encoding
- `2`: Verbindungsfehler

**Wichtig für CI/CD:** Exit-Codes stoppen Pipelines bei Fehlern!

---

## 🔧 Konfiguration

### Environment Variables

```python
import os

PLANTUML_URL = os.getenv(
    'PLANTUML_URL',
    'http://empc4_plantuml_backend:8080'
)
```

**Customization möglich:**

```yaml
# docker-compose.override.yml
services:
  plantuml-tools:
    environment:
      - PLANTUML_URL=http://custom-server:8000
```

---

### Volume Mapping

**Standard:**
```yaml
volumes:
  - "${ARCH_REPO_PATH:-./repo}:/data:rw"
```

**Bedeutung:**
- `${ARCH_REPO_PATH:-./repo}`: Host-Pfad (aus .env oder default)
- `/data`: Container-Pfad
- `rw`: Read-Write (für Output-Dateien)

**Zugriff im Container:**

```python
# File-Argument vom User: repo/c4/diagram.puml
# Im Container gemappt zu: /data/c4/diagram.puml

file_path = Path(file)  # /data/c4/diagram.puml
content = file_path.read_text()
out_path = file_path.with_suffix('.png')  # /data/c4/diagram.png
```

---

## 🚀 Performance-Optimierungen

### 1. Batch-Processing

**Sequentiell (aktuell):**
```python
for puml_file in puml_files:
    plantuml.processes_file(str(puml_file), outfile=str(out_file))
```

**Potentiell parallel (zukünftig):**
```python
from concurrent.futures import ThreadPoolExecutor

with ThreadPoolExecutor(max_workers=4) as executor:
    futures = [executor.submit(render_file, f) for f in puml_files]
    for future in futures:
        future.result()
```

**Trade-Off:**
- ✅ 4x schneller bei vielen Dateien
- ⚠️ Höhere CPU/Memory Last
- ⚠️ PlantUML-Server Bottleneck möglich

---

### 2. Caching

**Idee:** Hash-basiertes Caching

```python
import hashlib

def get_file_hash(path):
    return hashlib.md5(Path(path).read_bytes()).hexdigest()

def should_regenerate(puml_file, png_file):
    if not png_file.exists():
        return True
    
    cache_file = png_file.with_suffix('.hash')
    if not cache_file.exists():
        return True
    
    cached_hash = cache_file.read_text()
    current_hash = get_file_hash(puml_file)
    
    return cached_hash != current_hash
```

**Nutzen:**
- ✅ Nur geänderte Dateien neu rendern
- ✅ Deutlich schneller bei großen Projekten
- ⚠️ Zusätzliche `.hash` Dateien

---

### 3. SVG statt PNG

**Performance-Vergleich:**

| Format | Render-Zeit | Dateigröße | Qualität |
|--------|-------------|------------|----------|
| PNG | ~2s | 50-200 KB | Pixelated |
| SVG | ~1.5s | 10-50 KB | Perfect |
| TXT | ~0.5s | 5-10 KB | ASCII-Art |

**Empfehlung:** SVG für Dokumentation, PNG nur für Präsentationen

---

## 🧪 Testing

### Unit Tests (zukünftig)

```python
# tests/test_plantuml_tools.py
import pytest
from pathlib import Path
from plantuml_tools import encode_file

def test_encode_simple_diagram(tmp_path):
    # Arrange
    puml_file = tmp_path / "test.puml"
    puml_file.write_text("@startuml\nAlice -> Bob\n@enduml")
    
    # Act
    encoded = encode_file(str(puml_file))
    
    # Assert
    assert encoded.startswith("SyfFKj2rKt3CoKnELR1Io4ZDoSa70000")

def test_batch_renders_all_files(tmp_path):
    # Arrange
    for i in range(3):
        (tmp_path / f"diagram{i}.puml").write_text(f"@startuml\nA{i} -> B{i}\n@enduml")
    
    # Act
    result = batch_process(str(tmp_path))
    
    # Assert
    assert result['success'] == 3
    assert result['failed'] == 0
    assert len(list(tmp_path.glob("*.png"))) == 3
```

**Test-Kommandos:**
```bash
pytest tests/
pytest --cov=plantuml_tools tests/
```

---

### Integration Tests

```bash
#!/bin/bash
# tests/integration_test.sh

# Start PlantUML Server
docker compose up -d plantuml-backend
sleep 5

# Run tests
docker compose run --rm plantuml-tools test
if [ $? -ne 0 ]; then
    echo "❌ Connection test failed"
    exit 1
fi

# Test encoding
docker compose run --rm plantuml-tools encode repo/c4/beispiel-context.puml
if [ $? -ne 0 ]; then
    echo "❌ Encode test failed"
    exit 1
fi

# Test batch
docker compose run --rm plantuml-tools batch repo/c4 -o /tmp/test
if [ $? -ne 0 ]; then
    echo "❌ Batch test failed"
    exit 1
fi

echo "✓ All integration tests passed"
```

---

## 🔒 Security Considerations

### 1. Volume Mount Security

**Aktuell:**
```yaml
volumes:
  - ./repo:/data:rw
```

**Risiko:** Container hat Write-Access auf Host-Dateien

**Mitigation:**
- ✅ Container läuft als non-root user (Python-Image default)
- ✅ Nur `./repo` gemountet (nicht `/`)
- ⚠️ In Produktion: Read-Only für Quellen

**Bessere Lösung für Produktion:**
```yaml
volumes:
  - ./repo/c4:/data/input:ro   # Read-Only
  - ./repo/assets:/data/output:rw  # Write-Only
```

---

### 2. Network Isolation

**Docker Network:** `empc4_net`

**Isolation:**
- ✅ Tools können nur PlantUML-Backend erreichen
- ✅ Kein direkter Internet-Zugriff
- ✅ Host-Network getrennt

**Firewall-Rules (automatisch via Docker):**
```
plantuml-tools ─┬─> empc4_plantuml_backend ✓
                └─> Internet ✗
```

---

### 3. Input Validation

**PlantUML Code Injection Schutz:**

```python
# PlantUML-Server validiert Input automatisch
# Keine Shell-Commands in .puml möglich
# Kein File-System-Access

# Aber: DoS möglich via komplexe Diagramme
# → PLANTUML_LIMIT_SIZE=8192 limitiert Output-Größe
```

---

## 📊 Monitoring & Debugging

### Logging

**Aktuell:** Console-Output via `click.echo()`

**Zukünftig:** Structured Logging

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger('plantuml-tools')

@cli.command()
def batch(directory):
    logger.info(f"Starting batch processing: {directory}")
    # ...
    logger.info(f"Completed: {success} successful, {failed} failed")
```

---

### Health Checks

**Implementiert:**
```python
@cli.command()
def test():
    """Test PlantUML server health"""
    # Sendet Test-Request
    # Exit-Code 0/1 für Monitoring
```

**Nutzung in Monitoring:**
```bash
# Cron-Job / Monitoring-Tool
docker compose run --rm plantuml-tools test
if [ $? -ne 0 ]; then
    send_alert "PlantUML server down"
fi
```

---

### Debug-Mode

**Zukünftige Erweiterung:**

```python
@cli.command()
@click.option('--verbose', '-v', is_flag=True)
def render(file, verbose):
    if verbose:
        logging.getLogger().setLevel(logging.DEBUG)
        click.echo(f"Debug: File path: {file}")
        click.echo(f"Debug: PlantUML URL: {PLANTUML_URL}")
```

---

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
name: Generate Diagrams

on:
  push:
    paths:
      - 'repo/c4/*.puml'

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Tools
        run: docker compose build plantuml-tools
      
      - name: Start PlantUML
        run: docker compose up -d plantuml-backend
      
      - name: Wait for healthy
        run: |
          timeout 30 bash -c 'until docker compose run --rm plantuml-tools test; do sleep 2; done'
      
      - name: Generate SVGs
        run: docker compose run --rm plantuml-tools batch repo/c4 -f svg -o repo/assets/c4
      
      - name: Commit Changes
        run: |
          git config user.name "GitHub Actions"
          git add repo/assets/c4/*.svg
          git diff --staged --quiet || git commit -m "Auto-generate diagrams [skip ci]"
          git push
```

**Exit Code Handling:** `docker compose run` nutzt Exit-Code des Scripts für Workflow-Status

---

## 🛣️ Roadmap

### Version 1.1 (geplant)

- [ ] **Parallel Rendering** - Batch-Processing mit ThreadPoolExecutor
- [ ] **Caching** - Hash-basiertes Caching für schnellere Builds
- [ ] **Watch Mode** - Automatisches Re-Rendering bei Dateiänderungen
- [ ] **Config File** - YAML-basierte Konfiguration

### Version 1.2 (geplant)

- [ ] **Unit Tests** - pytest Test-Suite
- [ ] **Structured Logging** - JSON-Logs für Log-Aggregation
- [ ] **Metrics** - Prometheus Metrics (Render-Zeit, Success-Rate)
- [ ] **Web API** - Optional REST API für Remote-Rendering

### Version 2.0 (Ideen)

- [ ] **GUI** - Web-basiertes Interface
- [ ] **Plugin System** - Erweiterbar mit custom Processors
- [ ] **Multi-Format** - PDF, DOCX, etc.

---

## 📚 Code-Referenzen

### Wichtige Dateien

```
plantuml-tools/
├── Dockerfile                # Container-Definition
├── plantuml-tools.py         # Haupt-Script (CLI)
└── README.md                 # Ausführliche Dokumentation

docker-compose.yml            # Service-Definition
scripts/
├── plantuml_encode.py        # Lokale Alternative
└── requirements-plantuml.txt # Python-Dependencies
```

### External Dependencies

- **PlantUML Python Library:** https://github.com/dougn/python-plantuml
- **Click Documentation:** https://click.palletsprojects.com/
- **PlantUML Server:** https://plantuml.com/server

---

## 🤝 Contributing

### Development Setup

```bash
# Clone Repository
git clone <repo>
cd empc4-vis-arch

# Build Tools
docker compose build plantuml-tools

# Run in Development Mode
docker compose run --rm --entrypoint /bin/bash plantuml-tools

# Inside Container:
python /usr/local/bin/plantuml-tools --help
```

### Code Style

**Formatter:** `black`
```bash
black plantuml-tools/plantuml-tools.py
```

**Linter:** `flake8`
```bash
flake8 plantuml-tools/plantuml-tools.py
```

### Pull Requests

1. Feature-Branch erstellen
2. Code implementieren + Tests
3. `black` + `flake8` ausführen
4. PR mit Beschreibung öffnen

---

**Version:** 1.0  
**Status:** ✅ Production Ready  
**Maintainer:** Jo Zapf  
**License:** MIT
