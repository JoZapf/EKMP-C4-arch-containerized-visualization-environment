# Changelog EKMP-C4 Architecture Visualization Stack

All notable changes to the EMPC4 Architecture Visualization Stack are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Planned
- PlantUML Server-Side Includes (SSI) Analysis
- LaTeX integration for scientific documentation
- Automatic architecture diagram generation

---

## [1.5.0] - 2025-02-25

### Added
- **PlantUML Real-Time Collaboration**
  - WebSocket-based live sync between multiple clients
  - Flask-SocketIO server with eventlet async mode
  - Room-based synchronization (same URL = same room)
  - Cursor position sharing between users
  - Automatic reconnection handling

### Technical
- **New Container:** `plantuml-sync` (Flask-SocketIO + eventlet)
  - Namespace `/plantuml-sync` for Socket.IO events
  - Events: `join`, `diagram_update`, `cursor_update`, `disconnect`
  - In-memory room management via `rooms_data` dict

- **Modified Container:** `plantuml-proxy`
  - Socket.IO client injection via IIFE wrapper (AMD compatibility fix)
  - Script injection: `socket.io.min.js`, `collab-client.js`

- **Host nginx Routes:**
  - `/socket.io/` → Traefik → plantuml-sync:5001
  - `/plantuml-sync/` → Traefik → plantuml-sync:5001

- **Traefik Labels:**
  - `plantuml-sync` router for `/plantuml-sync` path
  - `plantuml-sync-socketio` router for `/socket.io` path

- **Critical Implementation Details:**
  - `eventlet.monkey_patch()` must be FIRST import in app.py
  - Socket.IO Namespace ≠ URL Path (namespace is logical, path is `/socket.io/`)
  - IIFE wrapper required to prevent AMD loader conflict with Monaco Editor

### Documentation
- Architecture diagrams: `plantuml-collab-architecture.puml`
- Sequence diagram: `plantuml-collab-sequence.puml`
- Deployment diagram: `plantuml-collab-deployment.puml`
- Fixes summary: `plantuml-collab-fixes-summary.puml`

---

## [1.4.4] - 2025-02-07

### Fixed
- **Dashboard Health-Check shows services as orange (checking)**
  - Problem: Image-trick with favicon.ico doesn't work for services without favicon
  - Solution: Same-Origin services now use fetch() HEAD-request, Cross-Origin still uses image-trick
  - Affected: Dashboard, Docs, PlantUML, Kroki, Mermaid, Excalidraw showed orange instead of green

### Technical
- **Changed files:**
  - `dashboard/dist/health-check.js` - checkViaImage() rewritten for Same-Origin fetch()

- **Required action:**
  - `docker-compose restart dashboard`

---

## [1.4.3] - 2025-02-07

### Fixed
- **Dashboard navigation missing**
  - Problem: global-nav.css and global-nav.js were not in dashboard/dist/ directory
  - Solution: Files copied from root to dashboard/dist/, paths in index.html changed to relative
  - Affected: Dashboard page could not load

### Technical
- **New files:**
  - `dashboard/dist/global-nav.css`
  - `dashboard/dist/global-nav.js`

- **Changed files:**
  - `dashboard/dist/index.html` - paths from absolute (`/global-nav.css`) to relative (`global-nav.css`)

- **Required action:**
  - `docker-compose restart dashboard`

---

## [1.4.2] - 2025-12-06

### Fixed
- **Kroki global-nav.css/js 404 errors**
  - Problem: Browser requested `/global-nav.css` instead of `/kroki/global-nav.css`
  - Cause: Traefik strips `/kroki` prefix, but HTML had absolute paths without prefix
  - Solution: Paths in `kroki-frontend/index.html` changed to `/kroki/global-nav.*`

- **Health-Check Traefik ports wrong**
  - Problem: Health-Check queried port 8080 instead of 9090
  - Solution: URLs in `health-check.js` updated to port 9090

- **Health-Check shows "online" for 404**
  - Problem: `img.onerror` returned `status: 'online'` (design flaw)
  - Solution: New status `error` with yellow `warning` display

### Technical
- **Changed files:**
  - `kroki-frontend/index.html` - paths for global-nav
  - `dashboard/dist/health-check.js` - ports + error handling
  - `dashboard/dist/index.html` - CSS for `.warning` status

- **No rebuild required** - files are volume mounted

---

## [1.4.1] - 2025-12-06

### Fixed
- **Traefik Dashboard Redirect**
  - Problem: `http://localhost:9090/` redirected to `http://localhost/dashboard/` (port lost)
  - Cause: Traefik internal redirect without port preservation
  - Solution: nginx handles redirect with `$http_host` (includes port)

- **Traefik Dashboard burger menu links**
  - Problem: All links pointed to `localhost:9090/...` instead of `arch.local/...`
  - Cause: Global `global-nav.js` with relative paths
  - Solution: Separate `traefik-proxy/global-nav.js` with absolute URLs to `http://arch.local/`

- **PlantUML GitHub banner visible again**
  - Problem: "Fork me on GitHub" banner was not hidden anymore
  - Cause: `sub_filter` string match no longer works (HTML structure changed)
  - Solution: CSS injection (`plantuml-hide.css`) - more robust than string matching

### Technical
- **New files:**
  - `traefik-proxy/global-nav.js` - absolute URLs for Traefik Dashboard
  - `plantuml-hide.css` - CSS to hide GitHub banner

- **Changed files:**
  - `traefik-proxy/nginx.conf` - root redirect with port preservation
  - `traefik-proxy/Dockerfile` - use local global-nav.js
  - `plantuml-proxy/nginx.conf` - sub_filter removed, CSS injection
  - `plantuml-proxy/Dockerfile` - plantuml-hide.css added

- **Required rebuilds:**
  - `docker-compose build --no-cache traefik-dashboard plantuml`

---

## [1.4.0] - 2025-12-06

### Added
- **Dashboard Footer with Tab System**
  - Tab 1 "Info & Links": Project info, repository, documentation, runbook
  - Tab 2 "Contact & Profiles": Social cards (website, LinkedIn, GitHub)
  - Smooth tab-switching animation
  - Mobile-optimized layout

- **Mermaid ad banner hiding**
  - New CSS file: `mermaid-ad-hide.css`
  - Permanently hides "Mermaid Chart" promotional banner
  - CSS selectors for various banner variants

### Changed
- **Burger menu unification**
  - Dashboard: Menu removed from header, global floating menu activated
  - Kroki: nginx.conf corrected for static files
  - MkDocs: CSS/JS updated to floating version
  - All services now use identical menu design

### Fixed
- **Traefik Dashboard link corrected**
  - Problem: Links pointed to port 8080 instead of 9090
  - Fixed in: `dashboard/dist/index.html`, `global-nav.js`

- **Kroki navigation not visible**
  - Problem: nginx location `/` caught all requests
  - Solution: Explicit `alias` directives for `/global-nav.*`

---

## [1.3.0] - 2025-11-30

### Added
- **MkDocs Metadata System**
  - Automatic project variables from `mkdocs.yml`
  - YAML front matter for document-specific metadata
  - File macros: `file_modified_date()` and `file_size()`

### Changed
- **Traefik Dashboard Port:** 8080 → 9090 (port conflict with MCP server resolved)
- **mkdocs-macros Plugin:** Configuration optimized (`module_name: macros`)

### Fixed
- **Recursion error:** Template includes and page.meta macros removed
- **Docker commands syntax:** `{% raw %}` wrapper added for code examples

---

## [1.2.0] - 2025-11-29

### Added
- **Dashboard Health-Check System**
  - Live service status monitoring
  - Automatic health checks every 30 seconds
  - Color-coded status display (green/yellow/red)
  - 6 services monitored

- **Dashboard Quick Wins - Phase 1**
  - Service cards with direct links
  - Icon integration (Font Awesome)
  - Responsive grid layout

---

## [1.1.0] - 2025-11-26

### Added
- **Global Navigation Integration**
  - Unified burger menu for all services
  - Sticky navigation
  - Service-specific highlighting
  - Dark mode support

### Fixed
- **MkDocs Navigation 404 errors**
  - Problem: Links from `/docs` led to 404
  - Solution: `/docs` → `/docs/index.html` in all burger menus

---

## [1.0.0] - 2025-11-23

### Added
- **Initial Setup**
  - Docker Compose stack with 13 containers
  - Traefik reverse proxy with PathPrefix routing
  - Nginx-based service proxies for navigation integration

- **Services**
  - Dashboard, MkDocs, Mermaid Live Editor, Excalidraw, PlantUML, Kroki

- **Infrastructure**
  - Shared Docker network: `empc4_net`
  - Health checks for all services
  - Environment configuration via `.env`
  - Local domain: `arch.local`

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.x.x): Breaking changes, major architecture changes
- **MINOR** (x.1.x): New features, backwards-compatible
- **PATCH** (x.x.1): Bug fixes, backwards-compatible

---

**Project:** EMPC4 Architecture Visualization Stack  
**Repository:** https://github.com/JoZapf/EMPC4-containerized-visualization-environment  
**Maintainer:** Jo Zapf  
**License:** MIT
