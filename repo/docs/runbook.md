# EMPC4 VIS Stack - Runbook

**Version:** 1.0
**Letzte Aktualisierung:** 2024-11-20
**Status:** ✅ Produktionsbereit

---

## 📋 Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Systemvoraussetzungen](#systemvoraussetzungen)
3. [Schnellstart](#schnellstart)
4. [Architektur](#architektur)
5. [Installation & Setup](#installation--setup)
6. [Betrieb](#betrieb)
7. [Monitoring & Health Checks](#monitoring--health-checks)
8. [Wartung](#wartung)
9. [Troubleshooting](#troubleshooting)
10. [Backup & Recovery](#backup--recovery)
11. [Security](#security)
12. [Häufige Aufgaben](#häufige-aufgaben)
13. [Referenz](#referenz)

---

## Übersicht

### Was ist EMPC4 VIS Stack?

EMPC4 VIS Stack ist eine containerisierte Visualisierungsumgebung, die folgende Tools vereint:

- **PlantUML Server** (inkl. C4-PlantUML) - Architecture as Code
- **MkDocs Material** - Dokumentation mit Mermaid-Support
- **Excalidraw** - Interaktives Whiteboard
- **Traefik** - Reverse Proxy & Load Balancer
- **Dashboard** - Zentraler Einstiegspunkt

### Architektur auf einen Blick

```
Internet/User
    ↓
Traefik Reverse Proxy (:80, :8080)
    ↓
    ├─→ Dashboard (nginx) - /
    ├─→ PlantUML Server - /plantuml
    ├─→ MkDocs - /docs
    └─→ Excalidraw - /whiteboard
        ↓
    Git Repository (repo/)
```

### Service-URLs

| Service | URL | Beschreibung |
|---------|-----|--------------|
| Dashboard | http://arch.local/ | Haupteinstieg |
| Dokumentation | http://arch.local/docs | MkDocs Material |
| PlantUML | http://arch.local/plantuml | Diagramm-Renderer |
| Whiteboard | http://arch.local/whiteboard | Excalidraw |
| Traefik Dashboard | http://localhost:8080 | Monitoring |

---

## Systemvoraussetzungen

### Minimale Anforderungen

- **OS:** Linux, macOS, Windows (mit WSL2)
- **Docker:** Version 20.10+
- **Docker Compose:** Version 2.0+
- **RAM:** 4 GB (8 GB empfohlen)
- **Disk:** 10 GB freier Speicher
- **CPU:** 2 Cores (4+ empfohlen)

### Netzwerk

- **Port 80:** HTTP (Traefik)
- **Port 8080:** Traefik Dashboard (optional)
- **Port 443:** HTTPS (für zukünftige TLS-Konfiguration)

### Software-Abhängigkeiten

```bash
# Prüfe Docker
docker --version
# Output: Docker version 24.0.0+

# Prüfe Docker Compose
docker-compose --version
# Output: Docker Compose version v2.20.0+
```

---

## Schnellstart

### 1. Automatisches Setup (empfohlen)

#### Linux / macOS

```bash
# Repository klonen
git clone https://github.com/JoZapf/EMPC4-containerized-visualization-environment.git
cd EMPC4-containerized-visualization-environment

# Setup-Script ausführen
./setup.sh
```

#### Windows

```powershell
# Repository klonen
git clone https://github.com/JoZapf/EMPC4-containerized-visualization-environment.git
cd EMPC4-containerized-visualization-environment

# Setup-Script ausführen (PowerShell als Administrator)
.\setup.ps1
```

#### Windows (WSL2)

Verwende die Linux-Anleitung innerhalb von WSL2.

Das Script führt automatisch durch:
- ✅ Voraussetzungen-Check
- ✅ .env Konfiguration
- ✅ Verzeichnisstruktur
- ✅ hosts-Datei Konfiguration
- ✅ Service-Start

### 2. Manuelles Setup

#### Linux / macOS

```bash
# 1. .env erstellen
cp .env.example .env

# 2. /etc/hosts anpassen
echo "127.0.0.1    arch.local" | sudo tee -a /etc/hosts

# 3. Services starten
docker-compose up -d

# 4. Status prüfen
docker-compose ps

# 5. Logs ansehen
docker-compose logs -f
```

#### Windows (PowerShell als Administrator)

```powershell
# 1. .env erstellen
Copy-Item .env.example .env

# 2. hosts-Datei anpassen (C:\Windows\System32\drivers\etc\hosts)
Add-Content -Path C:\Windows\System32\drivers\etc\hosts -Value "`n127.0.0.1    arch.local"

# 3. Services starten
docker-compose up -d

# 4. Status prüfen
docker-compose ps

# 5. Logs ansehen
docker-compose logs -f
```

### 3. Zugriff testen

```bash
# Dashboard
curl -I http://arch.local/

# PlantUML
curl -I http://arch.local/plantuml/

# Docs (kann 30-40s dauern beim ersten Start)
curl -I http://arch.local/docs/
```

**Oder im Browser:**
👉 http://arch.local/

---

## Architektur

### Service-Übersicht

#### 1. Traefik (Reverse Proxy)

**Image:** `traefik:v2.11`
**Container:** `empc4_reverse_proxy`
**Ports:** 80, 8080

**Aufgaben:**
- Routing aller Requests
- Service Discovery via Docker Labels
- Health Monitoring
- (Zukünftig) TLS-Termination

**Wichtige Konfiguration:**
```yaml
command:
  - "--providers.docker=true"
  - "--entrypoints.web.address=:80"
```

#### 2. Dashboard (nginx)

**Image:** `nginx:stable-alpine`
**Container:** `empc4_dashboard`
**Mount:** `./dashboard/dist` → `/usr/share/nginx/html`

**Aufgaben:**
- Zentrale Einstiegsseite
- Übersicht aller Services
- Links zu Tools

#### 3. PlantUML Server

**Image:** `plantuml/plantuml-server:jetty`
**Container:** `empc4_plantuml`
**Mount:** `./repo` → `/repo` (read-only)
**Port (intern):** 8080

**Aufgaben:**
- Rendering von PlantUML-Diagrammen
- C4-PlantUML Support
- PNG/SVG/TXT Export
- API für IDEs

**Wichtige Konfiguration:**
```yaml
environment:
  - PLANTUML_LIMIT_SIZE=8192
labels:
  # StripPrefix entfernt /plantuml aus URL
  - "traefik.http.middlewares.plantuml-stripprefix.stripprefix.prefixes=/plantuml"
```

#### 4. MkDocs (Dokumentation)

**Image:** `squidfunk/mkdocs-material:latest`
**Container:** `empc4_docs`
**Mount:** `./repo` → `/docs`
**Port (intern):** 8000

**Aufgaben:**
- Statische Dokumentation
- Mermaid-Rendering
- Volltext-Suche
- Material Theme

**Wichtige Konfiguration:**
```yaml
command: >
  sh -c "pip install --no-cache-dir mkdocs-mermaid2-plugin &&
         mkdocs serve -a 0.0.0.0:8000"
```

**Start-Zeit:** 30-40s (wegen Plugin-Installation)

#### 5. Excalidraw (Whiteboard)

**Image:** `kiliandangendorf/excalidraw:latest`
**Container:** `empc4_excalidraw`
**Port (intern):** 80

**Aufgaben:**
- Interaktives Whiteboard
- Architektur-Skizzen
- PNG/SVG Export

### Netzwerk-Architektur

**Docker Network:** `empc4_net` (bridge)

Alle Services befinden sich im gleichen Netzwerk und können sich untereinander erreichen:

```
empc4_net (172.21.0.0/16)
├─ traefik       (172.21.0.2)
├─ dashboard     (172.21.0.3)
├─ plantuml      (172.21.0.4)
├─ docs          (172.21.0.5)
└─ excalidraw    (172.21.0.6)
```

### Daten-Persistenz

#### Git Repository (`repo/`)

```
repo/
├── mkdocs.yml              # MkDocs Konfiguration
├── docs/                   # Markdown-Dokumentation
│   ├── index.md
│   ├── architecture/
│   │   ├── overview.md
│   │   └── c4-diagrams.md
│   └── examples/
│       ├── mermaid.md
│       └── plantuml.md
├── c4/                     # PlantUML C4-Diagramme
│   └── beispiel-context.puml
└── assets/                 # Bilder, Exports
    └── excalidraw/
```

**Volume-Mounts:**
- PlantUML: `./repo:/repo:ro` (read-only)
- Docs: `./repo:/docs` (read/write für Build)

---

## Installation & Setup

### Vorbereitungen

#### 1. Repository klonen

```bash
git clone https://github.com/JoZapf/EMPC4-containerized-visualization-environment.git
cd EMPC4-containerized-visualization-environment
```

#### 2. Verzeichnisstruktur prüfen

```bash
tree -L 2
# Erwartete Struktur:
.
├── dashboard/
│   └── dist/
├── data/
│   └── letsencrypt/
├── docs/
│   └── docu/
├── repo/
│   ├── mkdocs.yml
│   ├── docs/
│   ├── c4/
│   └── assets/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── setup.sh
└── runbook.md
```

#### 3. Umgebungsvariablen konfigurieren

```bash
# Kopiere Beispiel-Konfiguration
cp .env.example .env

# Bearbeite .env
nano .env  # oder vi, vim, code, etc.
```

**Wichtige Variablen:**

```bash
# Domain (für lokale Entwicklung)
ARCH_BASE_DOMAIN=arch.local

# Ports
HTTP_PORT=80
TRAEFIK_DASHBOARD_PORT=8080

# Repository-Pfad
ARCH_REPO_PATH=./repo

# PlantUML-Konfiguration
PLANTUML_LIMIT_SIZE=8192
```

#### 4. /etc/hosts anpassen

```bash
# Für Linux/macOS
echo "127.0.0.1    arch.local" | sudo tee -a /etc/hosts

# Für Windows (als Administrator in PowerShell)
Add-Content -Path C:\Windows\System32\drivers\etc\hosts -Value "127.0.0.1    arch.local"
```

**Prüfen:**
```bash
ping arch.local
# PING arch.local (127.0.0.1): 56 data bytes
```

### Installation

#### Option A: Automatisch mit setup.sh

```bash
./setup.sh
```

Das Script führt alle Schritte automatisch aus.

#### Option B: Manuell

```bash
# 1. Images pullen
docker-compose pull

# 2. Services starten
docker-compose up -d

# 3. Logs verfolgen
docker-compose logs -f
```

### Erster Start

Beim ersten Start kann die Initialisierung bis zu 60 Sekunden dauern:

1. **Traefik** (5s) - Lädt Konfiguration
2. **Dashboard** (5s) - nginx startet
3. **PlantUML** (15s) - JVM-Initialisierung
4. **MkDocs** (40s) - Plugin-Installation + Server-Start
5. **Excalidraw** (10s) - Web-App startet

**Fortschritt prüfen:**
```bash
# Health Status
docker-compose ps

# Logs in Echtzeit
docker-compose logs -f docs  # MkDocs (dauert am längsten)
```

**Bereit-Checks:**
```bash
# Alle Services "healthy"?
docker-compose ps | grep healthy

# Dashboard erreichbar?
curl -I http://arch.local/
```

---

## Betrieb

### Services starten

```bash
# Alle Services
docker-compose up -d

# Einzelner Service
docker-compose up -d plantuml

# Mit Log-Output (Foreground)
docker-compose up
```

### Services stoppen

```bash
# Alle Services (Container behalten)
docker-compose stop

# Alle Services (Container entfernen)
docker-compose down

# Mit Volumes löschen (VORSICHT!)
docker-compose down -v
```

### Services neu starten

```bash
# Alle Services
docker-compose restart

# Einzelner Service
docker-compose restart docs
```

### Services neu bauen

```bash
# Nach Änderungen an docker-compose.yml
docker-compose up -d --force-recreate

# Bestimmter Service
docker-compose up -d --force-recreate plantuml
```

### Status prüfen

```bash
# Übersicht aller Services
docker-compose ps

# Detaillierte Informationen
docker-compose ps --format json | jq

# Health Status
docker-compose ps | awk '{print $1, $5}'
```

### Logs anzeigen

```bash
# Alle Services
docker-compose logs

# In Echtzeit
docker-compose logs -f

# Bestimmter Service
docker-compose logs -f plantuml

# Letzte 100 Zeilen
docker-compose logs --tail=100

# Mit Timestamps
docker-compose logs -f -t
```

### Ressourcen-Nutzung

```bash
# CPU & RAM
docker stats

# Disk Usage
docker system df

# Nur EMPC4 Container
docker stats empc4_reverse_proxy empc4_dashboard empc4_plantuml empc4_docs empc4_excalidraw
```

---

## Monitoring & Health Checks

### Health Check Konfiguration

Alle Services haben konfigurierte Health Checks:

| Service | Interval | Timeout | Retries | Start Period |
|---------|----------|---------|---------|--------------|
| Dashboard | 30s | 10s | 3 | 10s |
| PlantUML | 30s | 10s | 3 | 20s |
| Docs | 30s | 10s | 5 | 40s |
| Excalidraw | 30s | 10s | 3 | 15s |

### Health Status prüfen

```bash
# Via Docker
docker inspect empc4_plantuml | jq '.[0].State.Health'

# Via docker-compose
docker-compose ps

# Health-Status aller Services
for service in empc4_reverse_proxy empc4_dashboard empc4_plantuml empc4_docs empc4_excalidraw; do
  echo -n "$service: "
  docker inspect $service | jq -r '.[0].State.Health.Status // "no healthcheck"'
done
```

### Traefik Dashboard

Traefik bietet ein integriertes Monitoring-Dashboard:

**URL:** http://localhost:8080

**Features:**
- Übersicht aller Routers & Services
- Middlewares
- Entrypoints
- Health Status
- Request Metrics

### Manueller Service-Test

```bash
# Dashboard
curl -I http://arch.local/
# Erwartung: HTTP/1.1 200 OK

# PlantUML
curl -I http://arch.local/plantuml/
# Erwartung: HTTP/1.1 200 OK

# Docs
curl -I http://arch.local/docs/
# Erwartung: HTTP/1.1 200 OK

# Excalidraw
curl -I http://arch.local/whiteboard/
# Erwartung: HTTP/1.1 200 OK
```

### Automatisches Monitoring-Script

```bash
#!/bin/bash
# monitor.sh - Service-Health-Check

SERVICES=("http://arch.local/" "http://arch.local/plantuml/" "http://arch.local/docs/" "http://arch.local/whiteboard/")

for url in "${SERVICES[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$status" = "200" ]; then
    echo "✅ $url - OK"
  else
    echo "❌ $url - FAIL (HTTP $status)"
  fi
done
```

---

## Wartung

### Updates

#### Service-Images aktualisieren

```bash
# 1. Aktuelle Images pullen
docker-compose pull

# 2. Services neu erstellen
docker-compose up -d --force-recreate

# 3. Alte Images aufräumen
docker image prune -f
```

#### Dokumentation aktualisieren

```bash
# 1. Ändere Dateien in repo/docs/
nano repo/docs/architecture/overview.md

# 2. MkDocs neu laden (automatisch durch Live-Reload)
# oder manuell:
docker-compose restart docs
```

#### PlantUML-Diagramme aktualisieren

```bash
# 1. Bearbeite .puml Dateien
nano repo/c4/beispiel-context.puml

# 2. PlantUML muss nicht neu gestartet werden (liest Dateien bei jedem Request)
```

### Logs rotieren

```bash
# Docker Logs rotieren (in /etc/docker/daemon.json)
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# Docker neu starten
sudo systemctl restart docker
```

### Cleanup

```bash
# Gestoppte Container entfernen
docker container prune -f

# Ungenutzte Images entfernen
docker image prune -a -f

# Ungenutzte Volumes entfernen (VORSICHT!)
docker volume prune -f

# Alles aufräumen (außer Volumes)
docker system prune -f

# Kompletter Cleanup (inkl. Volumes - VORSICHT!)
docker system prune -a --volumes -f
```

---

## Troubleshooting

### Problem: Services starten nicht

**Symptom:**
```bash
docker-compose ps
# Status: Exited (1)
```

**Diagnose:**
```bash
# Logs prüfen
docker-compose logs <service-name>

# Container-Details
docker inspect <container-name>
```

**Häufige Ursachen:**

1. **Port bereits belegt**
   ```bash
   # Prüfe Port 80
   sudo lsof -i :80
   # Stoppe conflicting Service
   sudo systemctl stop apache2  # oder nginx, etc.
   ```

2. **Volume-Mount fehlgeschlagen**
   ```bash
   # Prüfe, ob Verzeichnis existiert
   ls -la repo/
   # Erstelle fehlende Verzeichnisse
   mkdir -p repo/{docs,c4,assets/excalidraw}
   ```

3. **Docker-Socket nicht erreichbar**
   ```bash
   # Prüfe Docker-Service
   sudo systemctl status docker
   # Starte Docker
   sudo systemctl start docker
   ```

### Problem: Service nicht erreichbar (404)

**Symptom:**
```bash
curl http://arch.local/plantuml/
# 404 page not found
```

**Diagnose:**
```bash
# Prüfe Traefik-Routen
curl http://localhost:8080/api/http/routers

# Prüfe Docker Labels
docker inspect empc4_plantuml | jq '.[0].Config.Labels'
```

**Lösung:**

1. **StripPrefix-Middleware fehlt**
   - Prüfe `docker-compose.yml` für Middleware-Konfiguration
   - Middleware muss aktiviert sein:
   ```yaml
   labels:
     - "traefik.http.middlewares.plantuml-stripprefix.stripprefix.prefixes=/plantuml"
     - "traefik.http.routers.plantuml.middlewares=plantuml-stripprefix"
   ```

2. **Service nicht registriert**
   ```bash
   # Traefik neu starten
   docker-compose restart reverse-proxy
   ```

### Problem: MkDocs lädt nicht (timeout)

**Symptom:**
```bash
curl http://arch.local/docs/
# curl: (28) Operation timed out
```

**Ursache:** MkDocs braucht 30-40s beim ersten Start (Plugin-Installation)

**Lösung:**
```bash
# Warte auf Initialisierung
docker-compose logs -f docs

# Suche nach: "Serving on http://0.0.0.0:8000"
```

### Problem: PlantUML rendert nicht

**Symptom:** PlantUML-Server zeigt Fehler beim Rendering

**Diagnose:**
```bash
# Logs prüfen
docker-compose logs plantuml | grep -i error

# Test-Diagramm
curl "http://arch.local/plantuml/txt/SyfFKj2rKt3CoKnELR1Io4ZDoSa70000"
```

**Häufige Ursachen:**

1. **Diagramm zu groß**
   - Erhöhe `PLANTUML_LIMIT_SIZE` in `.env`
   - Standard: 8192, Max empfohlen: 16384

2. **Include-Pfade falsch**
   - C4-PlantUML über URL includen (nicht lokal):
   ```plantuml
   !include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml
   ```

3. **Syntax-Fehler im Diagramm**
   - Validiere PlantUML-Syntax
   - Teste auf http://www.plantuml.com/plantuml/

### Problem: arch.local nicht erreichbar

**Symptom:**
```bash
curl http://arch.local/
# Could not resolve host: arch.local
```

**Diagnose:**
```bash
# Prüfe /etc/hosts
grep arch.local /etc/hosts

# Prüfe DNS-Resolution
nslookup arch.local
```

**Lösung:**
```bash
# Füge zu /etc/hosts hinzu
echo "127.0.0.1    arch.local" | sudo tee -a /etc/hosts

# Verifiziere
ping arch.local
```

### Problem: "Permission Denied" bei Volume-Mounts

**Symptom:**
```
Error: cannot open directory '/docs': Permission denied
```

**Lösung:**
```bash
# Prüfe Berechtigungen
ls -la repo/

# Setze korrekte Berechtigungen
chmod -R 755 repo/

# Für Docs (schreiben)
chmod -R 775 repo/docs/
```

### Problem: Traefik Dashboard nicht erreichbar

**Symptom:**
```bash
curl http://localhost:8080
# Connection refused
```

**Diagnose:**
```bash
# Prüfe, ob Port gemappt ist
docker-compose ps reverse-proxy | grep 8080

# Prüfe Firewall
sudo ufw status
```

**Lösung:**
```bash
# Stelle sicher, dass Port in docker-compose.yml gemappt ist
ports:
  - "${TRAEFIK_DASHBOARD_PORT:-8080}:8080"

# Starte Traefik neu
docker-compose restart reverse-proxy
```

### Debug-Modus

Für detaillierte Diagnose:

```bash
# 1. Erhöhe Traefik Log-Level in docker-compose.yml
command:
  - "--log.level=DEBUG"

# 2. Starte neu
docker-compose up -d --force-recreate reverse-proxy

# 3. Logs ansehen
docker-compose logs -f reverse-proxy
```

---

## Backup & Recovery

### Was sollte gesichert werden?

1. **Git Repository (`repo/`)**
   - Markdown-Dokumentation
   - PlantUML-Diagramme
   - Assets & Exports
   - ✅ **Priorität: HOCH**

2. **Konfiguration**
   - `.env`
   - `docker-compose.yml`
   - ✅ **Priorität: HOCH**

3. **Dashboard**
   - `dashboard/dist/`
   - ✅ **Priorität: MITTEL**

4. **Docker-Daten** (NICHT notwendig)
   - Container können jederzeit neu erstellt werden
   - ❌ **Priorität: NIEDRIG**

### Backup-Strategie

#### Manuelles Backup

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/empc4-vis-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Repository
tar -czf "$BACKUP_DIR/repo.tar.gz" repo/

# Konfiguration
cp .env "$BACKUP_DIR/"
cp docker-compose.yml "$BACKUP_DIR/"

# Dashboard
tar -czf "$BACKUP_DIR/dashboard.tar.gz" dashboard/

echo "Backup erstellt: $BACKUP_DIR"
```

#### Git-basiertes Backup (empfohlen)

Da alle wichtigen Inhalte im `repo/` Verzeichnis liegen:

```bash
# 1. Initialisiere Git (falls noch nicht geschehen)
cd repo/
git init
git add .
git commit -m "Initial commit"

# 2. Füge Remote hinzu
git remote add origin https://github.com/username/empc4-content.git

# 3. Pushe regelmäßig
git push origin main

# 4. Automatisiere mit Cron
# crontab -e
# 0 2 * * * cd /path/to/repo && git add . && git commit -m "Auto-backup $(date)" && git push
```

### Recovery

#### Komplette Wiederherstellung

```bash
# 1. Klone Repository
git clone https://github.com/JoZapf/EMPC4-containerized-visualization-environment.git
cd EMPC4-containerized-visualization-environment

# 2. Stelle Backup wieder her
tar -xzf /backups/empc4-vis-20240101/repo.tar.gz
tar -xzf /backups/empc4-vis-20240101/dashboard.tar.gz
cp /backups/empc4-vis-20240101/.env .

# 3. Starte Services
./setup.sh
```

#### Teilweise Wiederherstellung

**Nur Dokumentation:**
```bash
# Kopiere Docs zurück
cp -r /backups/empc4-vis-20240101/repo/docs/* repo/docs/

# MkDocs neu laden
docker-compose restart docs
```

**Nur Diagramme:**
```bash
# Kopiere C4-Diagramme zurück
cp -r /backups/empc4-vis-20240101/repo/c4/* repo/c4/

# PlantUML muss nicht neu gestartet werden
```

---

## Security

### Aktuelle Sicherheitskonfiguration

#### ✅ Implementiert

- **Docker Socket:** Read-only für Traefik
- **Volume-Mounts:** PlantUML hat read-only Zugriff auf repo/
- **Netzwerk-Isolation:** Alle Services in eigenem Docker-Netzwerk
- **Health Checks:** Automatische Überwachung
- **Log-Rotation:** Verhindert Disk-Vollauf

#### ⚠️ Nicht implementiert (für Produktion erforderlich)

- **TLS/HTTPS:** Aktuell nur HTTP
- **Authentifizierung:** Keine Login-Pflicht
- **Rate Limiting:** Keine Anfrage-Begrenzung
- **CORS:** Nicht konfiguriert
- **Security Headers:** Nicht gesetzt

### TLS/HTTPS aktivieren (TODO)

Für Produktiv-Betrieb HTTPS mit Let's Encrypt aktivieren:

```yaml
# docker-compose.yml - Traefik Service erweitern
command:
  - "--entrypoints.websecure.address=:443"
  - "--certificatesresolvers.le.acme.httpchallenge=true"
  - "--certificatesresolvers.le.acme.email=your-email@example.com"
  - "--certificatesresolvers.le.acme.storage=/letsencrypt/acme.json"
ports:
  - "443:443"
volumes:
  - "./data/letsencrypt:/letsencrypt"

# Labels für Services anpassen
labels:
  - "traefik.http.routers.dashboard.entrypoints=websecure"
  - "traefik.http.routers.dashboard.tls.certresolver=le"
```

### Basic Auth aktivieren (TODO)

Für Admin-Bereiche Basic Auth hinzufügen:

```bash
# 1. Generiere htpasswd-Hash
htpasswd -nb admin changeme
# Output: admin:$apr1$xyz...

# 2. Füge zu .env hinzu ($ verdoppeln für docker-compose!)
BASIC_AUTH_USERS=admin:$$apr1$$xyz...

# 3. Erweitere docker-compose.yml
labels:
  - "traefik.http.middlewares.auth.basicauth.users=${BASIC_AUTH_USERS}"
  - "traefik.http.routers.dashboard.middlewares=auth"
```

### Security Best Practices

1. **Regelmäßige Updates**
   ```bash
   # Wöchentlich Images aktualisieren
   docker-compose pull
   docker-compose up -d --force-recreate
   ```

2. **Secrets nicht committen**
   - `.env` in `.gitignore`
   - Keine Passwörter in docker-compose.yml
   - Verwende Docker Secrets (für Swarm/Kubernetes)

3. **Least Privilege**
   - Container nicht als root laufen lassen (wo möglich)
   - Read-only Volumes wo möglich

4. **Monitoring**
   - Logs regelmäßig prüfen
   - Verdächtige Aktivitäten überwachen

---

## Häufige Aufgaben

### Neue Dokumentationsseite hinzufügen

```bash
# 1. Erstelle Markdown-Datei
nano repo/docs/neue-seite.md

# 2. Füge zu mkdocs.yml hinzu
nav:
  - Home: index.md
  - Neue Seite: neue-seite.md

# 3. MkDocs lädt automatisch neu (Live-Reload)
```

### Neues C4-Diagramm erstellen

```bash
# 1. Erstelle .puml Datei
cat > repo/c4/mein-diagramm.puml << 'EOF'
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml

Person(user, "User")
System(sys, "System")
Rel(user, sys, "Nutzt")
@enduml
EOF

# 2. Öffne in Browser
# http://arch.local/plantuml/

# 3. Oder rendere in IDE (siehe repo/docs/architecture/c4-diagrams.md)
```

### Excalidraw-Export einbinden

```bash
# 1. Zeichne in Excalidraw
# http://arch.local/whiteboard/

# 2. Exportiere als PNG/SVG

# 3. Speichere in repo/assets/excalidraw/

# 4. Binde in Markdown ein
echo "![Meine Skizze](../assets/excalidraw/skizze.png)" >> repo/docs/beispiel.md
```

### IDE für PlantUML konfigurieren

#### VS Code

```bash
# 1. Installiere Extension
code --install-extension jebbs.plantuml

# 2. Konfiguriere in .vscode/settings.json
{
  "plantuml.server": "http://arch.local/plantuml",
  "plantuml.render": "PlantUMLServer"
}

# 3. Öffne .puml und drücke Alt+D für Preview
```

#### IntelliJ IDEA

```
1. File → Settings → Plugins
2. Suche "PlantUML integration"
3. Settings → PlantUML → Server URL: http://arch.local/plantuml
4. Rechtsklick auf .puml → "Show PlantUML Diagram"
```

### Service-Logs in Datei speichern

```bash
# Alle Logs
docker-compose logs > logs.txt

# Bestimmter Zeitraum
docker-compose logs --since 2024-01-01 --until 2024-01-31 > logs-jan.txt

# Nur Fehler
docker-compose logs 2>&1 | grep -i error > errors.txt

# Live-Log in Datei
docker-compose logs -f | tee -a live-log.txt
```

### Performance-Tuning

#### PlantUML beschleunigen

```bash
# Erhöhe Java Heap in docker-compose.yml
environment:
  - JAVA_OPTS=-Xmx1024m
```

#### MkDocs Build-Zeit reduzieren

```bash
# Option 1: Image mit vorinstalliertem Plugin bauen
# Dockerfile:
FROM squidfunk/mkdocs-material:latest
RUN pip install mkdocs-mermaid2-plugin

# Option 2: Plugin-Cache als Volume
volumes:
  - pip-cache:/root/.cache/pip
```

---

## Referenz

### Umgebungsvariablen

| Variable | Default | Beschreibung |
|----------|---------|--------------|
| `ARCH_BASE_DOMAIN` | `arch.local` | Basis-Domain für alle Services |
| `HTTP_PORT` | `80` | HTTP-Port |
| `HTTPS_PORT` | `443` | HTTPS-Port (noch nicht aktiv) |
| `TRAEFIK_DASHBOARD_PORT` | `8080` | Traefik Dashboard Port |
| `ARCH_REPO_PATH` | `./repo` | Pfad zum Repository |
| `PLANTUML_LIMIT_SIZE` | `8192` | Max. Bildgröße für PlantUML |

### Docker-Compose-Befehle

| Befehl | Beschreibung |
|--------|--------------|
| `docker-compose up -d` | Services starten (Hintergrund) |
| `docker-compose down` | Services stoppen und entfernen |
| `docker-compose ps` | Status aller Services |
| `docker-compose logs -f` | Logs in Echtzeit |
| `docker-compose restart <service>` | Service neu starten |
| `docker-compose pull` | Images aktualisieren |
| `docker-compose exec <service> <cmd>` | Befehl in Container ausführen |

### Nützliche Docker-Befehle

| Befehl | Beschreibung |
|--------|--------------|
| `docker ps` | Laufende Container |
| `docker inspect <container>` | Container-Details |
| `docker stats` | Ressourcen-Nutzung |
| `docker logs <container>` | Container-Logs |
| `docker exec -it <container> sh` | Interaktive Shell |
| `docker network ls` | Docker-Netzwerke |
| `docker volume ls` | Docker-Volumes |

### Traefik-API-Endpunkte

Alle über http://localhost:8080 erreichbar:

| Endpunkt | Beschreibung |
|----------|--------------|
| `/api/overview` | Übersicht |
| `/api/http/routers` | Alle HTTP-Routers |
| `/api/http/services` | Alle Services |
| `/api/http/middlewares` | Alle Middlewares |

Beispiel:
```bash
curl http://localhost:8080/api/http/routers | jq
```

### Wichtige Dateien

| Datei | Zweck |
|-------|-------|
| `docker-compose.yml` | Service-Definitionen |
| `.env` | Umgebungsvariablen |
| `repo/mkdocs.yml` | MkDocs-Konfiguration |
| `dashboard/dist/index.html` | Dashboard-HTML |
| `runbook.md` | Diese Datei |
| `setup.sh` | Setup-Automatisierung |

### Externe Ressourcen

- [Traefik Dokumentation](https://doc.traefik.io/traefik/)
- [PlantUML Dokumentation](https://plantuml.com/)
- [C4-PlantUML](https://github.com/plantuml-stdlib/C4-PlantUML)
- [MkDocs Material](https://squidfunk.github.io/mkdocs-material/)
- [Mermaid Dokumentation](https://mermaid.js.org/)
- [Excalidraw](https://excalidraw.com/)

### Support & Kontakt

- **GitHub Issues:** https://github.com/JoZapf/EMPC4-containerized-visualization-environment/issues
- **Repository:** https://github.com/JoZapf/EMPC4-containerized-visualization-environment

---

## Changelog

### Version 1.0 (2024-11-20)

✨ **Initial Release**

- ✅ Docker Compose Setup
- ✅ Traefik Reverse Proxy
- ✅ PlantUML Server mit C4-Support
- ✅ MkDocs Material mit Mermaid
- ✅ Excalidraw Integration
- ✅ Dashboard
- ✅ Health Checks
- ✅ Setup-Automatisierung
- ✅ Umfassende Dokumentation

**Bekannte Probleme:**
- MkDocs-Start dauert 30-40s (Plugin-Installation)
- Excalidraw-Image ist Community-Version (nicht offiziell)
- Kein HTTPS/TLS (nur HTTP)
- Keine Authentifizierung

**Geplant für v1.1:**
- ⏳ TLS/HTTPS mit Let's Encrypt
- ⏳ Basic Auth für Admin-Bereiche
- ⏳ CI/CD-Integration für automatische Diagramm-Generierung
- ⏳ Optimiertes MkDocs-Image (vorinstallierte Plugins)

---

**Ende des Runbooks**

*Dieses Dokument wird kontinuierlich aktualisiert.*
