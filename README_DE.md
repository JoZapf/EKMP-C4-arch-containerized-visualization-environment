# EMPC4 Architektur-Visualisierungs-Stack

**Containerisierte Visualisierungsumgebung für PlantUML, Mermaid, Excalidraw und Kroki**

[![Docker](https://img.shields.io/badge/Docker-20.10%2B-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Docker Compose](https://img.shields.io/badge/Docker%20Compose-2.0%2B-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.5.0-blue.svg)](CHANGELOG.md)
[![PlantUML](https://img.shields.io/badge/PlantUML-Collab-yellowgreen.svg)](https://plantuml.com/)
[![Mermaid](https://img.shields.io/badge/Mermaid-Live-ff3670.svg)](https://mermaid.js.org/)
[![Learning Project](https://img.shields.io/badge/🎓-Lernprojekt-orange.svg)](#über-das-projekt)

> 🇬🇧 [English version](README.md)

<p align="center">
  <img src="docs/EKMP-C4_web.jpg" width="900" alt="EMPC4 Architektur-Visualisierungs-Stack">
</p>

---

## ✨ Neu: Echtzeit-Kollaboration

<table>
<tr>
<td width="50%">

### PlantUML Live-Kollaboration
**Mehrere Benutzer können dasselbe Diagramm gleichzeitig bearbeiten!**

- 🔄 **Echtzeit-Synchronisation** via WebSocket (Socket.IO)
- 👥 **Multi-Gerät-Bearbeitung** – Windows, Linux, Mac
- 🔒 **Self-hosted** – keine Cloud-Abhängigkeit
- ⚡ **Sofortige Updates** – Änderungen live sehen

Umgesetzt mit Flask-SocketIO + eventlet, integriert in den bestehenden PlantUML Monaco Editor.

</td>
<td width="50%">

```
┌─────────────────────────────────────┐
│     Browser A        Browser B      │
│    (Windows)         (Ubuntu)       │
│        │                │           │
│        ▼                ▼           │
│   ┌─────────────────────────┐       │
│   │   plantuml-sync:5001    │       │
│   │   Flask-SocketIO        │       │
│   │   WebSocket Rooms       │       │
│   └─────────────────────────┘       │
│              │                      │
│              ▼                      │
│   ┌─────────────────────────┐       │
│   │  plantuml-backend:8080  │       │
│   │  Jetty + Monaco Editor  │       │
│   └─────────────────────────┘       │
└─────────────────────────────────────┘
```

</td>
</tr>
</table>

📖 **Architektur-Diagramme:** [`docs/architecture/`](repo/docs/architecture/)

---

## 🎯 Überblick

Eine vollständig lokale, containerisierte Lösung für Architektur-Visualisierung und -Dokumentation. Vereint "Architecture as Code"-Tools in einem einfach zu bedienenden Stack mit eigenen Erweiterungen.

| Service | Beschreibung | Eigene Features |
|---------|--------------|-----------------|
| 🏠 **Dashboard** | Zentraler Einstiegspunkt | Health-Monitoring |
| 🎨 **PlantUML** | UML & C4-Diagramme | **Echtzeit-Kollaboration** |
| 🌊 **Mermaid Live** | Interaktive Diagramme | Lokales Speichern/Laden |
| ✏️ **Excalidraw** | Whiteboard-Skizzen | Globale Navigation |
| 🎯 **Kroki** | Multi-Format-API | CI/CD-Integration |
| 📚 **MkDocs** | Dokumentation | Mermaid-Support |
| 🔀 **Traefik** | Reverse Proxy | Auto-Discovery |

---

## 🚀 Schnellstart

```bash
# Klonen
git clone https://github.com/JoZapf/EMPC4-containerized-visualization-environment.git
cd EMPC4-containerized-visualization-environment

# Setup (Linux/macOS)
./setup.sh

# Setup (Windows PowerShell als Admin)
.\setup.ps1

# Browser öffnen
# http://arch.local/
```

**Voraussetzungen:** Docker 20.10+, Docker Compose 2.0+, 4GB RAM (8GB empfohlen)

---

## 📖 Service-URLs

| Service | URL |
|---------|-----|
| Dashboard | http://arch.local/ |
| PlantUML | http://arch.local/uml |
| Mermaid | http://arch.local/mermaid |
| Excalidraw | http://arch.local/whiteboard |
| Kroki | http://arch.local/kroki |
| Dokumentation | http://arch.local/docs/ |
| Traefik | http://localhost:9090 |

---

## 🏗️ Architektur

```
┌──────────────────────────────────────────────────────────┐
│                    Host: arch.local                       │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Traefik Reverse Proxy                 │  │
│  │         PathPrefix-Routing + Health Checks         │  │
│  └─────────────────────┬──────────────────────────────┘  │
│           /uml    /mermaid   /whiteboard   /kroki        │
│             │         │          │           │           │
│  ┌──────────┴─────────┴──────────┴───────────┴────────┐  │
│  │                  Docker-Netzwerk                    │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │  │
│  │  │PlantUML │ │ Mermaid │ │Excalidraw│ │  Kroki  │   │  │
│  │  │ +Sync   │ │  Live   │ │         │ │+Backends│   │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 📦 Projektstruktur

```
.
├── dashboard/          # Zentrales Dashboard mit Health-Checks
├── plantuml-proxy/     # PlantUML nginx-Proxy + Script-Injection
├── plantuml-sync/      # WebSocket-Kollaborations-Server (NEU)
├── mermaid-live/       # Mermaid mit Speichern/Laden-Features
├── excalidraw/         # Whiteboard-Service
├── kroki-frontend/     # Kroki-API-Frontend
├── traefik-proxy/      # Traefik-Dashboard-Proxy
├── repo/
│   ├── docs/           # MkDocs-Dokumentation
│   └── c4/             # C4-PlantUML-Beispiele
├── scripts/            # Hilfs-Skripte
└── docker-compose.yml  # Stack-Definition
```

---

## 🔧 Fehlerbehebung

```bash
# Status prüfen
docker compose ps

# Logs anzeigen
docker compose logs <service-name>

# Port-Konflikte
python scripts/empc4_port_check.py --suggest-fixes

# Service neu bauen
docker compose build --no-cache <service-name>
docker compose up -d <service-name>
```

---

## 📚 Dokumentation

- [Runbook](repo/docs/runbook.md) – Betriebsanleitung
- [Architektur](repo/docs/empc4-vis-arch.md) – Systemübersicht
- [Docker-Befehle](repo/docs/setup/docker-befehle.md) – Referenz
- [Dependencies](repo/docs/setup/dependencies.md) – Software-Stack
- [Mermaid-Features](repo/docs/features/mermaid_save_load_features.md) – Speichern/Laden-Doku

---

## 🔒 Sicherheit

- ✅ Docker-Socket read-only (Traefik)
- ✅ Minimale Volume-Berechtigungen
- ✅ Netzwerk-Isolation via Docker
- ✅ Health-Checks für alle Services
- ✅ Client-seitige Verarbeitung (keine externen API-Aufrufe)

---

## Über das Projekt

**Lernprojekt** – Entstanden während der Umschulung zum Fachinformatiker für Anwendungsentwicklung. Praktische Übungsumgebung für moderne DevOps-Praktiken und Container-Technologien.

**Autor:** [JoZapf](https://github.com/JoZapf)

---

## Lizenz

MIT-Lizenz – siehe [LICENSE](LICENSE)

---

<p align="center">
  <b>Erstellt mit ❤️ für bessere Architektur-Dokumentation</b>
</p>
