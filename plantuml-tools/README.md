# PlantUML Tools Service

Dieser Service stellt Python-basierte PlantUML-Utilities bereit.

## Features

- ✅ Encoding von PlantUML-Dateien für URLs
- ✅ Batch-Rendering aller `.puml` Dateien
- ✅ PNG/SVG Export
- ✅ CLI-Interface

## Installation

### Option 1: Docker Service (empfohlen für CI/CD)

```bash
# Service in docker-compose.yml hinzufügen
docker compose build plantuml-tools
```

### Option 2: Lokale Installation

```bash
pip install plantuml requests click
```

## Nutzung

### Docker-basiert

```bash
# Datei encoden
docker compose run --rm plantuml-tools encode repo/c4/beispiel-context.puml

# Einzelne Datei rendern
docker compose run --rm plantuml-tools render repo/c4/beispiel-context.puml

# Alle Dateien in einem Verzeichnis
docker compose run --rm plantuml-tools batch repo/c4

# Test
docker compose run --rm plantuml-tools test
```

### Lokal installiert

```bash
# Wenn lokal installiert
python plantuml-tools/plantuml-tools.py encode repo/c4/beispiel-context.puml
python plantuml-tools/plantuml-tools.py batch repo/c4 --format svg
```

## Befehle

### encode

Encodiert eine PlantUML-Datei für URL-Nutzung:

```bash
docker compose run --rm plantuml-tools encode repo/c4/beispiel-context.puml
```

**Output:**
```
Encoded string: SyfFKj2rKt3CoKnELR1Io4ZDoSa70000

PNG URL: http://arch.local/plantuml/png/SyfFKj2rKt3CoKnELR1Io4ZDoSa70000
SVG URL: http://arch.local/plantuml/svg/SyfFKj2rKt3CoKnELR1Io4ZDoSa70000
```

---

### render

Rendert eine einzelne PlantUML-Datei:

```bash
# PNG (default)
docker compose run --rm plantuml-tools render repo/c4/beispiel-context.puml

# SVG
docker compose run --rm plantuml-tools render repo/c4/beispiel-context.puml -f svg

# Custom output
docker compose run --rm plantuml-tools render repo/c4/beispiel-context.puml -o output/diagram.png
```

---

### batch

Rendert alle `.puml` Dateien in einem Verzeichnis:

```bash
# Alle Dateien im Verzeichnis
docker compose run --rm plantuml-tools batch repo/c4

# Mit Unterverzeichnissen
docker compose run --rm plantuml-tools batch repo/c4 --recursive

# SVG statt PNG
docker compose run --rm plantuml-tools batch repo/c4 -f svg

# Custom Output-Verzeichnis
docker compose run --rm plantuml-tools batch repo/c4 -o repo/assets/diagrams
```

---

### test

Testet die Verbindung zum PlantUML-Server:

```bash
docker compose run --rm plantuml-tools test
```

**Output:**
```
Testing connection to http://empc4_plantuml_backend:8080...
✓ PlantUML server is reachable
  Status: 200
  Content-Type: image/png
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Generate Diagrams

on:
  push:
    paths:
      - 'repo/c4/*.puml'

jobs:
  render:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start PlantUML Stack
        run: docker compose up -d plantuml-backend
      
      - name: Wait for PlantUML
        run: sleep 10
      
      - name: Render Diagrams
        run: |
          docker compose run --rm plantuml-tools batch repo/c4 -o repo/assets/c4
      
      - name: Commit Changes
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add repo/assets/c4/*.png
          git commit -m "Auto-generate C4 diagrams" || exit 0
          git push
```

---

### GitLab CI

```yaml
generate-diagrams:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker compose up -d plantuml-backend
    - sleep 10
    - docker compose run --rm plantuml-tools batch repo/c4 -o repo/assets/c4
  artifacts:
    paths:
      - repo/assets/c4/
```

## Programmatische Nutzung

Falls du die Library direkt in Python nutzen willst:

```python
from plantuml import PlantUML, deflate_and_encode

# Server-URL
server = PlantUML(url='http://arch.local/plantuml')

# Datei rendern
server.processes_file('diagram.puml', outfile='diagram.png')

# String encoden
code = """
@startuml
Alice -> Bob: Hello
@enduml
"""
encoded = deflate_and_encode(code)
print(f"URL: http://arch.local/plantuml/png/{encoded}")
```

## Troubleshooting

### Error: Connection refused

**Problem:** PlantUML-Server nicht erreichbar

**Lösung:**
```bash
# Prüfe ob Server läuft
docker compose ps plantuml-backend

# Starte Server falls nötig
docker compose up -d plantuml-backend

# Teste Verbindung
docker compose run --rm plantuml-tools test
```

---

### Error: Module 'plantuml' not found

**Problem:** Bei lokaler Nutzung fehlt Library

**Lösung:**
```bash
pip install plantuml requests click
```

---

### Performance bei vielen Dateien

**Tipp:** Nutze `--format svg` für schnelleres Rendering:

```bash
docker compose run --rm plantuml-tools batch repo/c4 -f svg
```

SVG ist oft schneller als PNG und hat kleinere Dateigrößen.

## Weitere Infos

- **PlantUML Python Library:** https://github.com/dougn/python-plantuml
- **EMPC4 Dokumentation:** http://arch.local/docs/
