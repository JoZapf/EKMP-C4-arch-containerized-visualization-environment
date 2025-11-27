# Dependencies - EMPC4 VIS Stack

**Projekt:** EMPC4 Containerized Visualization Environment  
**Datum:** 27.11.2025  
**Version:** 1.0  
**Status:** 📦 VOLLSTÄNDIG

---

## 💻 Host-System Anforderungen

### Erforderliche Software

Bevor die Container gestartet werden können, müssen folgende Programme auf dem **Host-System** installiert sein:

#### 1. Docker Engine

**Version:** 20.10 oder höher (empfohlen: 24.0+)

**Zweck:**
- Container Runtime
- Image Management
- Volume Management
- Network Management

**Installation:**
- **Linux:** https://docs.docker.com/engine/install/
- **Windows:** https://docs.docker.com/desktop/install/windows-install/
- **macOS:** https://docs.docker.com/desktop/install/mac-install/

**Prüfung:**
```bash
docker --version
# Erwartete Ausgabe: Docker version 24.0.x, build ...

docker ps
# Sollte ohne Fehler ausführen
```

**Minimale Systemanforderungen:**
- **RAM:** 4 GB (8 GB empfohlen)
- **Disk:** 10 GB freier Speicher
- **CPU:** 2 Cores (4 Cores empfohlen)

---

#### 2. Docker Compose

**Version:** 2.0 oder höher (empfohlen: 2.20+)

**Zweck:**
- Multi-Container Orchestrierung
- Service-Definitionen (docker-compose.yml)
- Environment-Management (.env)

**Installation:**
- **Linux:** https://docs.docker.com/compose/install/
- **Windows/macOS:** Included in Docker Desktop

**Prüfung:**
```bash
docker compose version
# Erwartete Ausgabe: Docker Compose version v2.x.x

# Oder ältere Version:
docker-compose --version
```

**Hinweis:** Das Projekt unterstützt beide Varianten:
- `docker compose` (neuere Plugin-Version)
- `docker-compose` (ältere Standalone-Version)

---

#### 3. Python (Optional - für Port-Check)

**Version:** 3.8 oder höher

**Zweck:**
- Port-Check Script (`scripts/empc4_port_check.py`)
- Automatische Konflikterkennung vor Container-Start

**Installation:**
- **Linux:** `sudo apt install python3 python3-pip` (Debian/Ubuntu)
- **Windows:** https://www.python.org/downloads/
- **macOS:** `brew install python3`

**Prüfung:**
```bash
python3 --version
# oder
python --version
```

**Python-Pakete:**
```bash
# Erforderlich für Port-Check:
pip install psutil

# Prüfung:
python -c "import psutil; print('psutil OK')"
```

**Status:** ℹ️ **Optional** - Setup-Scripts funktionieren auch ohne Python, Port-Check wird dann übersprungen.

---

#### 4. Git (Optional - für Entwicklung)

**Version:** 2.x

**Zweck:**
- Repository klonen
- Version Control
- Updates pullen

**Installation:**
- **Linux:** `sudo apt install git`
- **Windows:** https://git-scm.com/download/win
- **macOS:** `brew install git` oder XCode Command Line Tools

**Prüfung:**
```bash
git --version
```

**Status:** ℹ️ **Optional** - Nur für Entwickler/Updates nötig, Release-Downloads funktionieren ohne Git.

---

#### 5. curl / wget (Optional - für Health-Checks)

**Zweck:**
- Service-Erreichbarkeit testen
- Health-Check Endpoints aufrufen

**Installation:**
- **Linux:** Meist vorinstalliert
- **Windows:** curl ist ab Windows 10 (1803) vorinstalliert
- **macOS:** Vorinstalliert

**Prüfung:**
```bash
curl --version
# oder
wget --version
```

**Status:** ℹ️ **Optional** - Setup-Scripts funktionieren auch ohne, Tests werden dann übersprungen.

---

### Host-System Konfiguration

#### hosts-Datei

**Erforderlich:** ✅ JA

**Zweck:** Domain-Auflösung für `arch.local`

**Datei-Pfad:**
- **Linux/macOS:** `/etc/hosts`
- **Windows:** `C:\Windows\System32\drivers\etc\hosts`

**Eintrag:**
```
127.0.0.1    arch.local
```

**Setup-Scripts:** Beide Setup-Scripts (`setup.sh`, `setup.ps1`) fügen diesen Eintrag automatisch hinzu (benötigt Admin/sudo).

---

### Port-Verfügbarkeit

**Erforderliche freie Ports auf dem Host:**

| Port | Service | Konfigurierbar | .env Variable |
|------|---------|----------------|---------------|
| 80 | Traefik Reverse Proxy | ✅ Ja | `HTTP_PORT=80` |
| 8090 | Traefik Dashboard | ✅ Ja | `TRAEFIK_DASHBOARD_PORT=8090` |

**Prüfung:**
```bash
# Mit Port-Check Script (empfohlen):
python scripts/empc4_port_check.py --suggest-fixes

# Oder manuell:
# Linux/macOS:
lsof -i :80
lsof -i :8090

# Windows PowerShell:
netstat -ano | findstr :80
netstat -ano | findstr :8090
```

**Konflikt-Lösung:** Siehe [README.md Troubleshooting](../../README.md#troubleshooting)

---

### Betriebssystem-Kompatibilität

| OS | Unterstützt | Getestet | Hinweise |
|----|--------------|----------|----------|
| **Linux** | ✅ Ja | Ubuntu 22.04, Debian 12 | Empfohlen für Produktion |
| **Windows** | ✅ Ja | Windows 10/11 + WSL2 | Docker Desktop erforderlich |
| **macOS** | ✅ Ja | macOS 12+ (Intel & Apple Silicon) | Docker Desktop erforderlich |

**Windows-Spezifisch:**
- WSL2 erforderlich für Docker Desktop
- PowerShell 5.1+ oder PowerShell Core 7+
- Setup-Script: `setup.ps1` (als Administrator ausführen)

**Linux-Spezifisch:**
- User muss in `docker` Gruppe sein: `sudo usermod -aG docker $USER`
- Nach Gruppe hinzufügen: Logout/Login erforderlich
- Setup-Script: `setup.sh` (mit `chmod +x setup.sh` ausführbar machen)

---

### Schnell-Check: Bin ich bereit?

```bash
# 1. Docker installiert?
docker --version && echo "✅ Docker OK" || echo "❌ Docker fehlt"

# 2. Docker Compose installiert?
docker compose version && echo "✅ Compose OK" || echo "❌ Compose fehlt"

# 3. Ports frei? (optional: Python + psutil)
python scripts/empc4_port_check.py 2>/dev/null && echo "✅ Ports OK" || echo "ℹ️ Port-Check übersprungen"

# 4. arch.local in hosts?
grep -q "arch.local" /etc/hosts && echo "✅ hosts OK" || echo "❌ hosts-Eintrag fehlt"  # Linux/macOS
findstr "arch.local" C:\Windows\System32\drivers\etc\hosts && echo "✅ hosts OK" || echo "❌ hosts-Eintrag fehlt"  # Windows

# 5. Alles OK? Dann:
./setup.sh  # Linux/macOS
# oder
.\setup.ps1  # Windows
```

---

## 📦 Container-Abhängigkeiten

Die folgenden Abhängigkeiten sind **innerhalb der Container** und werden automatisch über Docker Images bereitgestellt. **Keine manuelle Installation auf dem Host nötig!**

---

## 📋 Übersicht

Dieses Dokument listet alle Software-Abhängigkeiten und Komponenten des EMPC4 VIS Stack auf, gegliedert nach Services.

### Service-Übersicht

| # | Service | Typ | Basis-Image | Custom Build |
|---|---------|-----|-------------|--------------|
| 1 | [Traefik Reverse Proxy](#1-traefik-reverse-proxy) | Infrastruktur | traefik:v2.11 | ❌ |
| 2 | [Traefik Dashboard Proxy](#2-traefik-dashboard-proxy) | Monitoring | nginx:stable-alpine | ✅ |
| 3 | [Dashboard](#3-dashboard) | Frontend | nginx:stable-alpine | ❌ |
| 4 | [PlantUML Backend](#4-plantuml-backend) | Diagramme | plantuml/plantuml-server:jetty | ❌ |
| 5 | [PlantUML Proxy](#5-plantuml-proxy) | Diagramme | nginx:stable-alpine | ✅ |
| 6 | [MkDocs Dokumentation](#6-mkdocs-dokumentation) | Dokumentation | squidfunk/mkdocs-material:latest | ✅ |
| 7 | [Excalidraw](#7-excalidraw) | Whiteboard | nginx:stable-alpine | ✅ |
| 8 | [Mermaid Live Editor](#8-mermaid-live-editor) | Diagramme | nginx:stable-alpine | ✅ |
| 9 | [Kroki Frontend](#9-kroki-frontend) | Diagramme | nginx:stable-alpine | ❌ |
| 10 | [Kroki Backend](#10-kroki-backend) | Diagramme | yuzutech/kroki:latest | ❌ |
| 11 | [Kroki BlockDiag](#11-kroki-blockdiag) | Diagramme | yuzutech/kroki-blockdiag:latest | ❌ |
| 12 | [Kroki Mermaid](#12-kroki-mermaid) | Diagramme | yuzutech/kroki-mermaid:latest | ❌ |
| 13 | [Kroki BPMN](#13-kroki-bpmn) | Diagramme | yuzutech/kroki-bpmn:latest | ❌ |

---

## 1. Traefik Reverse Proxy

**Container:** `empc4_reverse_proxy`  
**Image:** `traefik:v2.11`  
**Typ:** Infrastruktur / Reverse Proxy

### Software-Komponenten

#### Basis-Software
- **Traefik:** v2.11
  - Reverse Proxy & Load Balancer
  - Service Discovery via Docker Labels
  - Health Monitoring
  - Access Logging

### System-Abhängigkeiten
- **Docker Socket:** Read-Only Zugriff (`/var/run/docker.sock:ro`)
- **Network:** `empc4_net` (Bridge)

### Ports
- **80** (HTTP Entry Point)

### Konfiguration via .env
```bash
HTTP_PORT=80  # Host-Port für HTTP
ARCH_BASE_DOMAIN=arch.local  # Domain für Routing
```

### Funktionen
- ✅ Automatisches Routing zu Services
- ✅ Health-Checks
- ✅ Access Logs
- ✅ Docker Service Discovery

---

## 2. Traefik Dashboard Proxy

**Container:** `empc4_traefik_dashboard`  
**Image:** `empc4-traefik-dashboard:latest` (Custom Build)  
**Typ:** Monitoring / Proxy

### Software-Komponenten

#### Basis-Software
- **nginx:** stable-alpine
  - Reverse Proxy zu Traefik API
  - Global Navigation Integration
  - Health-Check Endpoint

#### Custom-Komponenten
- **global-nav.css** - Globales Navigations-CSS
- **global-nav.js** - Globale Navigation (Burger-Menü)
- **nginx.conf** - Proxy-Konfiguration

### Build-Abhängigkeiten
- **Alpine Linux:** Base Image
- **nginx:** stable-alpine

### Ports
- **80** (nginx → Traefik API)

### Konfiguration via .env
```bash
TRAEFIK_DASHBOARD_PORT=8090  # Host-Port
```

### Funktionen
- ✅ Proxy zu Traefik Dashboard (http://reverse-proxy:8080)
- ✅ Global Navigation Integration
- ✅ Health-Check Endpoint (`/health`)

---

## 3. Dashboard

**Container:** `empc4_dashboard`  
**Image:** `nginx:stable-alpine`  
**Typ:** Frontend / Static Site

### Software-Komponenten

#### Basis-Software
- **nginx:** stable-alpine
  - Static File Serving
  - HTTP Server

#### Frontend-Dateien
- **index.html** - Dashboard Haupt-Seite
  - Responsive Design
  - Service-Kacheln
  - Status-Anzeige
  - Burger-Menü Navigation

### System-Abhängigkeiten
- **Volume Mount:** `./dashboard/dist:/usr/share/nginx/html:ro`

### Ports
- **80** (nginx HTTP)

### Konfiguration via .env
```bash
ARCH_BASE_DOMAIN=arch.local  # Domain für Traefik Routing
```

### Funktionen
- ✅ Zentrale Landing-Page
- ✅ Service-Übersicht
- ✅ Status-Monitoring
- ✅ Navigation zu allen Services

---

## 4. PlantUML Backend

**Container:** `empc4_plantuml_backend`  
**Image:** `plantuml/plantuml-server:jetty`  
**Typ:** Diagramm-Renderer / Backend

### Software-Komponenten

#### Basis-Software
- **Java Runtime:** OpenJDK (via Jetty Image)
- **Jetty:** Application Server
- **PlantUML:** Latest Version
  - UML Diagramm-Rendering
  - C4-PlantUML Support
  - Multiple Output-Formate (PNG, SVG, TXT)

### System-Abhängigkeiten
- **Volume Mount:** `${ARCH_REPO_PATH:-./repo}:/repo:ro`
- **Network:** `empc4_net`

### Ports
- **8080** (Jetty HTTP)

### Konfiguration
```bash
PLANTUML_LIMIT_SIZE=8192  # Maximale Bildgröße
BASE_URL=uml  # Context-Pfad
```

### Funktionen
- ✅ PlantUML Diagramm-Rendering
- ✅ C4-PlantUML Makros
- ✅ PNG/SVG/TXT Export
- ✅ REST API

---

## 5. PlantUML Proxy

**Container:** `empc4_plantuml_proxy`  
**Image:** `empc4-plantuml-proxy:latest` (Custom Build)  
**Typ:** Frontend / Proxy

### Software-Komponenten

#### Basis-Software
- **nginx:** stable-alpine
  - Reverse Proxy zu PlantUML Backend
  - Global Navigation Integration

#### Custom-Komponenten
- **global-nav.css** - Globales Navigations-CSS
- **global-nav.js** - Globale Navigation
- **nginx.conf** - Proxy-Konfiguration mit Health-Check

### Build-Abhängigkeiten
```dockerfile
FROM nginx:stable-alpine
COPY global-nav.css /usr/share/nginx/html/
COPY global-nav.js /usr/share/nginx/html/
COPY plantuml-proxy/nginx.conf /etc/nginx/conf.d/default.conf
```

### Ports
- **80** (nginx)

### Funktionen
- ✅ Proxy zu PlantUML Backend
- ✅ Global Navigation
- ✅ Path Rewriting (`/plantuml` → `/uml`)
- ✅ Health-Check

---

## 6. MkDocs Dokumentation

**Container:** `empc4_docs`  
**Image:** `empc4-mkdocs-material:latest` (Custom Build)  
**Typ:** Dokumentation / Static Site Generator

### Software-Komponenten

#### Build-Stage (Python)
- **squidfunk/mkdocs-material:** latest
  - Static Site Generator
  - Material Design Theme
  - Search Integration
  - Code Highlighting
- **mkdocs-mermaid2-plugin:**
  - Mermaid Diagramm-Support
  - Client-Side Rendering

#### Serve-Stage (nginx)
- **nginx:** alpine
  - Static File Serving
  - Health-Check

### Build-Abhängigkeiten

```dockerfile
# Stage 1: Build
FROM squidfunk/mkdocs-material:latest AS builder
RUN python -m pip install --no-cache-dir mkdocs-mermaid2-plugin

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /docs/site /usr/share/nginx/html
```

### Python-Packages
- **mkdocs:** via mkdocs-material
- **mkdocs-material:** Latest Theme
- **mkdocs-mermaid2-plugin:** Mermaid Support
- **pymdown-extensions:** Markdown Extensions
- **pygments:** Syntax Highlighting

### System-Abhängigkeiten
- **Source:** `./repo` (mkdocs.yml, docs/, c4/)
- **Build Output:** `/docs/site` → `/usr/share/nginx/html`

### Ports
- **80** (nginx)

### Post-Build Processing
```bash
# Asset Path Rewriting
find /docs/site -type f -name "*.html" -exec sed -i \
    -e 's|href="assets/|href="/docs/assets/|g' \
    -e 's|href="stylesheets/|href="/docs/stylesheets/|g' \
    # ... weitere Rewrites
    {} \;
```

### Funktionen
- ✅ Statische Dokumentation
- ✅ Mermaid Diagramm-Support
- ✅ Dark/Light Mode
- ✅ Volltext-Suche
- ✅ Code-Highlighting
- ✅ Navigation-Tabs

---

## 7. Excalidraw

**Container:** `empc4_excalidraw`  
**Image:** `empc4-excalidraw:latest` (Custom Build)  
**Typ:** Whiteboard / Interactive Diagramming

### Software-Komponenten

#### Build-Stage (Node.js)
- **node:** 18-alpine
- **git:** Repository Cloning
- **yarn:** Package Manager
- **Excalidraw:** v0.17.6 (pinned)
  - React Application
  - Canvas-based Drawing
  - SVG/PNG Export

#### Build-Dependencies (Alpine)
- **python3:** Native Module Compilation
- **make:** Build Tools
- **g++:** C++ Compiler

#### Serve-Stage (nginx)
- **nginx:** stable-alpine
  - Static File Serving
  - Vite Build Output

### Build-Prozess

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
RUN apk add --no-cache git python3 make g++
RUN git clone --depth 1 --branch v0.17.6 \
    https://github.com/excalidraw/excalidraw.git .
RUN yarn install --frozen-lockfile --network-timeout 600000
RUN yarn vite build --base=/whiteboard/ --outDir=build

# Stage 2: Serve
FROM nginx:stable-alpine
COPY --from=builder /app/build /usr/share/nginx/html
```

### JavaScript-Abhängigkeiten
- **React:** UI Framework
- **Vite:** Build Tool
- **Canvas API:** Drawing
- **Rough.js:** Hand-drawn Style
- **pako:** Compression

### Custom-Komponenten
- **global-nav.css** - Navigation Integration
- **global-nav.js** - Burger-Menü
- **nginx.conf** - Server-Konfiguration

### Ports
- **80** (nginx)

### Build-Konfiguration
```bash
NODE_ENV=production
REACT_APP_DISABLE_SENTRY=true
REACT_APP_DISABLE_TRACKING=true
--base=/whiteboard/  # Vite Base Path
```

### Funktionen
- ✅ Interaktives Whiteboard
- ✅ Hand-drawn Style
- ✅ Export als PNG/SVG
- ✅ Collaboration (Local)
- ✅ Global Navigation Integration

---

## 8. Mermaid Live Editor

**Container:** `empc4_mermaid_live`  
**Image:** `empc4-mermaid-live:latest` (Custom Build)  
**Typ:** Diagramm-Editor / Interactive

### Software-Komponenten

#### Build-Stage (Node.js)
- **node:** 20-alpine
- **pnpm:** Package Manager (faster)
- **git:** Repository Cloning
- **Mermaid Live Editor:** master branch
  - SvelteKit Application
  - Monaco Editor Integration
  - Mermaid.js Rendering

#### Build-Dependencies (Alpine)
- **python3:** Native Module Compilation
- **make:** Build Tools
- **g++:** C++ Compiler

#### Serve-Stage (nginx)
- **nginx:** stable-alpine
  - Static File Serving
  - SvelteKit SSG Output

### Build-Prozess

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
RUN apk add --no-cache git python3 make g++ && \
    npm install -g pnpm
RUN git clone --depth 1 --branch master \
    https://github.com/mermaid-js/mermaid-live-editor.git .
RUN pnpm install --frozen-lockfile
RUN pnpm run build  # with paths.base: '/mermaid'

# Stage 2: Serve
FROM nginx:stable-alpine
COPY --from=builder /app/docs /usr/share/nginx/html/mermaid
```

### JavaScript-Abhängigkeiten
- **Svelte:** UI Framework
- **SvelteKit:** Meta-Framework (SSG Mode)
- **Monaco Editor:** Code Editor
- **Mermaid.js:** Diagram Rendering
- **pako:** Compression (State Management)

### Custom-Komponenten
- **global-nav.css** - Navigation
- **global-nav.js** - Burger-Menü
- **mermaid-save-override.js** - Save Feature (CUSTOM!)
- **mermaid-load-button.js** - Load Feature (CUSTOM!)
- **mermaid-debug.js** - Debug Tools

### Ports
- **80** (nginx)

### SvelteKit-Konfiguration

```javascript
// svelte.config.js
kit: {
  paths: {
    base: '/mermaid'  // Base path für Routing
  },
  adapter: adapter({
    pages: 'docs',    // Output Directory
    fallback: '404.html'
  })
}
```

### Custom Features (🎨 Erweiterungen)
- **💾 Save Diagram:** Lokales Speichern als `.mmd` Datei
  - DOM-Extraktion aus Monaco Editor
  - Deduplizierungs-Algorithmus
  - Browser Download-API
- **📂 Load Diagram:** Laden von `.mmd` Dateien
  - File-Reader API
  - pako Compression
  - URL Hash Manipulation

### Funktionen
- ✅ Interaktiver Mermaid Editor
- ✅ Live Preview
- ✅ Monaco Editor (Code Completion)
- ✅ Export als PNG/SVG
- ✅ **Save/Load Features (Custom!)**
- ✅ URL State Persistence
- ✅ Global Navigation

---

## 9. Kroki Frontend

**Container:** `empc4_kroki`  
**Image:** `nginx:stable-alpine`  
**Typ:** Diagramm-Service / Frontend

### Software-Komponenten

#### Basis-Software
- **nginx:** stable-alpine
  - Static File Serving
  - Reverse Proxy zu Kroki Backend

#### Frontend-Dateien
- **index.html** - Landing Page
- **global-nav.css** - Navigation
- **global-nav.js** - Burger-Menü
- **nginx.conf** - Proxy-Konfiguration

### System-Abhängigkeiten
- **Volume Mounts:**
  - `./kroki-frontend:/usr/share/nginx/html:ro`
  - `./kroki-frontend/nginx.conf:/etc/nginx/conf.d/default.conf:ro`
- **Dependency:** `kroki-backend` (Container)

### Ports
- **80** (nginx)

### nginx Proxy-Konfiguration
```nginx
location /api/ {
    proxy_pass http://empc4_kroki_backend:8000/;
}
```

### Funktionen
- ✅ Landing Page mit API-Dokumentation
- ✅ Proxy zu Kroki Backend
- ✅ Global Navigation
- ✅ Health-Check

---

## 10. Kroki Backend

**Container:** `empc4_kroki_backend`  
**Image:** `yuzutech/kroki:latest`  
**Typ:** Diagramm-Service / Backend

### Software-Komponenten

#### Basis-Software
- **Kroki Server:** Latest
  - Universal Diagram Service
  - 20+ Diagram Formats
  - REST API

#### Unterstützte Diagramm-Formate
- **Built-in:**
  - PlantUML
  - Ditaa
  - Erd
  - GraphViz
  - Nomnoml
  - Pikchr
  - Structurizr
  - Svgbob
  - Vega / Vega-Lite
  - WaveDrom
- **Via Companions:**
  - BlockDiag (via kroki-blockdiag)
  - Mermaid (via kroki-mermaid)
  - BPMN (via kroki-bpmn)

### System-Abhängigkeiten
- **Companion Services:**
  ```yaml
  KROKI_BLOCKDIAG_HOST=kroki-blockdiag
  KROKI_MERMAID_HOST=kroki-mermaid
  KROKI_BPMN_HOST=kroki-bpmn
  ```

### Ports
- **8000** (HTTP API)

### Funktionen
- ✅ Universal Diagram Rendering
- ✅ REST API (POST/GET)
- ✅ Multiple Output-Formate (SVG, PNG, PDF)
- ✅ Health-Check (`/healthz`)

---

## 11. Kroki BlockDiag

**Container:** `empc4_kroki_blockdiag`  
**Image:** `yuzutech/kroki-blockdiag:latest`  
**Typ:** Companion Service

### Software-Komponenten
- **BlockDiag:** Python-based
  - Block Diagrams
  - Sequence Diagrams
  - Activity Diagrams
  - Network Diagrams

### Ports
- **8001** (Internal)

### Funktionen
- ✅ BlockDiag Rendering
- ✅ SeqDiag, ActDiag, NwDiag Support

---

## 12. Kroki Mermaid

**Container:** `empc4_kroki_mermaid`  
**Image:** `yuzutech/kroki-mermaid:latest`  
**Typ:** Companion Service

### Software-Komponenten
- **Mermaid.js:** JavaScript-based
  - Flowcharts
  - Sequence Diagrams
  - Gantt Charts
  - Class Diagrams
  - State Diagrams
  - Entity-Relationship Diagrams

### Ports
- **8002** (Internal)

### Funktionen
- ✅ Mermaid Rendering
- ✅ All Mermaid Diagram Types

---

## 13. Kroki BPMN

**Container:** `empc4_kroki_bpmn`  
**Image:** `yuzutech/kroki-bpmn:latest`  
**Typ:** Companion Service

### Software-Komponenten
- **BPMN.js:** JavaScript-based
  - Business Process Model and Notation
  - Process Diagrams
  - Collaboration Diagrams

### Ports
- **8003** (Internal)

### Funktionen
- ✅ BPMN Rendering
- ✅ Process Modeling

---

## 📊 Zusammenfassung

### Technologie-Stack

#### Backend
- **nginx:** 8 Container
- **Traefik:** 1 Container
- **Java (Jetty):** 1 Container (PlantUML)
- **Kroki:** 4 Container

#### Frontend
- **React (Vite):** 1 Container (Excalidraw)
- **SvelteKit:** 1 Container (Mermaid Live)
- **Static HTML:** 2 Container (Dashboard, Kroki Frontend)

#### Build-Tools
- **Node.js:** Excalidraw, Mermaid Live
- **Python:** MkDocs
- **Docker Multi-Stage:** 4 Services

### Externe Abhängigkeiten (Cloned)
- **Excalidraw:** https://github.com/excalidraw/excalidraw (v0.17.6)
- **Mermaid Live Editor:** https://github.com/mermaid-js/mermaid-live-editor (master)

### Custom Code
- **Global Navigation:** 2 Dateien (CSS + JS)
- **Mermaid Features:** 3 Dateien (Save, Load, Debug)
- **nginx Configs:** 5 Konfigurationen
- **Dockerfiles:** 5 Custom Builds

---

## 📦 Lizenz-Übersicht

| Software | Lizenz | Link |
|----------|--------|------|
| Traefik | MIT | https://github.com/traefik/traefik |
| nginx | 2-clause BSD | https://nginx.org/ |
| PlantUML | GPL-3.0 | https://plantuml.com/ |
| MkDocs Material | MIT | https://squidfunk.github.io/mkdocs-material/ |
| Excalidraw | MIT | https://github.com/excalidraw/excalidraw |
| Mermaid | MIT | https://github.com/mermaid-js/mermaid |
| Kroki | MIT | https://kroki.io/ |

---

**Status:** 📦 VOLLSTÄNDIG  
**Version:** 1.0  
**Letztes Update:** 27.11.2025  
**Wartung:** Bei Service-Updates aktualisieren
