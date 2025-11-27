# .env Nutzung - Analyse & Best Practices

**Projekt:** EMPC4 Containerized Visualization Environment  
**Datum:** 27.11.2025  
**Version:** 1.0  
**Status:** 📊 ANALYSE KOMPLETT

---

## 📋 Executive Summary

### Findings

✅ **GUT:**
- Port-Konfiguration zentral in `.env`
- docker-compose.yml nutzt .env-Variablen mit Fallbacks
- Basis-Domain konfigurierbar
- PlantUML-Konfiguration via ENV-Variable

⚠️ **VERBESSERUNGSPOTENZIAL:**
- **Dockerfiles nutzen KEINE .env-Variablen** (Build-Time vs. Runtime)
- Hardcoded Ports in Dockerfiles (80, 8080)
- Keine automatische Port-Konflikterkennung
- Fehlende .env-Validierung vor Build

---

## 🔍 Detaillierte Analyse

### 1. Aktuelle .env-Variablen

#### Port-Konfiguration

```bash
# HTTP-Port für alle Services (Standard: 80)
HTTP_PORT=80

# HTTPS-Port (Standard: 443, noch nicht konfiguriert)
HTTPS_PORT=443

# Traefik Dashboard Port (Standard: 8080)
TRAEFIK_DASHBOARD_PORT=8080
```

**Verwendung in docker-compose.yml:**
```yaml
reverse-proxy:
  ports:
    - "${HTTP_PORT:-80}:80"  # ✅ Nutzt .env mit Fallback

traefik-dashboard:
  ports:
    - "${TRAEFIK_DASHBOARD_PORT:-8090}:80"  # ✅ Nutzt .env mit Fallback
```

**Status:** ✅ **FUNKTIONIERT** - Ports werden korrekt aus .env gelesen

---

#### Basis-Domain

```bash
# Für lokale Entwicklung: arch.local (muss in /etc/hosts eingetragen werden)
ARCH_BASE_DOMAIN=arch.local
```

**Verwendung in docker-compose.yml:**
```yaml
dashboard:
  labels:
    - "traefik.http.routers.dashboard.rule=Host(`${ARCH_BASE_DOMAIN}`)"
    
docs:
  labels:
    - "traefik.http.routers.docs.rule=Host(`${ARCH_BASE_DOMAIN}`) && PathPrefix(`/docs`)"
```

**Status:** ✅ **FUNKTIONIERT** - Domain wird dynamisch gesetzt

---

#### Repository-Pfad

```bash
# Pfad zum Architektur-Repository (relativ zu docker-compose.yml)
ARCH_REPO_PATH=./repo
```

**Verwendung in docker-compose.yml:**
```yaml
plantuml-backend:
  volumes:
    - "${ARCH_REPO_PATH:-./repo}:/repo:ro"
```

**Status:** ✅ **FUNKTIONIERT** - Pfad konfigurierbar

---

#### PlantUML-Konfiguration

```bash
# Maximale Bildgröße für PlantUML (Standard: 4096)
PLANTUML_LIMIT_SIZE=8192
```

**Verwendung in docker-compose.yml:**
```yaml
plantuml-backend:
  environment:
    - PLANTUML_LIMIT_SIZE=8192  # ⚠️ HARDCODED!
```

**Status:** ⚠️ **PROBLEM** - Nicht aus .env gelesen!

**Fix:**
```yaml
plantuml-backend:
  environment:
    - PLANTUML_LIMIT_SIZE=${PLANTUML_LIMIT_SIZE:-8192}
```

---

### 2. Dockerfile-Analyse

#### Problem: Build-Time vs. Runtime

**Dockerfiles haben KEINEN Zugriff auf .env zur Build-Zeit!**

```dockerfile
# Dockerfile.mkdocs
FROM squidfunk/mkdocs-material:latest AS builder
# ...
EXPOSE 80  # ← HARDCODED!
```

**Grund:**
- `.env` wird von docker-compose zur **Runtime** geladen
- `docker build` kennt `.env` NICHT
- Ports müssen in Dockerfiles hardcoded sein

---

#### Übersicht: Hardcoded Ports in Dockerfiles

| Dockerfile | Container Port | Host Port (via docker-compose) | Status |
|------------|----------------|--------------------------------|--------|
| Dockerfile.mkdocs | 80 | ${HTTP_PORT:-80} | ⚠️ Hardcoded |
| excalidraw/Dockerfile | 80 | Via Traefik (80) | ⚠️ Hardcoded |
| mermaid-live/Dockerfile | 80 | Via Traefik (80) | ⚠️ Hardcoded |
| plantuml-proxy/Dockerfile | 80 | Via Traefik (80) | ⚠️ Hardcoded |
| traefik-proxy/Dockerfile | 80 | ${TRAEFIK_DASHBOARD_PORT:-8090}:80 | ⚠️ Hardcoded |

**Bewertung:**
- ✅ **AKZEPTABEL** - Services laufen intern auf Port 80
- ✅ **PORT-MAPPING** - docker-compose mappt dynamisch auf Host-Ports
- ⚠️ **KEINE FLEXIBILITÄT** - Container-Ports nicht änderbar ohne Rebuild

---

### 3. Architektur-Analyse: Port-Nutzung

#### Externe Ports (Host)

```
Port 80   → Traefik Reverse Proxy (HTTP_PORT)
Port 8090 → Traefik Dashboard Proxy (TRAEFIK_DASHBOARD_PORT)
```

**Konfigurierbar via .env:** ✅ JA

---

#### Interne Ports (Docker Network)

```
empc4_reverse_proxy:        80     (Traefik)
empc4_traefik_dashboard:    80     (nginx)
empc4_dashboard:            80     (nginx)
empc4_plantuml_backend:     8080   (Jetty)
empc4_plantuml_proxy:       80     (nginx)
empc4_docs:                 80     (nginx)
empc4_excalidraw:           80     (nginx)
empc4_mermaid_live:         80     (nginx)
empc4_kroki:                80     (nginx)
empc4_kroki_backend:        8000   (Kroki Server)
empc4_kroki_blockdiag:      8001   (BlockDiag)
empc4_kroki_mermaid:        8002   (Mermaid)
empc4_kroki_bpmn:           8003   (BPMN)
```

**Konfigurierbar via .env:** ❌ NEIN (Hardcoded in Dockerfiles)

**Bewertung:**
- ✅ **KEIN PROBLEM** - Ports sind isoliert im Docker-Network
- ✅ **KEINE KONFLIKTE** - Jeder Container hat eigene Namespace
- ℹ️ **NUR EXTERNE PORTS RELEVANT** für Port-Konflikte

---

### 4. Port-Konflikterkennung

#### Aktuelle Situation

**Keine automatische Erkennung!**

Mögliche Konflikte:
```bash
# Wenn Port 80 bereits belegt:
docker compose up -d
# → ERROR: bind: address already in use
```

**Problem:**
- User muss manuell Ports ändern
- Keine Vorwarnung
- Trial-and-Error-Ansatz

---

#### Lösungsansatz: Pre-Flight Check

**Option A: Shell-Script (setup.sh)**

```bash
#!/bin/bash

# Port-Check Funktion
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port ist bereits belegt!"
        return 1
    fi
    return 0
}

# Lade .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Prüfe Ports
check_port "${HTTP_PORT:-80}" || exit 1
check_port "${TRAEFIK_DASHBOARD_PORT:-8090}" || exit 1

echo "✅ Alle Ports verfügbar!"
docker compose up -d
```

**Option B: Python-Script (port_check.py)**

Nutze `port_usage_report.py` als Basis:
```python
#!/usr/bin/env python3
import os
from pathlib import Path
from port_usage_report import check_port_free

def load_env():
    env_file = Path(".env")
    if not env_file.exists():
        return {}
    
    env = {}
    for line in env_file.read_text().splitlines():
        if line.strip() and not line.startswith("#"):
            key, _, value = line.partition("=")
            env[key.strip()] = value.strip()
    return env

def main():
    env = load_env()
    http_port = int(env.get("HTTP_PORT", "80"))
    traefik_port = int(env.get("TRAEFIK_DASHBOARD_PORT", "8090"))
    
    ports_to_check = {
        "HTTP": http_port,
        "Traefik Dashboard": traefik_port,
    }
    
    all_free = True
    for name, port in ports_to_check.items():
        if not check_port_free("0.0.0.0", port):
            print(f"❌ Port {port} ({name}) ist bereits belegt!")
            all_free = False
        else:
            print(f"✅ Port {port} ({name}) ist verfügbar")
    
    return 0 if all_free else 1

if __name__ == "__main__":
    raise SystemExit(main())
```

---

### 5. Best Practices

#### 5.1 .env-Struktur

**Aktuell: ✅ GUT**
```bash
# Klare Kommentare
# Sinnvolle Defaults
# Gruppierung nach Themen
```

**Empfehlung: Validierung hinzufügen**
```bash
# =============================================================================
# Port-Konfiguration
# =============================================================================
# WICHTIG: Ports müssen verfügbar sein! Prüfe mit: python scripts/check_ports.py
HTTP_PORT=80
TRAEFIK_DASHBOARD_PORT=8090
```

---

#### 5.2 docker-compose.yml Best Practices

**Aktuell:**
```yaml
ports:
  - "${HTTP_PORT:-80}:80"  # ✅ Mit Fallback
```

**Noch besser: Konsistente Fallbacks**
```yaml
plantuml-backend:
  environment:
    - PLANTUML_LIMIT_SIZE=${PLANTUML_LIMIT_SIZE:-8192}  # ✅ Aus .env
    - BASE_URL=uml  # ℹ️ Statisch (OK)
```

---

#### 5.3 Dockerfile Best Practices

**Container-Ports hardcoden ist OK:**
```dockerfile
EXPOSE 80  # ✅ OK - Interne Ports sind isoliert
```

**Runtime-Konfiguration via ENV:**
```dockerfile
ENV MY_CONFIG=${MY_CONFIG:-default}  # ❌ FUNKTIONIERT NICHT!
# ENV-Variablen zur Build-Zeit kommen nicht aus .env!
```

**Richtig:**
```yaml
# In docker-compose.yml:
service:
  environment:
    - MY_CONFIG=${MY_CONFIG:-default}  # ✅ Funktioniert!
```

---

### 6. Zusammenfassung

#### Was funktioniert ✅

1. **Port-Mapping** via .env:
   - HTTP_PORT
   - TRAEFIK_DASHBOARD_PORT

2. **Domain-Konfiguration** via .env:
   - ARCH_BASE_DOMAIN

3. **Volume-Pfade** via .env:
   - ARCH_REPO_PATH

4. **Fallback-Mechanismus:**
   - `${VAR:-default}` Syntax

---

#### Was nicht funktioniert ❌

1. **Build-Time ENV:**
   - Dockerfiles können .env nicht lesen
   - Container-Ports sind hardcoded

2. **PlantUML Config:**
   - PLANTUML_LIMIT_SIZE nicht aus .env gelesen
   - Hardcoded in docker-compose.yml

3. **Port-Konflikterkennung:**
   - Keine automatische Prüfung
   - Fehler erst beim Start

---

#### Empfohlene Fixes 🔧

1. **Fix PlantUML Config:**
```yaml
plantuml-backend:
  environment:
    - PLANTUML_LIMIT_SIZE=${PLANTUML_LIMIT_SIZE:-8192}
```

2. **Port-Check implementieren:**
```bash
# In scripts/check_ports.py
# Vor docker compose up -d ausführen
```

3. **Dokumentation erweitern:**
```markdown
## Ports konfigurieren

1. Editiere `.env`:
   ```bash
   HTTP_PORT=8080  # Statt 80
   ```

2. Prüfe Verfügbarkeit:
   ```bash
   python scripts/check_ports.py
   ```

3. Starte Services:
   ```bash
   docker compose up -d
   ```
```

---

## 📊 Port-Nutzung Übersicht

### Externe Ports (Host → Container)

| Host Port | Container | Service | Konfigurierbar |
|-----------|-----------|---------|----------------|
| 80 | reverse-proxy:80 | Traefik Proxy | ✅ HTTP_PORT |
| 8090 | traefik-dashboard:80 | Traefik UI | ✅ TRAEFIK_DASHBOARD_PORT |

### Interne Ports (Docker Network)

| Container | Port | Protokoll | Beschreibung |
|-----------|------|-----------|--------------|
| empc4_reverse_proxy | 80 | HTTP | Traefik Entry Point |
| empc4_traefik_dashboard | 80 | HTTP | nginx Proxy |
| empc4_dashboard | 80 | HTTP | nginx Static |
| empc4_plantuml_backend | 8080 | HTTP | Jetty Server |
| empc4_plantuml_proxy | 80 | HTTP | nginx Proxy |
| empc4_docs | 80 | HTTP | nginx Static |
| empc4_excalidraw | 80 | HTTP | nginx Static |
| empc4_mermaid_live | 80 | HTTP | nginx Static |
| empc4_kroki | 80 | HTTP | nginx Proxy |
| empc4_kroki_backend | 8000 | HTTP | Kroki Server |
| empc4_kroki_blockdiag | 8001 | HTTP | BlockDiag Service |
| empc4_kroki_mermaid | 8002 | HTTP | Mermaid Service |
| empc4_kroki_bpmn | 8003 | HTTP | BPMN Service |

**Hinweis:** Interne Ports sind isoliert im Docker-Network `empc4_net` und verursachen keine Konflikte.

---

## 🎯 Handlungsempfehlungen

### Priorität 1 (Hoch) 🔴

1. **Fix PlantUML Config:**
   ```yaml
   - PLANTUML_LIMIT_SIZE=${PLANTUML_LIMIT_SIZE:-8192}
   ```

2. **Port-Check Script implementieren:**
   ```bash
   scripts/check_ports.py
   ```

### Priorität 2 (Mittel) 🟡

1. **setup.sh erweitern:**
   - Port-Check vor `docker compose up`
   - Fehler-Handling verbessern

2. **README.md aktualisieren:**
   - Port-Konfiguration dokumentieren
   - Troubleshooting-Sektion

### Priorität 3 (Niedrig) 🟢

1. **CI/CD Integration:**
   - Automatischer Port-Check
   - Pre-commit Hook

2. **.env.example erweitern:**
   - Alle Optionen dokumentieren
   - Best Practices

---

## 📚 Referenzen

- **docker-compose.yml** - Service-Definitionen
- **Dockerfiles** - Container-Builds
- **port_usage_report.py** - Port-Check Referenz

---

**Status:** 📊 ANALYSE KOMPLETT  
**Version:** 1.0  
**Letztes Update:** 27.11.2025  
**Nächste Schritte:** Fixes implementieren, Port-Check Script erstellen
