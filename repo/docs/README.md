# EKMP-C4 ARCHITEKTUR VISUALISIERUNGS STACK
---
**Containerisierte Visualisierungsumgebung für Kroki API Service, PlantUML , Mermaid und Excalidraw**

[![Docker](https://img.shields.io/badge/Docker-20.10%2B-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Docker Compose](https://img.shields.io/badge/Docker%20Compose-2.0%2B-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.1-blue.svg)](CHANGELOG.md)
[![Learning Project](https://img.shields.io/badge/🎓-Learning%20Project-orange.svg)](#-über-dieses-projekt)
[![PlantUML](https://img.shields.io/badge/PlantUML-C4-yellowgreen.svg)](https://plantuml.com/)
[![Mermaid](https://img.shields.io/badge/Mermaid-Live-ff3670.svg)](https://mermaid.js.org/)

---
> ### 🎓⚠️ **Work in progress / Lernprojekt**  
---

## 🎯 Überblick

EKMP-C4-arch- Excalidraw, Kroki, Mermaid, PlantUML -C4 Architektur Visualisierung - ist eine vollständig lokale containerisierte Lösung für Architektur-Visualisierung und -Dokumentation. Die Umgebung vereint die Tools für "Architecture as Code" in einem einfach zu bedienenden Stack mit custom Features.

### Features
- 🏠 **Dashboard** - Zentraler Einstiegspunkt für alle Tools
- 🎯 **Kroki** - API Diagram Service
- 🎨 **PlantUML Server** - UML und C4-Diagramme als Code
- 🌊 **Mermaid Live Server** - Interaktive Diagramme mit Save/Load Features
- ✏️ **Excalidraw Server** - Interaktives Whiteboard für Architektur-Workshops
- 📚 **MkDocs Material** - Moderne Dokumentation mit Mermaid-Support
- 🔀 **Traefik** - Automatisches Routing und Service Discovery

### Mermaid Live Editor Erweiterungen

Die Mermaid Live Editor Integration wurde mit benutzerdefinierten Features erweitert:

- 💾 **Save Diagram** - Lokales Speichern von Diagrammen als `.mmd` Datei
- 📂 **Load Diagram** - Laden von `.mmd` Dateien zurück in den Editor
- 🔄 **Roundtrip-fähig** - Speichern und Laden ohne Datenverlust
- 🚫 **Keine Cloud-Abhängigkeit** - Alles funktioniert lokal

**Technische Highlights:**
- DOM-Extraktion aus Monaco Editor mit Deduplizierungs-Algorithmus
- URL Hash Manipulation für Editor-Integration
- pako-Kompression für State-Management
- Automatische Button-Injection via Dockerfile

📖 **Dokumentation:** [`docs/features/mermaid_save_load_features.md`](docs/features/mermaid_save_load_features.md)

```
┌─────────────────────────────────────────────┐
│          EMPC4 VIS Stack Dashboard          │
├─────────────────────────────────────────────┤
│ 📚 Dokumentation   │ 🎨 PlantUML Server    │
│ 🌊 Mermaid Server  │ ✏️ Excallidraw Server │
│ 🔧 Traefik Monitor │ 🎯 Kroki API Service  |                  
└─────────────────────────────────────────────┘
```

---

## 🚀 Schnellstart

`http://arch.local/`  

- Port **80** (`arch.local`): Alle Hauptservices über Traefik Reverse Proxy
- Port **8080** (`localhost:8080`): Nur Traefik Monitoring-Dashboard



### Voraussetzungen

- Docker 20.10+
- Docker Compose 2.0+
- 4 GB RAM (8 GB empfohlen)

### Installation

#### Linux / macOS

```bash
# 1. Repository klonen
git clone https://github.com/JoZapf/EMPC4-containerized-visualization-environment.git
cd EMPC4-containerized-visualization-environment

# 2. Setup ausführen (automatisch)
./setup.sh

# 3. Browser öffnen
open http://arch.local/  # macOS
# oder
xdg-open http://arch.local/  # Linux
```

#### Windows

```powershell
# 1. Repository klonen
git clone https://github.com/JoZapf/EMPC4-containerized-visualization-environment.git
cd EMPC4-containerized-visualization-environment

# 2. Setup ausführen (PowerShell als Administrator)
.\setup.ps1

# 3. Browser öffnen
start http://arch.local/
```

#### Windows (PowerShell als Administrator)

```powershell
# 1. Umgebung konfigurieren
Copy-Item .env.example .env

# 2. Domain in hosts-Datei eintragen
Add-Content -Path C:\Windows\System32\drivers\etc\hosts -Value "`n127.0.0.1    arch.local"

# 3. Services starten
docker-compose up -d

# 4. Status prüfen
docker-compose ps
```

---

## 📖 Dokumentation

### ⚠️ Zugriff auf Services

`http://arch.local/` als Basis-URL!  
`http://localhost:8080/` Traefik Monitoring-Dashboard!

| Service | URL | Beschreibung |
|---------|-----|--------------|
| 🏠 **Dashboard** | http://arch.local/ | Haupteinstieg |
| 📚 **Dokumentation** | http://arch.local/docs/index.html | Architektur-Dokumentation |
| 🎨 **PlantUML** | http://arch.local/plantuml | Diagramm-Renderer |
| 🌊 **Mermaid Live** | http://arch.local/mermaid | Interaktiver Editor (mit Save/Load) |
| ✏️ **Whiteboard** | http://arch.local/whiteboard | Excalidraw |
| 🔧 **Traefik** | http://localhost:8080 | Monitoring Dashboard |

### Dokumente

- 📋 **[Runbook](runbook.md)** - Vollständige Betriebsanleitung
- 🏗️ **[Architektur](docs/docu/empc4-vis-arch.md)** - Architektur-Übersicht
- 🐳 **[Docker Compose](docs/docu/empc4-vis-arch_compose.md)** - Technische Details
- 🎨 **[C4-Diagramme](repo/c4/README.md)** - C4-PlantUML Beispiele
- 🌊 **[Mermaid Features](docs/20251124_mermaid_save_load_features.md)** - Save/Load Dokumentation

---

### Services

### Kroki API Server
- Zentraler Rendering-Service für Diagramme
- Unterstützt mehrere Formate (z.B. PlantUML, Mermaid, Graphviz, …)
- HTTP-API für CI/CD, Doku-Pipelines und IDE-Integration
- Keine Diagramm-Assets im Repo nötig – nur Textquellen

#### Traefik (Reverse Proxy)
- Automatisches Routing via Docker Labels
- Service Discovery
- Health Monitoring
- Zukünftig: TLS/HTTPS

#### PlantUML Server
- Rendert UML und C4-Diagramme
- PNG/SVG/TXT Export
- API für IDE-Integration
- Unterstützt C4-PlantUML

#### Mermaid Live Editor (Enhanced)
- Interaktiver Diagramm-Editor
- **Custom Features:**
  - 💾 Lokales Speichern von Diagrammen
  - 📂 Laden von .mmd Dateien
  - 🔄 Vollständiger Roundtrip ohne Datenverlust
- Echtzeit-Vorschau
- Export als SVG/PNG

#### Excalidraw
- Interaktives Whiteboard
- Architektur-Skizzen
- PNG/SVG Export
- Kollaborations-Tool

#### MkDocs Material
- Statische Dokumentation
- Mermaid-Diagramm-Support
- Volltext-Suche
- Dark/Light Mode

### Traefik (Reverse Proxy / Orchestrator)
- Zentraler Entry-Point für alle HTTP(S)-Services im Projekt
- Orchestriert mehrere Web-Services innerhalb eines Docker-Projekts
- Host- und Pfad-basiertes Routing (Pfade)
- Automatisches Routing via Docker Labels (Service Discovery)

---

## 📦 Verzeichnisstruktur

```
.
├── docker-compose.yml       # Service-Definitionen
├── .env.example             # Umgebungsvariablen (Vorlage)
├── setup.sh                 # Automatisches Setup-Script
├── runbook.md               # Umfassende Betriebsanleitung
│
├── dashboard/               # Dashboard-Frontend
│   └── dist/
│       └── index.html       # Hauptseite
│
├── mermaid-live/            # Mermaid Live Editor Container
│   ├── Dockerfile           # Custom Build mit Save/Load Features
│   └── nginx.conf
│
├── mermaid-save-override.js # Save Diagram Feature
├── mermaid-load-button.js   # Load Diagram Feature
│
├── repo/                    # Git-Repository für Inhalte
│   ├── mkdocs.yml           # MkDocs-Konfiguration
│   ├── docs/                # Markdown-Dokumentation
│   │   ├── index.md
│   │   ├── architecture/
│   │   └── examples/
│   ├── c4/                  # C4-PlantUML-Diagramme
│   │   ├── beispiel-context.puml
│   │   ├── beispiel-container.puml
│   │   └── README.md
│   └── assets/              # Bilder, Exports
│       └── excalidraw/
│
└── docs/                    # Technische Dokumentation
    ├── docu/
    │   ├── empc4-vis-arch.md
    │   └── empc4-vis-arch_compose.md
    └── 20251124_mermaid_save_load_features.md  # Feature-Dokumentation
```

---

## 🔧 Troubleshooting

### Port-Konflikte

**Problem:** Container starten nicht - "bind: address already in use"

**Lösung:**

1. **Prüfe welche Ports belegt sind:**
   ```bash
   # Mit Port-Check Script (empfohlen)
   python scripts/empc4_port_check.py --suggest-fixes
   
   # Oder manuell (Windows PowerShell)
   netstat -ano | findstr :80
   netstat -ano | findstr :8090
   
   # Oder manuell (Linux/macOS)
   lsof -i :80
   lsof -i :8090
   ```

2. **Ändere Ports in `.env`:**
   ```bash
   # Editiere .env
   HTTP_PORT=8080              # Statt 80
   TRAEFIK_DASHBOARD_PORT=8091 # Statt 8090
   ```

3. **Starte Container neu:**
   ```bash
   docker compose down
   docker compose up -d
   ```

**Hinweis:** Nur die **externen Host-Ports** (HTTP_PORT, TRAEFIK_DASHBOARD_PORT) können geändert werden. Interne Container-Ports sind hardcoded und müssen nicht geändert werden.

---

### Falsche URL verwendet

**Problem:** Links im Burger-Menü zeigen auf `localhost:8080`

**Lösung:** Verwende die **richtige URL**!

- ✅ **RICHTIG:** `http://arch.local/`
- ❌ **FALSCH:** `http://localhost:8080/`

**Warum?** Port 8080 ist nur für das Traefik Monitoring-Dashboard. Alle anderen Services laufen auf Port 80 via `arch.local`.

**Details:** Siehe [`docs/URL_USAGE.md`](docs/URL_USAGE.md)

---

### arch.local funktioniert nicht

**Problem:** Browser kann `arch.local` nicht auflösen

**Lösung:** Prüfe die hosts-Datei:

**Windows:**
```powershell
# PowerShell als Administrator
notepad C:\Windows\System32\drivers\etc\hosts

# Sollte enthalten:
127.0.0.1    arch.local
```

**Linux/macOS:**
```bash
sudo nano /etc/hosts

# Sollte enthalten:
127.0.0.1    arch.local
```

**Nach Änderung:** Browser neu starten!

---

### PlantUML Bilder zu groß

**Problem:** PlantUML-Diagramme werden abgeschnitten oder nicht gerendert

**Lösung:** Erhöhe die Bildgröße in `.env`:

```bash
# Editiere .env
PLANTUML_LIMIT_SIZE=16384  # Statt 8192
```

**Container neu starten:**
```bash
docker compose restart plantuml-backend
```

---

### Weitere Hilfe

- **Port-Check:** `python scripts/empc4_port_check.py --suggest-fixes`
- **Container-Status:** `docker compose ps`
- **Container-Logs:** `docker compose logs <service-name>`
- **Dependencies:** [Dokumentation](repo/docs/setup/dependencies.md)
- **.env Analyse:** [`docs/20251127_analysing_env_usage.md`](docs/20251127_analysing_env_usage.md)

---

## 🔒 Security

### Aktueller Status

- ✅ Docker Socket read-only (Traefik)
- ✅ Volume Mounts mit minimalen Rechten
- ✅ Netzwerk-Isolation via Docker Network
- ✅ Health Checks für alle Services
- ✅ Client-Side Processing (Mermaid Save/Load)
- ✅ Keine externen API-Calls für Save/Load

---

## 📝 Changelog

### Version 1.1 (2024-11-24)

✨ **Initial Release**

- ✅ **Save Diagram Feature** - Lokales Speichern von Mermaid-Diagrammen als .mmd Datei
- ✅ **Load Diagram Feature** - Laden von .mmd Dateien zurück in den Editor
- ✅ **DOM-Extraktion** - Robuste Code-Extraktion aus Monaco Editor
- ✅ **Deduplizierungs-Algorithmus** - Verhindert doppelte Zeilen beim Export
- ✅ **URL Hash Manipulation** - Native Mermaid Live Integration ohne API-Abhängigkeit
- ✅ **Automatische Script-Injection** - Dockerfiles bauen Features automatisch ein
- ✅ **Umfassende Dokumentation** - Vollständige technische Dokumentation der Features

**Technische Details:**
- DOM-Extraktion aus Monaco's `.view-lines` mit Deduplizierung
- pako-Kompression für State-Management
- Keine Cloud-Abhängigkeit - alles läuft lokal
- Browser-kompatibel: Chrome, Firefox, Safari, Edge

---

### Externe Ressourcen

- [PlantUML](https://plantuml.com/)
- [C4-PlantUML](https://github.com/plantuml-stdlib/C4-PlantUML)
- [MkDocs Material](https://squidfunk.github.io/mkdocs-material/)
- [Mermaid](https://mermaid.js.org/)
- [Mermaid Live Editor](https://github.com/mermaid-js/mermaid-live-editor)
- [Excalidraw](https://excalidraw.com/)
- [Traefik](https://doc.traefik.io/traefik/)

---

## 👥 Autoren

- **JoZapf** - *Initial work & Development* - [GitHub](https://github.com/JoZapf)

**Lernkontext:** Dieses Projekt entstand im Rahmen einer Umschulung zum Fachinformatiker für Anwendungsentwicklung und dient als praktische Übungsumgebung für moderne DevOps-Praktiken und Container-Technologien.

---

## 🙏 Danksagungen

- PlantUML Community für C4-PlantUML
- MkDocs Material Team für das großartige System
- Mermaid.js Team für das flexible Diagramm-Framework
- Excalidraw Team für das Whiteboard-Tool
- Traefik Team für den Reverse Proxy
- Docker Community für die umfassende Dokumentation

---

**Erstellt mit ❤️ für bessere Architektur-Dokumentation und lebenslanges Lernen**
