# Scripts - EMPC4 VIS Stack

Dieses Verzeichnis enthält Utility-Scripts für Build, Deployment und Wartung des EMPC4 VIS Stack.

---

## 🎨 plantuml_encode.py

**Zweck:** PlantUML-Dateien für URL-Nutzung encodieren (lokale Alternative zu Docker-Tools)

**Features:**
- Encodiert PlantUML-Code für URL-Parameter
- Generiert fertige PNG/SVG/TXT URLs
- Schnelle lokale Nutzung ohne Docker

**Abhängigkeiten:**
```bash
pip install -r scripts/requirements-plantuml.txt
```

**Usage:**
```bash
# Datei encoden
python scripts/plantuml_encode.py repo/c4/beispiel-context.puml
```

**Output:**
```
File: beispiel-context.puml
Encoded: SyfFKj2rKt3CoKnELR1Io4ZDoSa70000

URLs:
  PNG: http://arch.local/plantuml/png/SyfFKj2rKt3CoKnELR1Io4ZDoSa70000
  SVG: http://arch.local/plantuml/svg/SyfFKj2rKt3CoKnELR1Io4ZDoSa70000
  TXT: http://arch.local/plantuml/txt/SyfFKj2rKt3CoKnELR1Io4ZDoSa70000
```

**Alternative:** Für Batch-Processing und erweiterte Features nutze `plantuml-tools` Service (siehe unten).

---

## ⚙️ Docker-basierte Tools

### plantuml-tools Service

**Verzeichnis:** `/plantuml-tools/`

**Zweck:** Umfangreiche PlantUML-Utilities für Batch-Processing und CI/CD

**Features:**
- 📦 Batch-Rendering aller `.puml` Dateien
- 🖼️ PNG/SVG Export
- 🔗 URL-Encoding
- 🚀 CI/CD Integration
- 🐳 Docker-basiert (keine lokale Installation)

**Quick Start:**
```bash
# Service bauen
docker compose build plantuml-tools

# Einzelne Datei encoden
docker compose run --rm plantuml-tools encode repo/c4/beispiel-context.puml

# Einzelne Datei rendern
docker compose run --rm plantuml-tools render repo/c4/beispiel-context.puml

# Alle Dateien im Verzeichnis rendern
docker compose run --rm plantuml-tools batch repo/c4

# Server-Test
docker compose run --rm plantuml-tools test
```

**Befehle:**

| Befehl | Beschreibung | Beispiel |
|--------|--------------|----------|
| `encode` | Encodiert .puml für URL | `encode repo/c4/context.puml` |
| `render` | Rendert einzelne Datei | `render repo/c4/context.puml -f svg` |
| `batch` | Rendert alle .puml Dateien | `batch repo/c4 -o output/` |
| `test` | Testet PlantUML Server | `test` |

**Dokumentation:** [`/plantuml-tools/README.md`](../plantuml-tools/README.md)

---

## 📜 Verfügbare Scripts

### empc4_port_check.py

**Zweck:** Pre-Flight Port-Check vor Container-Start

**Features:**
- Lädt Port-Konfiguration aus `.env`
- Prüft Host-Port-Verfügbarkeit
- Erkennt Port-Konflikte mit laufenden Prozessen
- Docker-Integration (zeigt belegende Container)
- Schlägt alternative Ports vor

**Abhängigkeiten:**
```bash
pip install psutil
```

**Usage:**
```bash
# Einfacher Check
python scripts/empc4_port_check.py

# Mit Details
python scripts/empc4_port_check.py --verbose

# Mit Lösungsvorschlägen
python scripts/empc4_port_check.py --suggest-fixes
```

**Exit-Codes:**
- `0` = Alle Ports frei
- `1` = Konflikte gefunden
- `2` = Fehler (z.B. .env nicht gefunden)

**Integration in setup.sh:**
```bash
#!/bin/bash

# Port-Check vor Start
python scripts/empc4_port_check.py --suggest-fixes
if [ $? -ne 0 ]; then
    echo "❌ Port-Konflikte gefunden! Löse diese zuerst."
    exit 1
fi

# Starte Container
docker compose up -d
```

---

## 🔧 Zukünftige Scripts

### Geplant:
- `empc4_health_check.py` - Container Health Monitoring
- `empc4_backup.py` - Backup-Automation
- `empc4_update.py` - Update-Management

---

## 📚 Dokumentation

- **Port-Management:** [`../docs/20251127_analysing_env_usage.md`](../docs/20251127_analysing_env_usage.md)
- **Dependencies:** [`../repo/docs/setup/dependencies.md`](../repo/docs/setup/dependencies.md)

---

**Letztes Update:** 27.11.2025
