# Changelog EMPC4 Architektur-Visualisierungs-Stack

Alle nennenswerten Änderungen am EMPC4 Architektur-Visualisierungs-Stack werden in dieser Datei dokumentiert.

Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

> 🇬🇧 [English version](CHANGELOG.md)

---

## [Unveröffentlicht]

### Geplant
- PlantUML Server-Side Includes (SSI) Analyse
- LaTeX-Integration für wissenschaftliche Dokumentation
- Automatische Architektur-Diagramm-Generierung

---

## [1.5.1] - 2025-02-26

### Hinzugefügt
- **PlantUML Collaboration Opt-in Consent**
  - Sync ist standardmäßig AUS (Privacy first)
  - Toggle-Button zum Aktivieren/Deaktivieren der Kollaboration
  - Drei Status-Zustände: Unavailable (rot), Off (gelb), On (grün)
  - Kein Sync ohne explizite Benutzer-Zustimmung

### Technisch
- **Neue Datei:** `plantuml-proxy/collab-control.js`
  - Interceptet `window.io()` um automatischen Socket.IO Join zu blockieren
  - Interceptet `window.BroadcastChannel` um Same-Origin Tab-Sync zu blockieren
  - Muss im HEAD laden nach socket.io.min.js aber vor sync.js
  - Exponiert `EMPC4_toggleSync()` für UI-Button

- **Geändert:** `plantuml-proxy/nginx.conf`
  - collab-control.js Injection von BODY nach HEAD verschoben
  - Kritisch: Script-Ladereihenfolge bestimmt Interception-Erfolg

- **Behoben:** `plantuml-sync/app.py`
  - `on_disconnect()` akzeptiert jetzt `*args` (Flask-SocketIO übergibt Disconnect-Grund)

### Kritische Erkenntnis
- sync.js nutzt **zwei** Sync-Mechanismen:
  1. Socket.IO für Cross-Browser/Cross-Device Sync
  2. BroadcastChannel für Same-Origin Tab-Sync (schneller, kein Server)
- Beide müssen intercepted werden für vollständige Opt-in Kontrolle

---

## [1.5.0] - 2025-02-25

### Hinzugefügt
- **PlantUML Echtzeit-Kollaboration**
  - WebSocket-basierte Live-Synchronisation zwischen mehreren Clients
  - Flask-SocketIO-Server mit eventlet Async-Modus
  - Room-basierte Synchronisation (gleiche URL = gleicher Room)
  - Cursor-Position-Sharing zwischen Benutzern
  - Automatische Wiederverbindung

### Technisch
- **Neuer Container:** `plantuml-sync` (Flask-SocketIO + eventlet)
  - Namespace `/plantuml-sync` für Socket.IO-Events
  - Events: `join`, `diagram_update`, `cursor_update`, `disconnect`
  - In-Memory Room-Verwaltung via `rooms_data` Dict

- **Geänderter Container:** `plantuml-proxy`
  - Socket.IO-Client-Injection via IIFE-Wrapper (AMD-Kompatibilitäts-Fix)
  - Script-Injection: `socket.io.min.js`, `collab-client.js`

- **Host-nginx-Routen:**
  - `/socket.io/` → Traefik → plantuml-sync:5001
  - `/plantuml-sync/` → Traefik → plantuml-sync:5001

- **Traefik-Labels:**
  - `plantuml-sync` Router für `/plantuml-sync` Pfad
  - `plantuml-sync-socketio` Router für `/socket.io` Pfad

- **Kritische Implementierungsdetails:**
  - `eventlet.monkey_patch()` muss ERSTER Import in app.py sein
  - Socket.IO Namespace ≠ URL-Pfad (Namespace ist logisch, Pfad ist `/socket.io/`)
  - IIFE-Wrapper erforderlich um AMD-Loader-Konflikt mit Monaco Editor zu verhindern

### Dokumentation
- Architektur-Diagramme: `plantuml-collab-architecture.puml`
- Sequenz-Diagramm: `plantuml-collab-sequence.puml`
- Deployment-Diagramm: `plantuml-collab-deployment.puml`
- Fixes-Zusammenfassung: `plantuml-collab-fixes-summary.puml`

---

## [1.4.4] - 2025-02-07

### Behoben
- **Dashboard Health-Check zeigt Services als orange (checking)**
  - Problem: Image-Trick mit favicon.ico funktioniert nicht für Services ohne Favicon
  - Lösung: Same-Origin Services nutzen jetzt fetch() HEAD-Request, Cross-Origin weiterhin Image-Trick
  - Betroffen: Dashboard, Docs, PlantUML, Kroki, Mermaid, Excalidraw zeigten orange statt grün

### Technisch
- **Geänderte Dateien:**
  - `dashboard/dist/health-check.js` - checkViaImage() für Same-Origin fetch() umgeschrieben

- **Erforderliche Aktion:**
  - `docker-compose restart dashboard`

---

## [1.4.3] - 2025-02-07

### Behoben
- **Dashboard-Navigation fehlte**
  - Problem: global-nav.css und global-nav.js waren nicht im dashboard/dist/ Verzeichnis
  - Lösung: Dateien von Root nach dashboard/dist/ kopiert, Pfade in index.html auf relativ geändert
  - Betroffen: Dashboard-Seite konnte nicht laden

### Technisch
- **Neue Dateien:**
  - `dashboard/dist/global-nav.css`
  - `dashboard/dist/global-nav.js`

- **Geänderte Dateien:**
  - `dashboard/dist/index.html` - Pfade von absolut (`/global-nav.css`) auf relativ (`global-nav.css`)

- **Erforderliche Aktion:**
  - `docker-compose restart dashboard`

---

## [1.4.2] - 2025-12-06

### Behoben
- **Kroki global-nav.css/js 404-Fehler**
  - Problem: Browser fragte `/global-nav.css` statt `/kroki/global-nav.css` an
  - Ursache: Traefik entfernt `/kroki` Prefix, aber HTML hatte absolute Pfade ohne Prefix
  - Lösung: Pfade in `kroki-frontend/index.html` auf `/kroki/global-nav.*` geändert

- **Health-Check Traefik-Ports falsch**
  - Problem: Health-Check fragte Port 8080 statt 9090
  - Lösung: URLs in `health-check.js` auf Port 9090 aktualisiert

- **Health-Check zeigt "online" bei 404**
  - Problem: `img.onerror` gab `status: 'online'` zurück (Design-Fehler)
  - Lösung: Neuer Status `error` mit gelber `warning`-Anzeige

### Technisch
- **Geänderte Dateien:**
  - `kroki-frontend/index.html` - Pfade für global-nav
  - `dashboard/dist/health-check.js` - Ports + Error-Handling
  - `dashboard/dist/index.html` - CSS für `.warning` Status

- **Kein Rebuild erforderlich** - Dateien sind per Volume gemountet

---

## [1.4.1] - 2025-12-06

### Behoben
- **Traefik Dashboard Redirect**
  - Problem: `http://localhost:9090/` leitete zu `http://localhost/dashboard/` (Port verloren)
  - Ursache: Traefik interner Redirect ohne Port-Erhaltung
  - Lösung: nginx macht Redirect selbst mit `$http_host` (enthält Port)

- **Traefik Dashboard Burger-Menü-Links**
  - Problem: Alle Links zeigten auf `localhost:9090/...` statt `arch.local/...`
  - Ursache: Globale `global-nav.js` mit relativen Pfaden
  - Lösung: Separate `traefik-proxy/global-nav.js` mit absoluten URLs zu `http://arch.local/`

- **PlantUML GitHub-Banner wieder sichtbar**
  - Problem: "Fork me on GitHub" Banner wurde nicht mehr ausgeblendet
  - Ursache: `sub_filter` String-Match funktioniert nicht mehr (HTML-Struktur geändert)
  - Lösung: CSS-Injection (`plantuml-hide.css`) - robuster als String-Matching

### Technisch
- **Neue Dateien:**
  - `traefik-proxy/global-nav.js` - Absolute URLs für Traefik Dashboard
  - `plantuml-hide.css` - CSS zum Ausblenden von GitHub-Banner

- **Geänderte Dateien:**
  - `traefik-proxy/nginx.conf` - Root-Redirect mit Port-Erhaltung
  - `traefik-proxy/Dockerfile` - Lokale global-nav.js verwenden
  - `plantuml-proxy/nginx.conf` - sub_filter entfernt, CSS-Injection
  - `plantuml-proxy/Dockerfile` - plantuml-hide.css hinzugefügt

- **Erforderliche Rebuilds:**
  - `docker-compose build --no-cache traefik-dashboard plantuml`

---

## [1.4.0] - 2025-12-06

### Hinzugefügt
- **Dashboard-Footer mit Tab-System**
  - Tab 1 "Info & Links": Projekt-Info, Repository, Dokumentation, Runbook
  - Tab 2 "Kontakt & Profile": Social Cards (Website, LinkedIn, GitHub)
  - Smooth Tab-Switching-Animation
  - Mobile-optimiertes Layout

- **Mermaid Werbebanner-Ausblendung**
  - Neue CSS-Datei: `mermaid-ad-hide.css`
  - Blendet "Mermaid Chart" Promotional Banner dauerhaft aus
  - CSS-Selektoren für verschiedene Banner-Varianten

### Geändert
- **Burger-Menü-Vereinheitlichung**
  - Dashboard: Menü aus Header entfernt, globales Floating-Menü aktiviert
  - Kroki: nginx.conf korrigiert für statische Dateien
  - MkDocs: CSS/JS auf Floating-Version aktualisiert
  - Alle Services nutzen jetzt identisches Menü-Design

### Behoben
- **Traefik Dashboard-Link korrigiert**
  - Problem: Links zeigten auf Port 8080 statt 9090
  - Behoben in: `dashboard/dist/index.html`, `global-nav.js`

- **Kroki-Navigation nicht sichtbar**
  - Problem: nginx location `/` fing alle Requests ab
  - Lösung: Explizite `alias` Direktiven für `/global-nav.*`

---

## [1.3.0] - 2025-11-30

### Hinzugefügt
- **MkDocs Metadata-System**
  - Automatische Projekt-Variablen aus `mkdocs.yml`
  - YAML Front Matter für dokumenten-spezifische Metadaten
  - File-Macros: `file_modified_date()` und `file_size()`

### Geändert
- **Traefik Dashboard Port:** 8080 → 9090 (Port-Konflikt mit MCP-Server behoben)
- **mkdocs-macros Plugin:** Konfiguration optimiert (`module_name: macros`)

### Behoben
- **Rekursionsfehler:** Template-Includes und page.meta-Macros entfernt
- **Docker-Befehle Syntax:** `{% raw %}` Wrapper für Code-Beispiele hinzugefügt

---

## [1.2.0] - 2025-11-29

### Hinzugefügt
- **Dashboard Health-Check-System**
  - Live Service-Status-Monitoring
  - Automatische Health-Checks alle 30 Sekunden
  - Farbcodierte Status-Anzeige (grün/gelb/rot)
  - 6 Services überwacht

- **Dashboard Quick Wins - Phase 1**
  - Service-Cards mit direkten Links
  - Icon-Integration (Font Awesome)
  - Responsives Grid-Layout

---

## [1.1.0] - 2025-11-26

### Hinzugefügt
- **Globale Navigations-Integration**
  - Einheitliches Burger-Menü für alle Services
  - Sticky-Navigation
  - Service-spezifische Hervorhebung
  - Dark-Mode-Support

### Behoben
- **MkDocs Navigation 404-Fehler**
  - Problem: Links von `/docs` führten zu 404
  - Lösung: `/docs` → `/docs/index.html` in allen Burger-Menüs

---

## [1.0.0] - 2025-11-23

### Hinzugefügt
- **Initiales Setup**
  - Docker Compose Stack mit 13 Containern
  - Traefik Reverse Proxy mit PathPrefix-Routing
  - Nginx-basierte Service-Proxies für Navigations-Integration

- **Services**
  - Dashboard, MkDocs, Mermaid Live Editor, Excalidraw, PlantUML, Kroki

- **Infrastruktur**
  - Shared Docker Network: `empc4_net`
  - Health-Checks für alle Services
  - Environment-Konfiguration via `.env`
  - Lokale Domain: `arch.local`

---

## Versionierung

Das Projekt folgt [Semantic Versioning](https://semver.org/lang/de/):
- **MAJOR** (1.x.x): Breaking Changes, große Architektur-Änderungen
- **MINOR** (x.1.x): Neue Features, abwärtskompatibel
- **PATCH** (x.x.1): Bug-Fixes, abwärtskompatibel

---

**Projekt:** EMPC4 Architektur-Visualisierungs-Stack  
**Repository:** https://github.com/JoZapf/EMPC4-containerized-visualization-environment  
**Maintainer:** Jo Zapf  
**Lizenz:** MIT
