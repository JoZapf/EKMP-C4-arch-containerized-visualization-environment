# Architektur-Übersicht

## High-Level-Architektur

```mermaid
graph TB
    User[Benutzer] --> ReverseProxy[Traefik<br/>Reverse Proxy]

    ReverseProxy --> Dashboard[Dashboard<br/>nginx]
    ReverseProxy --> PlantUMLProxy[PlantUML Proxy<br/>nginx]
    ReverseProxy --> Kroki[Kroki Frontend<br/>nginx]
    ReverseProxy --> Mermaid[Mermaid Live Editor<br/>nginx]
    ReverseProxy --> Docs[MkDocs Material<br/>Dokumentation]
    ReverseProxy --> Excalidraw[Excalidraw<br/>Whiteboard]
    ReverseProxy --> TraefikDash[Traefik Dashboard<br/>nginx]

    PlantUMLProxy --> PlantUML[PlantUML Backend<br/>Jetty]
    Kroki --> KrokiBackend[Kroki Backend]
    KrokiBackend --> KrokiBlockDiag[BlockDiag]
    KrokiBackend --> KrokiMermaidComp[Mermaid Companion]
    KrokiBackend --> KrokiBPMN[BPMN]

    PlantUML --> Repo[(Git Repository<br/>docs, c4, assets)]
    Docs --> Repo

    style ReverseProxy fill:#1e3a5f,stroke:#4a9eff,stroke-width:3px,color:#fff
    style Repo fill:#2d4a6b,stroke:#4a9eff,stroke-width:2px,color:#fff
    style KrokiBackend fill:#1e3a5f,stroke:#4a9eff,stroke-width:2px,color:#fff
```

## Komponenten

### 1. Reverse Proxy (Traefik)

**Image**: `traefik:v2.11`

**Aufgaben**:
- Routing aller eingehenden Requests
- Service Discovery über Docker Labels
- Optional: TLS-Termination (HTTPS)
- Dashboard für Monitoring

**Ports**:
- `80`: HTTP-Eingang
- `8080`: Traefik Dashboard

### 2. Dashboard (nginx)

**Image**: `nginx:stable-alpine`

**Aufgaben**:
- Zentrale Einstiegsseite
- Übersicht aller verfügbaren Tools
- Statusanzeige
- Links zu allen Services

**Routing**: `/` (Root-Pfad)

### 3. PlantUML Server

**Image**: `plantuml/plantuml-server:jetty`

**Aufgaben**:
- Rendering von PlantUML-Diagrammen
- Unterstützung für C4-PlantUML
- API für IDE-Plugins
- Export als PNG/SVG

**Routing**: `/plantuml`

**Features**:
- Live-Preview für IDEs
- Batch-Verarbeitung für CI/CD
- Unterstützung für große Diagramme (8192px)

### 4. Dokumentations-Server (MkDocs)

**Image**: `squidfunk/mkdocs-material:latest`

**Aufgaben**:
- Statische Dokumentation aus Markdown
- Mermaid-Diagramm-Rendering
- Suchfunktion
- Responsive Design

**Routing**: `/docs`

**Plugins**:
- Material Theme
- Mermaid2 Plugin
- Search Plugin

### 5. Excalidraw (Whiteboard)

**Image**: `kiliandangendorf/excalidraw:latest`

**Aufgaben**:
- Interaktives Whiteboard
- Architektur-Skizzen
- Workshop-Tool
- Export als PNG/SVG

**Routing**: `/whiteboard`

## Netzwerk-Architektur

Alle Services befinden sich im gemeinsamen Docker-Netzwerk `empc4_net`:

```mermaid
graph LR
    Internet[Internet] --> Traefik[Traefik :80]

    subgraph Docker Network empc4_net
        Traefik
        Dashboard[Dashboard]
        TraefikDash[Traefik Dashboard :8080]
        PlantUMLProxy[PlantUML Proxy]
        PlantUML[PlantUML Backend :8080]
        KrokiFE[Kroki Frontend]
        KrokiBE[Kroki Backend :8000]
        KrokiBlock[BlockDiag :8001]
        KrokiMerm[Mermaid :8002]
        KrokiBPMN[BPMN :8003]
        MermaidLive[Mermaid Live Editor]
        Docs[Docs]
        Excalidraw[Excalidraw]
    end

    Traefik --> Dashboard
    Traefik --> TraefikDash
    Traefik --> PlantUMLProxy
    Traefik --> KrokiFE
    Traefik --> MermaidLive
    Traefik --> Docs
    Traefik --> Excalidraw
    
    PlantUMLProxy --> PlantUML
    KrokiFE --> KrokiBE
    KrokiBE --> KrokiBlock
    KrokiBE --> KrokiMerm
    KrokiBE --> KrokiBPMN

    style Traefik fill:#1e3a5f,stroke:#4a9eff,stroke-width:2px,color:#fff
    style KrokiBE fill:#1e3a5f,stroke:#4a9eff,stroke-width:2px,color:#fff
```

## Daten-Persistenz

### Git Repository

Alle Architekturinhalte werden im Git-Repository gespeichert:

```
repo/
├── docs/           # Markdown-Dokumentation
├── c4/             # PlantUML C4-Diagramme
└── assets/         # Bilder, Excalidraw-Exports
    └── excalidraw/
```

### Volume-Mounts

- **PlantUML**: `./repo` → `/repo` (read-only)
- **Docs**: `./repo` → `/docs` (read/write für Build)
- **Dashboard**: `./dashboard/dist` → `/usr/share/nginx/html` (read-only)

## Healthchecks

Alle Services haben konfigurierte Healthchecks:

| Service | Check-Interval | Timeout | Start Period |
|---------|---------------|---------|--------------|
| Dashboard | 30s | 10s | 10s |
| PlantUML Backend | 30s | 10s | 20s |
| PlantUML Proxy | 30s | 10s | 10s |
| Traefik Reverse Proxy | 30s | 10s | 5s |
| Traefik Dashboard Proxy | 30s | 10s | 10s |
| Kroki Frontend | 30s | 10s | 10s |
| Kroki Backend | 30s | 10s | 15s |
| Kroki BlockDiag | 30s | 10s | 15s |
| Kroki Mermaid | 30s | 10s | 15s |
| Kroki BPMN | 30s | 10s | 15s |
| Mermaid Live Editor | 30s | 10s | 15s |
| MkDocs Dokumentation | 30s | 10s | 40s |
| Excalidraw | 30s | 10s | 15s |

## Service-Abhängigkeiten

```mermaid
graph TD
    RP[Reverse Proxy<br/>Traefik] --> |benötigt| Docker[Docker Socket]
    
    Dashboard[Dashboard] --> |verlinkt zu| PlantUMLProxy
    Dashboard --> |verlinkt zu| Kroki
    Dashboard --> |verlinkt zu| Mermaid
    Dashboard --> |verlinkt zu| Docs
    Dashboard --> |verlinkt zu| Excalidraw
    Dashboard --> |verlinkt zu| TraefikDash
    
    PlantUMLProxy[PlantUML Proxy] --> |proxy zu| PlantUML[PlantUML Backend]
    
    KrokiFE[Kroki Frontend] --> |proxy zu| KrokiBE[Kroki Backend]
    KrokiBE --> |nutzt| KrokiBlock[BlockDiag]
    KrokiBE --> |nutzt| KrokiMerm[Mermaid Companion]
    KrokiBE --> |nutzt| KrokiBPMN[BPMN]
    
    PlantUML --> |liest| Repo[Git Repository]
    Docs[MkDocs] --> |liest| Repo
    
    TraefikDash[Traefik Dashboard Proxy] --> |proxy zu| RP

    style RP fill:#1e3a5f,stroke:#4a9eff,stroke-width:3px,color:#fff
    style Repo fill:#2d4a6b,stroke:#4a9eff,stroke-width:2px,color:#fff
    style KrokiBE fill:#1e3a5f,stroke:#4a9eff,stroke-width:2px,color:#fff
```

## Sicherheitsaspekte

### Aktuelle Konfiguration

- HTTP-only (Port 80)
- Keine Authentifizierung
- Docker Socket read-only für Traefik
- Repository read-only für PlantUML

### Geplante Erweiterungen

- HTTPS/TLS mit Let's Encrypt
- Basic Auth für Admin-Bereiche
- OAuth2-Proxy für SSO
- Rate Limiting

## Performance-Überlegungen

- **PlantUML**: Limit Size auf 8192px für große Diagramme
- **MkDocs**: Plugin-Installation beim Start (ca. 30-40s)
- **Traefik**: Docker Provider mit automatischer Service-Discovery
- **Healthchecks**: Start Period berücksichtigt Initialisierungszeit
