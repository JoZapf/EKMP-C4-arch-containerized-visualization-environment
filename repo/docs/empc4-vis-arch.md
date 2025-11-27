# EMPC4 Visualisation Architecture (`empc4-vis-arch.md`)

## 1. Ziel & Kontext

Dieses Dokument beschreibt eine **containerisierte Visualisierungsumgebung** („EMPC4 VIS Stack“), die folgende Tools als **eigenständige, aber sich ergänzende Services** bündelt:

- **PlantUML** (inkl. C4-PlantUML) → „Architecture as Code“ & UML/C4-Diagramme
- **Mermaid** → Diagramme direkt in Markdown / Doku
- **Excalidraw** → Whiteboard & architektonische Skizzen
- Optional: **C4 Builder** → Generierung einer strukturierten Architektur-Dokumentation (Website/PDF) aus Markdown + PlantUML

Zentrales Element ist ein **Dashboard im Kacheldesign**, das als Startpunkt dient, um

- schnell auf die einzelnen Tools zuzugreifen und
- Basis-Konfigurationen der Services zentral zu erreichen (URLs, Repos, Themes, Security).


## 2. High-Level-Architektur

### 2.1 Komponentenübersicht

1. **Reverse Proxy / Ingress**
   - Typisch: Traefik oder nginx
   - Aufgaben:
     - TLS-Termination (HTTPS)
     - Routing der Subdomains / Pfade
     - Optional: Auth (z. B. Basic Auth, OAuth2, SSO)

2. **Dashboard-Service**
   - Leichte Web-App (statische HTML/JS oder kleines React-Frontend)
   - Einstiegspunkt für Nutzer*innen:
     - Übersichtliche Kacheln zu den Tools
     - Statusinfos (z. B. „Letzter Docs-Build“, Git-Branch, Health Checks)
     - Zugriff auf zentrale Einstellungen (nur für Admin-Users)

3. **PlantUML-Service (mit C4-PlantUML)**  
   - Containerisierter PlantUML-Server
   - Eingebundene C4-PlantUML-Library via `!include`
   - Dient als:
     - Render-Endpunkt für IDE-Plugins (VS Code, IntelliJ)
     - Render-Backend für CI/CD-Pipelines
     - Bildquelle für die Doku (PNG/SVG für Markdown und Dashboard)

4. **Docs-/Mermaid-Service**
   - Static-Site-Generator (z. B. MkDocs, Docusaurus o. Ä.) mit Mermaid-Unterstützung
   - Liefert eine zentrale **Architektur-Dokumentationsseite** mit:
     - Markdown-Inhalten (Architekturtexte)
     - Mermaid-Diagrammen (Flows, Sequenzen, kleinere Strukturen)
     - Eingebetteten PlantUML-Exports (C4-Diagramme, UML, Sequenzen)
   - Optional: Ergebnis eines C4-Builder-Laufs (z. B. generierte Seiten/Navigation)

5. **Excalidraw-Service**
   - Self-hosted Excalidraw-Instanz
   - Nutzung als „digitales Whiteboard“:
     - Architektur-Workshops
     - schnelle Skizzen & Varianten
   - Exporte (PNG/SVG) können im Doku-Repository abgelegt und im Docs-Service eingebunden werden.

6. **C4 Builder (optional, CLI/Helper-Service)**
   - Wird typischerweise nicht dauerhaft als laufender Service benutzt, sondern:
     - On-demand via `docker run` oder CI-Job
   - Liest:
     - Markdown (`.md`)
     - PlantUML-Dateien (insbesondere C4-PlantUML)
   - Erzeugt:
     - Navigierbare HTML-Dokumentation
     - optional PDF
   - Output wird in das Volume des Docs-/Mermaid-Services geschrieben.

7. **Persistente Volumes / Git-Integration**
   - Architektur-Repo (Git) wird als Volume eingehängt (read-only oder read/write)
   - Persistenz für:
     - Doku-Quellen (`/repo/docs`, `/repo/c4`, …)
     - Excalidraw-Exports (z. B. `/repo/assets/excalidraw`)
     - evtl. Cache/Build-Artefakte


### 2.2 Netz- & Pfadstruktur (Beispiel)

- `https://arch.local/` → Dashboard
- `https://arch.local/plantuml/` → PlantUML-Server
- `https://arch.local/docs/` → Doku-Site (Mermaid + C4 Builder Output)
- `https://arch.local/whiteboard/` → Excalidraw

Alle Services liegen in einem gemeinsamen Docker-Netzwerk, werden aber nur über den Reverse Proxy nach außen freigegeben.


## 3. Integration der Tools (PlantUML, Mermaid, Excalidraw, C4 Builder)

### 3.1 PlantUML + C4-PlantUML

- Rolle:
  - Hauptwerkzeug für **C4-Diagramme** (Context, Container, Component, Code)
  - Zusätzlich: UML-Diagramme (Klassendiagramme, Sequenzdiagramme, Aktivitäten etc.)
- Nutzungsszenarien:
  - Entwickler*innen definieren C4- und UML-Diagramme als Text in `.puml`-Files.
  - IDE-Plugins sprechen den PlantUML-Server direkt an (Live-Preview).
  - CI/CD generiert statische Bilder (PNG/SVG) als Artefakte für Doku und Dashboard.

### 3.2 Mermaid

- Rolle:
  - Ergänzung für Diagramme, die in Markdown selbst eingebettet werden sollen (u. a.:
    - Sequenzdiagramme
    - Flussdiagramme
    - Gantt
    - einfache Architekturskizzen)
- Nutzungsszenarien:
  - Direkt in `.md`-Dokumente eingebettet.
  - Wird vom Docs-Service beim Build/Render verarbeitet.
  - Kombiniert mit PlantUML-Bildern in derselben Seite.

### 3.3 Excalidraw

- Rolle:
  - Freies Zeichnen, Skizzieren, Brainstorming für Architektur & Domänenmodelle.
- Nutzungsszenarien:
  - Workshops und spontane Sessions
  - Ergebnis:
    - Exporte als PNG/SVG,
    - Ablage im Git-Repo,
    - Einbindung in Markdown/Docs/Präsentationen.

### 3.4 C4 Builder (optional, aber empfohlen)

- Rolle:
  - „Architektur-Doku-Baukasten“, der aus Markdown + PlantUML ein konsistentes Dokumentationspaket baut.
- Nutzungsszenarien:
  - Zentrale Architekturseiten (z. B. `index.md` + Unterkapitel) werden mit C4-PlantUML verknüpft.
  - C4 Builder generiert eine verlinkte Site mit Navigation, Inhaltsverzeichnis, Diagrammeinbettung.
  - CI/CD-Pipeline kann bei jedem Merge in `main/master` automatisch neue Dokumentation generieren.


## 4. Dashboard-Konzept (Kacheldesign)

### 4.1 Ziele des Dashboards

- **Schneller Zugang** zu allen Werkzeugen:
  - Ohne URLs merken zu müssen
  - Übersicht für neue Teammitglieder
- **Transparenz**:
  - Sichtbare Informationen zu Versionen, Status, letzte Builds
- **Konfiguration**:
  - Zentraler Einstieg für grundlegende Einstellungen (je nach Rolle/Rechten)

### 4.2 Layout-Idee (Startseite)

**Bereich 1: Kopfzeile / Header**

- Projektname (z. B. *„EMPC4 VIS Stack“*)
- ggf. Logo / Icon
- Rechts: Benutzer-Login / Profil (für spätere Role-Based Access Control)

**Bereich 2: Hauptkacheln (Quick Access)**

Mindestens folgende Kacheln:

1. **Kachel „Architektur-Dokumentation“**
   - Link: `https://arch.local/docs/`
   - Teaser-Text: „Durchstöbere die aktuelle Architektur-Dokumentation (C4 + Mermaid).“
   - Statusinfos (klein):
     - Letzter Build: Datum/Uhrzeit
     - Git-Branch / Commit-ID

2. **Kachel „PlantUML / C4-PlantUML“**
   - Link: `https://arch.local/plantuml/`
   - Teaser-Text: „Render-Endpunkt für UML und C4-Diagramme (für IDE & CI).“
   - Optional: Hinweis auf Konfiguration (Server-URL für IDEs, Beispiele)

3. **Kachel „Whiteboard (Excalidraw)“**
   - Link: `https://arch.local/whiteboard/`
   - Teaser-Text: „Interaktives Whiteboard für Architektur-Sessions & Skizzen.“
   - Optional: Hinweis auf Ablageort der Exporte

4. **Kachel „Repos & Quellen“**
   - Links zu:
     - Git-Repository der Architektur (`/docs`, `/c4`, `/assets`)
     - ggf. README/Contribution Guide

**Optional zusätzliche Kacheln**

- **„Admin & Konfiguration“** (nur für Admin-Rollen sichtbar)
- **„Build-Status / CI-Jobs“** (Verlinkung zu z. B. GitLab CI, GitHub Actions)
- **„Guidelines / C4-Styleguide“** (Verlinkung zur internen Modellierungsrichtlinie)


### 4.3 Einstellungen & Konfiguration über das Dashboard

Das Dashboard selbst kann eine einfache **Config-Ansicht** bereitstellen (mit Auth / Admin-Role):

- **Allgemeine Einstellungen**
  - Basis-URLs der Services (PlantUML, Docs, Excalidraw)
  - Standard-Git-Branch für Doku (z. B. `main`)
  - ggf. Theme (Dark/Light Mode)

- **PlantUML-spezifisch**
  - Anzeige der aktuellen Server-URL
  - Beispielsnippets für IDE-Konfiguration
  - Link zur C4-PlantUML-Dokumentation

- **Docs-/Mermaid-spezifisch**
  - Build-Parameter (z. B. zusätzlicher Include-Pfad)
  - Link zum CI-Job, der den Build ausführt

- **Excalidraw-spezifisch**
  - Konfiguration des Speicherorts von Exports
  - ggf. Raum-/Session-Management (sofern vorhanden)

Diese Konfiguration kann zunächst rein informativ sein (read-only Anzeige der in `docker-compose.yml` oder `.env` gesetzten Parameter) und später durch eine echte Konfigurations-API erweitert werden.


## 5. Betriebsaspekte (Kurzüberblick)

- **Netzwerk & Security**
  - Alle Services in einem internen Docker-Netzwerk
  - Extern nur Reverse Proxy mit TLS & ggf. Auth
- **Backup & Versionierung**
  - Doku- und Architekturquellen liegen im Git-Repository (Backups über Git)
  - Optional: zusätzliche Backups für Excalidraw-Exports
- **Monitoring / Healthchecks**
  - HTTP-Healthchecks für PlantUML, Docs, Excalidraw
  - Anzeige im Dashboard (z. B. „Service OK / WARN / DOWN“)
- **CI/CD-Integration**
  - Automatisierter Build der Doku (inkl. C4 Builder)
  - Optional: automatisiertes Re-Deployen des Docs-Containers bei neuen Builds

---

Dieses Dokument dient als **grober Architekturrahmen** für den EMPC4 VIS Stack. Die technische Ausgestaltung (konkrete Images, Pfade, Auth-Mechanismen) wird in der ergänzenden Datei `empc4-vis-arch_compose.md` und der tatsächlichen `docker-compose.yml` detailliert. 
