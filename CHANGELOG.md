# Changelog EKMP-C4 ARCHITEKTUR VISUALISIERUNGS STACK

Alle nennenswerten Änderungen am EKMP-C4 Architektur-Visualisierungs Stack werden in dieser Datei dokumentiert.

Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

---

## [Unreleased]

### Geplant
- PlantUML Server-Side Includes (SSI) Analyse
- LaTeX-Integration für wissenschaftliche Dokumentation
- Automatische Architektur-Diagramm Generierung

---

## [1.4.3] - 2025-02-07

### Fixed
- **Dashboard Navigation fehlte**
  - Problem: global-nav.css und global-nav.js waren nicht im dashboard/dist/ Verzeichnis
  - Lösung: Dateien von Root nach dashboard/dist/ kopiert, Pfade in index.html auf relativ geändert
  - Betroffen: Dashboard-Seite konnte nicht laden

### Technical
- **Neue Dateien:**
  - `dashboard/dist/global-nav.css`
  - `dashboard/dist/global-nav.js`

- **Geänderte Dateien:**
  - `dashboard/dist/index.html` - Pfade von absolut (`/global-nav.css`) auf relativ (`global-nav.css`)

- **Erforderliche Aktion:**
  - `docker-compose restart dashboard`

---

## [1.4.2] - 2025-12-06

### Fixed
- **Kroki global-nav.css/js 404-Fehler**
  - Problem: Browser fragte `/global-nav.css` statt `/kroki/global-nav.css`
  - Ursache: Traefik stripped `/kroki` Prefix, aber HTML hatte absolute Pfade ohne Prefix
  - Lösung: Pfade in `kroki-frontend/index.html` auf `/kroki/global-nav.*` geändert

- **Health-Check Traefik Ports falsch**
  - Problem: Health-Check fragte Port 8080 statt 9090
  - Lösung: URLs in `health-check.js` auf Port 9090 aktualisiert

- **Health-Check zeigt "online" bei 404**
  - Problem: `img.onerror` gab `status: 'online'` zurück (Design-Fehler)
  - Lösung: Neuer Status `error` mit gelber `warning`-Anzeige

### Technical
- **Geänderte Dateien:**
  - `kroki-frontend/index.html` - Pfade für global-nav
  - `dashboard/dist/health-check.js` - Ports + Error-Handling
  - `dashboard/dist/index.html` - CSS für `.warning` Status

- **Kein Rebuild erforderlich** - Dateien sind per Volume gemounted

### Documentation
- `docs/20251206_kroki_healthcheck_fixes.md`

---

## [1.4.1] - 2025-12-06

### Fixed
- **Traefik Dashboard Redirect**
  - Problem: `http://localhost:9090/` leitete zu `http://localhost/dashboard/` (Port verloren)
  - Ursache: Traefik interner Redirect ohne Port-Erhaltung
  - Lösung: nginx macht Redirect selbst mit `$http_host` (enthält Port)

- **Traefik Dashboard Burger-Menü Links**
  - Problem: Alle Links zeigten auf `localhost:9090/...` statt `arch.local/...`
  - Ursache: Globale `global-nav.js` mit relativen Pfaden
  - Lösung: Separate `traefik-proxy/global-nav.js` mit absoluten URLs zu `http://arch.local/`

- **PlantUML GitHub Banner wieder sichtbar**
  - Problem: "Fork me on GitHub" Banner wurde nicht mehr ausgeblendet
  - Ursache: `sub_filter` String-Match funktioniert nicht mehr (HTML-Struktur geändert)
  - Lösung: CSS-Injection (`plantuml-hide.css`) - robuster als String-Matching

### Technical
- **Neue Dateien:**
  - `traefik-proxy/global-nav.js` - Absolute URLs für Traefik Dashboard
  - `plantuml-hide.css` - CSS zum Ausblenden von GitHub Banner

- **Geänderte Dateien:**
  - `traefik-proxy/nginx.conf` - Root-Redirect mit Port-Erhaltung
  - `traefik-proxy/Dockerfile` - Lokale global-nav.js verwenden
  - `plantuml-proxy/nginx.conf` - sub_filter entfernt, CSS-Injection
  - `plantuml-proxy/Dockerfile` - plantuml-hide.css hinzugefügt

- **Erforderliche Rebuilds:**
  - `docker-compose build --no-cache traefik-dashboard plantuml`

### Documentation
- `docs/20251206_traefik_plantuml_fixes.md`

---

## [1.4.0] - 2025-12-06

### Added
- **Dashboard Footer mit Tab-System**
  - Tab 1 "Info & Links": Projekt-Info, Repository, Dokumentation, Runbook
  - Tab 2 "Kontakt & Profile": Social Cards (Website, LinkedIn, GitHub)
  - Smooth Tab-Switching Animation
  - Mobile-optimiertes Layout

- **Mermaid Werbebanner Ausblendung**
  - Neue CSS-Datei: `mermaid-ad-hide.css`
  - Blendet "Mermaid Chart" Promotional Banner dauerhaft aus
  - CSS-Selektoren für verschiedene Banner-Varianten

### Changed
- **Burger-Menü Vereinheitlichung**
  - Dashboard: Menü aus Header entfernt, globales floating Menü aktiviert
  - Kroki: nginx.conf korrigiert für statische Dateien
  - MkDocs: CSS/JS auf floating Version aktualisiert
  - Alle Services nutzen jetzt identisches Menü-Design

- **Menü-Position konsistent**
  - Position: Fixed, vertikal zentriert (top: 50%), rechter Rand
  - Backdrop-Filter mit Blur-Effekt
  - Einheitliche Animation und Hover-States

### Fixed
- **Traefik Dashboard Link korrigiert**
  - Problem: Links zeigten auf Port 8080 statt 9090
  - Gefixt in: `dashboard/dist/index.html`, `global-nav.js`
  - Gefixt in: `repo/docs/javascripts/global-nav.js`

- **Kroki Navigation nicht sichtbar**
  - Problem: nginx location `/` fing alle Requests ab
  - Lösung: Explizite `alias` Direktiven für `/global-nav.*`

### Technical
- **Geänderte Dateien:**
  - `dashboard/dist/index.html` - Footer Tabs, globales Menü
  - `global-nav.js` - Port Fix
  - `mermaid-ad-hide.css` - NEU
  - `mermaid-live/Dockerfile` - CSS injection
  - `kroki-frontend/nginx.conf` - Statische Dateien Routing
  - `repo/docs/stylesheets/global-nav.css` - Floating Update
  - `repo/docs/javascripts/global-nav.js` - Floating + Port Fix

- **Erforderliche Rebuilds:**
  - `docker-compose restart kroki`
  - `docker-compose build --no-cache mermaid-live`
  - `docker-compose build --no-cache docs`

### Documentation
- Neue Dokumentation: `docs/20251206_ui_consistency_todos.md`

---

## [1.3.0] - 2025-11-30

### Added
- **MkDocs Metadata-System**
  - Automatische Projekt-Variablen aus `mkdocs.yml`
  - YAML Front Matter für dokumenten-spezifische Metadaten
  - File-Macros: `file_modified_date()` und `file_size()`
  - Dokumentation: `setup/metadata-final.md` mit Copy-Paste Templates

### Changed
- **Traefik Dashboard Port:** 8080 → 9090 (Port-Konflikt mit MCP-Server behoben)
- **mkdocs-macros Plugin:** Konfiguration optimiert (`module_name: macros`)
- **Dokumentation bereinigt:** Veraltete Macro-Demos entfernt

### Fixed
- **Rekursionsfehler:** Template-Includes und page.meta-Macros entfernt
- **Docker-Befehle Syntax:** `{% raw %}` Wrapper hinzugefügt für Code-Beispiele

### Learned
- mkdocs-macros: Zugriff auf `page.meta` in Macros verursacht Rekursion
- Template-Includes (`{% include %}`) funktionieren nicht mit mkdocs-macros
- Lösung: Direkte Variablen verwenden (`{{ project.name }}`, `{{ page.meta.feature }}`)
- Git-Plugin funktioniert nicht im Docker ohne `.git` Verzeichnis

---

## [1.2.0] - 2025-11-29

### Added
- **Dashboard Health-Check System**
  - Live Service-Status Monitoring
  - Automatische Health-Checks alle 30 Sekunden
  - Farbcodierte Status-Anzeige (Grün/Gelb/Rot)
  - 6 Services überwacht: Dashboard, Docs, Mermaid, Excalidraw, PlantUML, Kroki
  - Dokumentation: `setup/dashboard-health-check.md`

- **Dashboard Quick Wins - Phase 1**
  - Service-Cards mit direkten Links
  - Icon-Integration (Font Awesome)
  - Responsive Grid-Layout (Desktop 3 Spalten, Tablet 2, Mobile 1)
  - Beschreibungstexte für jeden Service
  - Dokumentation: `setup/dashboard-quick-wins-phase1.md`

### Changed
- **Dashboard Layout:** Von Liste zu Card-Grid umgestaltet
- **Dokumentations-Struktur:** Features in eigenem Verzeichnis

---

## [1.1.0] - 2025-11-26

### Added
- **Global Navigation Integration**
  - Einheitliches Burger-Menü für alle Services
  - Sticky Navigation (bleibt beim Scrollen sichtbar)
  - Service-spezifische Hervorhebung
  - Dark Mode Support
  - Dokumentation: `setup/navigation.md`

### Fixed
- **MkDocs Navigation 404-Fehler**
  - Problem: Links von `/docs` führten zu 404
  - Root Cause: Browser URL-Resolution mit relativen Pfaden
  - Lösung: `/docs` → `/docs/index.html` in allen Burger-Menüs
  - Betroffene Container: docs, dashboard, kroki
  - Dokumentation: `setup/mkdocs-navigation-fix.md`

### Learned
- Browser URL-Resolution: `/docs` (Base=/), `/docs/index.html` (Base=/docs/)
- HTML `<base>` Tag mit absoluten Pfaden ist fehleranfällig
- Einfache Lösungen > Elegante aber komplexe Lösungen

---

## [1.0.0] - 2025-11-23

### Added
- **Initiales Setup**
  - Docker Compose Stack mit 13 Containern
  - Traefik Reverse Proxy mit PathPrefix-Routing
  - Nginx-basierte Service-Proxies für Navigation-Integration

- **Services**
  - **Dashboard:** Zentrale Übersichtsseite (Nginx)
  - **MkDocs:** Dokumentations-System (Material Theme)
  - **Mermaid Live Editor:** Custom Build mit Save/Load Features
  - **Excalidraw:** Whiteboard-Tool
  - **PlantUML:** UML-Diagramm Server + Nginx Proxy
  - **Kroki:** Multi-Format Diagramm-Service (+ 4 Companions)

- **Infrastruktur**
  - Shared Docker Network: `empc4_net`
  - Health-Checks für alle Services
  - Environment-Konfiguration via `.env`
  - Local Domain: `arch.local` (via hosts-Datei)

- **Dokumentation**
  - Docker-Befehle Referenz
  - Dependencies Übersicht
  - MkDocs Anleitung
  - Service-spezifische Dokumentationen

---

## [0.1.0] - 2025-11-XX

### Initial Development
- Projekt-Konzeption
- Technology Stack Evaluation
- Docker-Container Prototyping
- Repository-Struktur aufgebaut

---

## Kategorien

### Added
Neue Features, die hinzugefügt wurden.

### Changed
Änderungen an bestehenden Features.

### Deprecated
Features die bald entfernt werden.

### Removed
Entfernte Features.

### Fixed
Bug-Fixes.

### Security
Sicherheits-relevante Änderungen.

### Learned
Erkenntnisse und Lessons Learned während der Entwicklung.

---

## Versionierung

Das Projekt folgt [Semantic Versioning](https://semver.org/lang/de/):
- **MAJOR** (1.x.x): Breaking Changes, große Architektur-Änderungen
- **MINOR** (x.1.x): Neue Features, backwards-compatible
- **PATCH** (x.x.1): Bug-Fixes, backwards-compatible

---

**Projekt:** EKMP-C4 Architektur-Visualisierungs Stack  
**Repository:** https://github.com/JoZapf/EKMP-C4-arch-containerized-visualization-environment  
**Maintainer:** Jo Zapf  
**Lizenz:** MIT
