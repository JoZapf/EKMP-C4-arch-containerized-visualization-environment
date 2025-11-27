# PlantUML-Beispiele

PlantUML ist ein mächtiges Tool für "Diagram as Code". Hier sind praktische Beispiele.

## Basis-Nutzung

### Im Browser

1. Öffne [http://arch.local/plantuml](http://arch.local/plantuml)
2. Füge deinen PlantUML-Code ein
3. Klicke auf "Submit" zum Rendern

### API-Nutzung

PlantUML bietet verschiedene Endpunkte:

```bash
# PNG-Export
curl http://arch.local/plantuml/png/[encoded] > diagram.png

# SVG-Export
curl http://arch.local/plantuml/svg/[encoded] > diagram.svg

# Text-basiert
curl http://arch.local/plantuml/txt/[encoded]
```

## Sequenzdiagramme

```plantuml
@startuml
actor User
participant "Web Browser" as Browser
participant "Traefik" as Proxy
participant "PlantUML\nServer" as PlantUML

User -> Browser: Opens diagram
Browser -> Proxy: HTTP Request
Proxy -> PlantUML: Forward (with StripPrefix)
PlantUML -> PlantUML: Render diagram
PlantUML --> Proxy: PNG image
Proxy --> Browser: PNG image
Browser --> User: Display diagram
@enduml
```

## Aktivitätsdiagramme

```plantuml
@startuml
start
:User startet docker-compose;
:Traefik initialisiert;
if (Services verfügbar?) then (ja)
  :Registriere Services;
  :Start Routing;
  :Dashboard verfügbar;
  stop
else (nein)
  :Warte auf Services;
  :Health Checks;
  if (Alle healthy?) then (ja)
    :Registriere Services;
    stop
  else (nein)
    :Logge Fehler;
    :Stoppe Container;
    stop
  endif
endif
@enduml
```

## Komponentendiagramme

```plantuml
@startuml
package "EMPC4 VIS Stack" {
  [Reverse Proxy\nTraefik] as Traefik
  [Dashboard\nnginx] as Dashboard
  [PlantUML Server\nJetty] as PlantUML
  [Docs Server\nMkDocs] as Docs
  [Whiteboard\nExcalidraw] as Excalidraw

  database "Git Repository" as Repo
}

cloud "Internet" as Internet
actor User

User --> Internet
Internet --> Traefik : HTTPS
Traefik --> Dashboard
Traefik --> PlantUML
Traefik --> Docs
Traefik --> Excalidraw

PlantUML ..> Repo : reads
Docs ..> Repo : reads

@enduml
```

## Deployment-Diagramme

```plantuml
@startuml
node "Docker Host" {
  node "Docker Network: empc4_net" {
    component "Traefik\nContainer" as Traefik
    component "Dashboard\nContainer" as Dashboard
    component "PlantUML\nContainer" as PlantUML
    component "MkDocs\nContainer" as Docs
    component "Excalidraw\nContainer" as Excalidraw
  }

  folder "/var/run" {
    file "docker.sock" as Socket
  }

  folder "Project Root" {
    folder "repo/" as Repo {
      folder "docs/"
      folder "c4/"
      folder "assets/"
    }
    folder "dashboard/dist/" as DashDist
  }
}

Traefik -[#red]-> Socket : read-only
PlantUML -[#blue]-> Repo : mount (ro)
Docs -[#blue]-> Repo : mount (rw)
Dashboard -[#blue]-> DashDist : mount (ro)

@enduml
```

## Zustandsdiagramme

```plantuml
@startuml
[*] --> Stopped

Stopped --> Starting : docker-compose up
Starting --> Running : All services healthy
Running --> Running : Normal operation
Running --> Degraded : Service failure
Degraded --> Running : Service recovered
Degraded --> Stopped : Critical failure
Running --> Stopping : docker-compose down
Stopping --> Stopped

Stopped : No containers running
Starting : Containers starting\nHealth checks pending
Running : All services operational\nAll health checks pass
Degraded : Some services down\nPartial functionality
Stopping : Graceful shutdown\nSaving state

@enduml
```

## Timing-Diagramme

```plantuml
@startuml
clock "System Clock" as Clock with period 1
concise "docker-compose" as Compose
robust "Traefik" as Traefik
robust "PlantUML" as PlantUML
robust "Docs" as Docs

@0
Compose is Idle
Traefik is Stopped
PlantUML is Stopped
Docs is Stopped

@5
Compose is "Running 'up'"
Traefik is Starting
PlantUML is Starting
Docs is Starting

@10
Traefik is Running
@15
PlantUML is "Health Check"
@20
PlantUML is Running
Docs is "Installing Plugins"

@40
Docs is Running
Compose is Idle

@enduml
```

## Mind Maps

```plantuml
@startmindmap
* EMPC4 VIS Stack
** Services
*** Traefik
**** Routing
**** TLS
**** Service Discovery
*** PlantUML
**** C4 Diagrams
**** UML
**** API
*** MkDocs
**** Material Theme
**** Mermaid
**** Search
*** Excalidraw
**** Whiteboard
**** Export
** Infrastruktur
*** Docker
**** Compose
**** Networks
**** Volumes
*** Git
**** Version Control
**** Collaboration
@endmindmap
```

## Work Breakdown Structure (WBS)

```plantuml
@startwbs
* EMPC4 VIS Stack Implementation
** Setup
*** Infrastructure
**** Docker Installation
**** Network Configuration
*** Repository
**** Directory Structure
**** Git Configuration
** Services
*** Core Services
**** Reverse Proxy
**** Dashboard
*** Visualization Tools
**** PlantUML Server
**** Documentation Server
**** Whiteboard
** Documentation
*** Architecture Docs
**** Overview
**** C4 Diagrams
*** User Guides
**** Setup Guide
**** Examples
*** Operations
**** Runbook
**** Troubleshooting
@endwbs
```

## Netzwerk-Diagramme

```plantuml
@startuml
nwdiag {
  network Internet {
      address = "0.0.0.0/0"
      user [address = "client"];
  }

  network Docker_Host {
      address = "172.20.0.0/16"
      traefik [address = "172.20.0.2"];
  }

  network empc4_net {
      address = "172.21.0.0/16"
      traefik [address = "172.21.0.2"];
      dashboard [address = "172.21.0.3"];
      plantuml [address = "172.21.0.4"];
      docs [address = "172.21.0.5"];
      excalidraw [address = "172.21.0.6"];
  }
}
@enduml
```

## Archimate Diagrams

```plantuml
@startuml
archimate #Technology "Docker Host" as host
archimate #Technology "Traefik" as traefik
archimate #Application "Dashboard" as dashboard
archimate #Application "PlantUML" as plantuml
archimate #Application "MkDocs" as docs
archimate #Application "Excalidraw" as excalidraw

host *-down- traefik : hosts
traefik *-down- dashboard : routes to
traefik *-down- plantuml : routes to
traefik *-down- docs : routes to
traefik *-down- excalidraw : routes to

archimate #Business "Developer" as dev
archimate #Business "Stakeholder" as stakeholder

dev -right-> dashboard : uses
dev -right-> plantuml : creates diagrams
stakeholder -right-> docs : views
@enduml
```

## YAML-Visualisierung

```plantuml
@startyaml
services:
  reverse-proxy:
    image: traefik:v2.11
    ports:
      - "80:80"
      - "8080:8080"
  dashboard:
    image: nginx:stable-alpine
    volumes:
      - ./dashboard/dist:/usr/share/nginx/html:ro
  plantuml:
    image: plantuml/plantuml-server:jetty
    volumes:
      - ./repo:/repo:ro
@endyaml
```

## Tipps für PlantUML

!!! tip "Encoding für URLs"
    PlantUML URLs verwenden ein spezielles Encoding. Es gibt **3 Optionen**:
    
    **Option 1: Docker-Service (empfohlen für Batch-Processing)**
    ```bash
    docker compose run --rm plantuml-tools encode repo/c4/beispiel-context.puml
    ```
    
    **Option 2: Lokales Python-Script (schnell für einzelne Dateien)**
    ```bash
    # Installation:
    pip install -r scripts/requirements-plantuml.txt
    
    # Nutzung:
    python scripts/plantuml_encode.py repo/c4/beispiel-context.puml
    ```
    
    **Option 3: Programmatische Nutzung**
    ```python
    # Installation: pip install plantuml
    from plantuml import deflate_and_encode
    
    encoded = deflate_and_encode("@startuml\nAlice -> Bob\n@enduml")
    url = f"http://arch.local/plantuml/png/{encoded}"
    ```
    
    📚 **Siehe auch:** [PlantUML Python Integration](../../docs/20251127_plantuml_python_integration.md)

!!! warning "Performance"
    Sehr komplexe Diagramme können Rendering-Zeit benötigen. Nutze:
    - `PLANTUML_LIMIT_SIZE` für große Diagramme
    - Caching in CI/CD
    - SVG statt PNG für große Outputs

!!! info "Includes"
    Nutze `!include` für wiederverwendbare Komponenten:
    ```plantuml
    @startuml
    !include repo/c4/includes/styles.puml
    !include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml
    @enduml
    ```
