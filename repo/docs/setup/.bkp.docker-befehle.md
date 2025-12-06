# Docker Befehle

**Projekt:** EKMP-C4 Architektur-Visualisierungs Stack  
**Erstellt:** 23.11.2025  
**Version:** 1.0

---

## 📋 Inhaltsverzeichnis

1. [Grundlegende Befehle](#grundlegende-befehle)
2. [Container-Management](#container-management)
3. [Build-Befehle](#build-befehle)
4. [Logs & Debugging](#logs--debugging)
5. [Netzwerk & Inspektion](#netzwerk--inspektion)
6. [Service-spezifische Workflows](#service-spezifische-workflows)
7. [Troubleshooting](#troubleshooting)
8. [Projekt-spezifische Workflows](#projekt-spezifische-workflows)

---

## Grundlegende Befehle

### Alle Container starten

```bash
# Alle Services starten (detached mode)
docker compose up -d

# Alle Services starten mit Log-Output
docker compose up

# Einzelne Services starten
docker compose up -d reverse-proxy dashboard
```

### Alle Container stoppen

```bash
# Alle Container stoppen (bleiben bestehen)
docker compose stop

# Alle Container stoppen und entfernen
docker compose down

# Container stoppen, entfernen + verwaiste Container entfernen
docker compose down --remove-orphans

# Container stoppen und Volumes entfernen
docker compose down -v

# Container stoppen, Volumes + verwaiste Container entfernen
docker compose down -v --remove-orphans
```

**Hinweis:** `--remove-orphans` entfernt Container, die nicht mehr in der docker-compose.yml definiert sind. Nützlich nach Service-Umbenennungen oder -Entfernungen.

### Container-Status prüfen

```bash
# Alle Container anzeigen
docker compose ps

# Nur laufende Container
docker compose ps --services --filter "status=running"

# Detaillierte Informationen
docker compose ps -a
```

---

## Container-Management

### Einzelne Services verwalten

```bash
# Service starten
docker compose start <service-name>

# Service stoppen
docker compose stop <service-name>

# Service neu starten
docker compose restart <service-name>

# Service entfernen
docker compose rm <service-name>
```

**Beispiele:**

```bash
# Mermaid neu starten
docker compose restart mermaid-live

# PlantUML stoppen
docker compose stop plantuml plantuml-backend

# Dashboard entfernen
docker compose rm dashboard
```

### Health-Status prüfen

```bash
# Health-Status aller Container
docker compose ps --format "table {{.Name}}\t{{.Status}}"

# Einzelnen Container inspizieren
docker inspect empc4_mermaid_live --format='{{.State.Health.Status}}'
```

---

## Build-Befehle

### Standard-Build

```bash
# Alle Services neu bauen
docker compose build

# Einzelnen Service bauen
docker compose build <service-name>

# Mit No-Cache Option (empfohlen bei Problemen)
docker compose build --no-cache <service-name>
```

### Build + Start

```bash
# Bauen und direkt starten
docker compose up -d --build <service-name>

# Nur ändern, was nötig ist
docker compose up -d --force-recreate <service-name>
```

### Service-spezifische Build-Zeiten

| Service | Build-Zeit | Cache | Komplexität |
|---------|-----------|-------|-------------|
| **mermaid-live** | 10-12 min | ⚠️ Groß | ⭐⭐⭐ |
| **excalidraw** | 8-10 min | ⚠️ Groß | ⭐⭐⭐ |
| **docs (MkDocs)** | 2-3 min | ✅ Klein | ⭐⭐ |
| **plantuml** | 1-2 min | ✅ Klein | ⭐⭐ |
| **traefik-dashboard** | <1 min | ✅ Klein | ⭐ |
| **dashboard** | - | - | Image-only |
| **kroki** | - | - | Image-only |

**Hinweis:** Build-Zeiten beim ersten Mal länger (Downloads), danach durch Cache schneller.

### Build-Beispiele

```bash
# Schneller Build (mit Cache)
docker compose build docs

# Langsamer Build (ohne Cache, vollständig neu)
docker compose build --no-cache mermaid-live

# Mehrere Services gleichzeitig bauen
docker compose build mermaid-live excalidraw docs

# Alle Custom-Images neu bauen
docker compose build --no-cache \
  traefik-dashboard \
  plantuml \
  docs \
  excalidraw \
  mermaid-live
```

---

## Logs & Debugging

### Log-Anzeige

```bash
# Logs aller Container
docker compose logs

# Logs eines einzelnen Services
docker compose logs <service-name>

# Logs live verfolgen (follow)
docker compose logs -f <service-name>

# Letzte N Zeilen anzeigen
docker compose logs --tail=50 <service-name>

# Logs mit Zeitstempel
docker compose logs -t <service-name>
```

### Logs filtern

**PowerShell:**

```powershell
# Nach Pattern suchen
docker compose logs mermaid-live | Select-String "Global navigation"

# Fehler anzeigen
docker compose logs reverse-proxy | Select-String "error"

# Mehrere Container gleichzeitig
docker compose logs mermaid-live excalidraw | Select-String "404"
```

**Bash/Linux:**

```bash
# Nach Pattern suchen
docker compose logs mermaid-live | grep "Global navigation"

# Fehler anzeigen
docker compose logs reverse-proxy | grep -i "error"

# Case-insensitive mit Farbe
docker compose logs reverse-proxy | grep -i --color "error"
```

### Log-Beispiele

```bash
# Navigation-Integration prüfen
docker compose logs mermaid-live | grep "Global navigation"
# Erwartete Ausgabe: "✓ Global navigation successfully injected"

# Traefik Routing prüfen
docker compose logs -f reverse-proxy | grep "mermaid"

# Health-Check Fehler finden
docker compose logs --tail=100 plantuml | grep "health"
```

---

## Netzwerk & Inspektion

### Netzwerk-Befehle

```bash
# Alle Docker-Netzwerke anzeigen
docker network ls

# EMPC4-Netzwerk inspizieren
docker network inspect empc4_net

# Welche Container sind im Netzwerk?
docker network inspect empc4_net --format='{{range .Containers}}{{.Name}} {{end}}'
```

### Container-Inspektion

```bash
# Vollständige Container-Informationen
docker inspect <container-name>

# Nur IP-Adresse
docker inspect empc4_mermaid_live --format='{{.NetworkSettings.Networks.empc4_net.IPAddress}}'

# Nur Health-Status
docker inspect empc4_mermaid_live --format='{{.State.Health.Status}}'

# Volumes anzeigen
docker inspect empc4_dashboard --format='{{json .Mounts}}'
```

### Traefik-spezifische Checks

```bash
# Traefik Container inspizieren
docker inspect empc4_reverse_proxy

# Traefik Labels aller Services anzeigen
docker compose config | grep -A 20 "labels:"

# Routing-Rules prüfen (in Logs)
docker compose logs reverse-proxy | grep "rule"
```

---

## Service-spezifische Workflows

### Mermaid Live Editor

```bash
# Build mit No-Cache (bei Problemen)
docker compose build --no-cache mermaid-live

# Starten und Logs verfolgen
docker compose up -d mermaid-live && docker compose logs -f mermaid-live

# Navigation-Integration verifizieren
docker compose logs mermaid-live | grep "Global navigation"
# Expected: ✓ Global navigation successfully injected

# Health-Check prüfen
docker inspect empc4_mermaid_live --format='{{.State.Health.Status}}'
```

### Excalidraw

```bash
# Build + Start
docker compose up -d --build excalidraw

# Navigation prüfen
docker compose logs excalidraw | grep "Global navigation"

# Container neu starten (z.B. nach CSS-Änderung)
docker compose restart excalidraw
```

### MkDocs Dokumentation

```bash
# Dokumentation neu bauen
docker compose build --no-cache docs

# Nach Build: Direkt starten
docker compose up -d docs

# Logs prüfen (wegen mkdocs-material Build-Output)
docker compose logs docs | tail -50

# Health-Check
curl -I http://localhost/docs/
```

### PlantUML Server

```bash
# Backend + Proxy zusammen neu starten
docker compose restart plantuml-backend plantuml

# Nur Proxy neu bauen (nach nginx.conf Änderung)
docker compose build --no-cache plantuml
docker compose up -d plantuml

# Prüfen ob Backend erreichbar ist
docker exec empc4_plantuml_proxy wget -O- http://empc4_plantuml_backend:8080/uml/
```

### Kroki Service

```bash
# Alle Kroki-Services neu starten
docker compose restart kroki kroki-backend kroki-mermaid kroki-blockdiag kroki-bpmn

# Backend Health prüfen
docker exec empc4_kroki_backend wget -O- http://localhost:8000/healthz
```

### Traefik Dashboard

```bash
# Dashboard neu bauen (nach nginx.conf Änderung)
docker compose build --no-cache traefik-dashboard

# Restart mit Reverse Proxy
docker compose restart reverse-proxy traefik-dashboard

# Dashboard-Zugriff testen
curl -I http://localhost:8090/
```

---

## Troubleshooting

### Container startet nicht

```bash
# Prüfe Exit-Code
docker compose ps -a

# Letzte Fehler anzeigen
docker compose logs --tail=100 <service-name>

# Container manuell starten mit Log-Output
docker compose up <service-name>

# Health-Check deaktivieren (temporär zum Debugging)
docker compose up -d --no-healthcheck <service-name>
```

### 502 Bad Gateway (Traefik)

```bash
# 1. Prüfe ob Backend-Service läuft
docker compose ps <service-name>

# 2. Prüfe Backend Health
docker inspect <container-name> --format='{{.State.Health.Status}}'

# 3. Prüfe Traefik Routing
docker compose logs reverse-proxy | grep "<service-name>"

# 4. Prüfe Netzwerk-Verbindung
docker exec empc4_reverse_proxy wget -O- http://<backend-container>:80/
```

### Assets laden nicht (404)

```bash
# Prüfe nginx Logs
docker compose logs <service-name> | grep "404"

# Prüfe nginx.conf im Container
docker exec <container-name> cat /etc/nginx/conf.d/default.conf

# Prüfe ob Files vorhanden sind
docker exec <container-name> ls -la /usr/share/nginx/html/

# Teste direkten Zugriff
docker exec <container-name> wget -O- http://localhost/
```

### Global Navigation fehlt

```bash
# 1. Prüfe Build-Logs
docker compose logs <service-name> | grep "Global navigation"
# Expected: ✓ Global navigation successfully injected

# 2. Prüfe ob CSS/JS im Container sind
docker exec <container-name> ls -la /usr/share/nginx/html/global-nav.*

# 3. Prüfe HTML
docker exec <container-name> grep "global-nav" /usr/share/nginx/html/index.html

# 4. Hard-Refresh im Browser (Ctrl+Shift+R)
```

### Port bereits belegt

```bash
# Prüfe welcher Prozess Port nutzt (Windows PowerShell)
netstat -ano | findstr :80

# Prüfe welcher Prozess Port nutzt (Linux/Mac)
lsof -i :80

# In .env Port ändern und neu starten
echo "HTTP_PORT=8080" >> .env
docker compose up -d
```

### Docker-Disk voll

```bash
# Ungenutzte Images löschen
docker image prune -a

# Ungenutzte Container löschen
docker container prune

# Ungenutzte Volumes löschen (VORSICHT!)
docker volume prune

# Komplette Reinigung (VORSICHT!)
docker system prune -a --volumes
```

### Container baut nicht (Fehler im Dockerfile)

```bash
# Build mit ausführlichem Output
docker compose build --no-cache --progress=plain <service-name>

# Build einzelnes Stage testen (falls Multi-Stage)
docker build --target <stage-name> -f <dockerfile> .

# Build ohne Cache, Schritt für Schritt
docker compose build --no-cache <service-name> 2>&1 | tee build.log
```

---

## Projekt-spezifische Workflows

### Komplett-Neustart (Clean Slate)

```bash
# 1. Alles stoppen und entfernen
docker compose down

# 2. Images löschen (optional, für Clean Build)
docker compose down --rmi all

# 3. Alles neu bauen
docker compose build --no-cache

# 4. Neu starten
docker compose up -d

# 5. Logs prüfen
docker compose logs -f
```

### Navigation-Integration aktualisieren

Wenn `global-nav.css` oder `global-nav.js` geändert wurden:

```bash
# Alle Services mit Navigation neu bauen
docker compose build --no-cache \
  traefik-dashboard \
  plantuml \
  docs \
  excalidraw \
  mermaid-live \
  kroki

# Services neu starten
docker compose up -d \
  traefik-dashboard \
  plantuml \
  docs \
  excalidraw \
  mermaid-live \
  kroki

# Verifikation
docker compose logs excalidraw mermaid-live | grep "Global navigation"
```

### Einzelnen Service komplett neu deployen

```bash
# Beispiel: Mermaid Live Editor

# 1. Service stoppen und entfernen
docker compose down mermaid-live

# 2. Image löschen
docker rmi empc4-mermaid-live:latest

# 3. Neu bauen (ohne Cache)
docker compose build --no-cache mermaid-live

# 4. Starten und Logs verfolgen
docker compose up -d mermaid-live && docker compose logs -f mermaid-live
```

### Production Deployment

```bash
# 1. Git Status prüfen
git status

# 2. Latest Version pullen
git pull origin main

# 3. Alle Services bauen
docker compose build --pull

# 4. Services einzeln aktualisieren (Zero-Downtime)
for service in traefik-dashboard dashboard docs kroki plantuml excalidraw mermaid-live; do
  echo "Updating $service..."
  docker compose up -d --no-deps $service
  sleep 5
done

# 5. Health-Checks prüfen
docker compose ps
```

### Development Workflow

```bash
# 1. Branch wechseln
git checkout feature/neue-funktion

# 2. Nur geänderte Services neu bauen
docker compose up -d --build <geänderter-service>

# 3. Logs live verfolgen
docker compose logs -f <geänderter-service>

# 4. Bei Fehler: Schnell zurückrollen
docker compose down <geänderter-service>
git checkout main
docker compose build <geänderter-service>
docker compose up -d <geänderter-service>
```

### Monitoring & Health-Checks

```bash
# Alle Health-Status anzeigen
for container in empc4_reverse_proxy empc4_dashboard empc4_docs \
                 empc4_mermaid_live empc4_excalidraw empc4_plantuml_proxy \
                 empc4_plantuml_backend empc4_kroki empc4_kroki_backend; do
  status=$(docker inspect $container --format='{{.State.Health.Status}}' 2>/dev/null || echo "N/A")
  printf "%-30s %s\n" "$container:" "$status"
done

# Alle Container mit Problemen finden
docker compose ps --filter "health=unhealthy"
docker compose ps --filter "status=exited"
```

### Backup vor größeren Änderungen

```bash
# 1. Aktuelle Images taggen
for service in traefik-dashboard plantuml docs excalidraw mermaid-live; do
  docker tag empc4-${service}:latest empc4-${service}:backup-$(date +%Y%m%d)
done

# 2. docker-compose.yml sichern
cp docker-compose.yml docker-compose.yml.backup

# 3. Änderungen durchführen
# ...

# 4. Bei Problemen: Zurückrollen
docker compose -f docker-compose.yml.backup up -d
```

---

## Quick Reference

### Häufigste Befehle

```bash
# Status aller Container
docker compose ps

# Logs eines Service live verfolgen
docker compose logs -f <service-name>

# Service neu starten
docker compose restart <service-name>

# Service neu bauen und starten
docker compose up -d --build <service-name>

# Alle Services neu starten
docker compose restart

# Container-Details anzeigen
docker inspect <container-name>

# In Container einsteigen (debugging)
docker exec -it <container-name> sh
```

### Port-Übersicht

| Service | Port | URL |
|---------|------|-----|
| **Traefik (Proxy)** | 80 | http://arch.local |
| **Traefik Dashboard** | 8090 | http://localhost:8090 |
| **Dashboard** | - | http://arch.local/ |
| **Dokumentation** | - | http://arch.local/docs |
| **Mermaid** | - | http://arch.local/mermaid |
| **Excalidraw** | - | http://arch.local/whiteboard |
| **PlantUML** | - | http://arch.local/plantuml |
| **Kroki** | - | http://arch.local/kroki |

### Service-Namen

- `reverse-proxy` - Traefik Reverse Proxy
- `traefik-dashboard` - Traefik UI mit Navigation
- `dashboard` - Haupt-Dashboard
- `docs` - MkDocs Dokumentation
- `mermaid-live` - Mermaid Live Editor
- `excalidraw` - Excalidraw Whiteboard
- `plantuml` - PlantUML Proxy (mit Navigation)
- `plantuml-backend` - PlantUML Server (Java)
- `kroki` - Kroki Frontend
- `kroki-backend` - Kroki Backend
- `kroki-mermaid` - Kroki Mermaid Companion
- `kroki-blockdiag` - Kroki BlockDiag Companion
- `kroki-bpmn` - Kroki BPMN Companion

---

## Weitere Ressourcen

- **Global Navigation Integration:** [GLOBAL_NAVIGATION_INTEGRATION.md](../GLOBAL_NAVIGATION_INTEGRATION.md)
- **Docker Compose Docs:** https://docs.docker.com/compose/
- **Traefik Docs:** https://doc.traefik.io/traefik/

---

**Autor:** Jo Zapf  
**Erstellt:** 23.11.2025  
**Letztes Update:** 23.11.2025  
**Version:** 1.0
