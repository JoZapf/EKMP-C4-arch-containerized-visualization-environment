# Projekt Changelog

Das vollständige Changelog findest du im Repository-Root:

**Datei:** [`CHANGELOG.md`](https://github.com/JoZapf/EKMP-C4-arch-containerized-visualization-environment/blob/main/CHANGELOG.md)

---

## Aktuelle Version: 1.4.1 (06.12.2025)

### Highlights

**Gefixt:**
- Traefik Dashboard: Redirect-Problem behoben (Port ging verloren)
- Traefik Dashboard: Burger-Menü Links korrigiert (zeigen jetzt auf arch.local)
- PlantUML: GitHub "Fork me" Banner wieder ausgeblendet (CSS-Injection)

---

## Version 1.4.0 (06.12.2025)

### Highlights

**Neu hinzugefügt:**
- Dashboard Footer mit Tab-System (Info & Links / Kontakt & Profile)
- Mermaid Werbebanner dauerhaft ausgeblendet (`mermaid-ad-hide.css`)

**Geändert:**
- Burger-Menü vereinheitlicht: Überall floating am rechten Bildschirmrand
- Dashboard, Kroki, MkDocs nutzen jetzt identisches Menü-Design
- Menü-Position: Fixed, vertikal zentriert, mit Backdrop-Blur

**Gefixt:**
- Traefik Dashboard Links: 8080 → 9090 (alle Stellen korrigiert)
- Kroki Navigation: nginx.conf für statische Dateien korrigiert

---

## Version 1.3.0 (30.11.2025)

### Highlights

**Neu hinzugefügt:**
- MkDocs Metadata-System mit automatischen Projekt-Variablen
- File-Macros für Referenzen auf andere Dateien
- Umfassende Dokumentation mit Copy-Paste Templates

**Geändert:**
- Traefik Dashboard Port: 8080 → 9090
- Dokumentations-Struktur optimiert
- Veraltete Macro-Demos entfernt

**Gelernt:**
- mkdocs-macros: Rekursionsprobleme bei page.meta-Zugriff
- Template-Includes funktionieren nicht mit mkdocs-macros
- Lösung: Direkte Variablen verwenden

---

## Frühere Versionen

### Version 1.2.0 (29.11.2025)
- Dashboard Health-Check System
- Dashboard Quick Wins Phase 1
- Live Service-Status Monitoring

### Version 1.1.0 (26.11.2025)
- Global Navigation Integration
- MkDocs Navigation 404-Fix
- Einheitliches Burger-Menü

### Version 1.0.0 (23.11.2025)
- Initiales Setup
- 13 Docker-Container
- Traefik Reverse Proxy
- Alle Core-Services

---

## Vollständiges Changelog

Das komplette Changelog mit allen Details, Lessons Learned und technischen Entscheidungen findest du in:

📄 **[CHANGELOG.md](https://github.com/JoZapf/EKMP-C4-arch-containerized-visualization-environment/blob/main/CHANGELOG.md)** im Repository-Root

Oder lokal: `E:\Projects\empc4-vis-arch\CHANGELOG.md`

---

## Versionierungs-Schema

Das Projekt folgt [Semantic Versioning](https://semver.org/lang/de/):
- **MAJOR** (1.x.x): Breaking Changes, große Architektur-Änderungen
- **MINOR** (x.1.x): Neue Features, backwards-compatible
- **PATCH** (x.x.1): Bug-Fixes, backwards-compatible

---

**Projekt:** {{ project.name }}  
**Version:** {{ project.version }}  
**Status:** {{ project.status }}  
**Repository:** [GitHub]({{ project.github_repo }})
