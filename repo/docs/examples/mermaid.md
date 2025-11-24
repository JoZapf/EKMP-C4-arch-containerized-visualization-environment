# Mermaid-Diagramme

Mermaid ermöglicht es, Diagramme direkt in Markdown zu schreiben. Die Rendering erfolgt automatisch beim Build.

## Flussdiagramme

```mermaid
graph LR
    A[Start] --> B{Entscheidung}
    B -->|Ja| C[Aktion 1]
    B -->|Nein| D[Aktion 2]
    C --> E[Ende]
    D --> E
```

## Sequenzdiagramme

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Traefik
    participant PlantUML

    User->>Browser: Öffnet IDE
    Browser->>Traefik: GET /plantuml/png/...
    Traefik->>PlantUML: Forward Request
    PlantUML->>PlantUML: Rendert Diagramm
    PlantUML-->>Traefik: PNG Image
    Traefik-->>Browser: PNG Image
    Browser-->>User: Zeigt Diagramm
```

## Klassendiagramme

```mermaid
classDiagram
    class ReverseProxy {
        +route(request)
        +loadBalance()
        -healthCheck()
    }

    class Service {
        <<interface>>
        +handleRequest()
        +getStatus()
    }

    class PlantUMLService {
        +renderDiagram(puml)
        +exportPNG()
        +exportSVG()
    }

    class DocsService {
        +serveDocs()
        +buildSite()
    }

    ReverseProxy --> Service
    Service <|.. PlantUMLService
    Service <|.. DocsService
```

## ER-Diagramme

```mermaid
erDiagram
    USER ||--o{ DIAGRAM : creates
    USER ||--o{ WHITEBOARD : draws
    DIAGRAM ||--|| RENDERING : generates

    USER {
        string name
        string email
        string role
    }

    DIAGRAM {
        string id
        string type
        text content
        datetime created
    }

    RENDERING {
        string id
        string format
        blob image
    }

    WHITEBOARD {
        string id
        json elements
        datetime modified
    }
```

## Gantt-Diagramme

```mermaid
gantt
    title EMPC4 VIS Stack Implementierung
    dateFormat  YYYY-MM-DD
    section Setup
    Verzeichnisstruktur          :done,    setup1, 2024-01-01, 1d
    Docker Compose               :done,    setup2, after setup1, 2d
    Dashboard                    :done,    setup3, after setup2, 1d

    section Services
    PlantUML Integration         :active,  svc1, after setup3, 2d
    MkDocs Konfiguration         :active,  svc2, after setup3, 2d
    Excalidraw Setup             :         svc3, after svc1, 1d

    section Dokumentation
    Runbook                      :         doc1, after svc2, 2d
    Beispiele                    :         doc2, after doc1, 1d
```

## Zustandsdiagramme

```mermaid
stateDiagram-v2
    [*] --> Stopped
    Stopped --> Starting : docker-compose up
    Starting --> Running : Services healthy
    Running --> Stopping : docker-compose down
    Stopping --> Stopped
    Running --> Error : Health check failed
    Error --> Running : Auto-restart
    Error --> Stopped : Manual intervention
```

## Pie Charts

```mermaid
pie title Service-Ressourcen-Verteilung
    "Traefik" : 10
    "PlantUML" : 30
    "MkDocs" : 25
    "Excalidraw" : 20
    "Dashboard" : 15
```

## Git Graph

```mermaid
gitGraph
    commit id: "Initial commit"
    commit id: "Add docker-compose"
    branch feature/dashboard
    checkout feature/dashboard
    commit id: "Add dashboard"
    commit id: "Style dashboard"
    checkout main
    branch feature/docs
    checkout feature/docs
    commit id: "Add mkdocs.yml"
    commit id: "Add examples"
    checkout main
    merge feature/dashboard
    merge feature/docs
    commit id: "Release v1.0"
```

## Timeline (experimentell)

```mermaid
timeline
    title EMPC4 VIS Stack Evolution
    2024-Q1 : Konzept
            : Architektur-Design
    2024-Q2 : Implementierung
            : Docker Setup
            : Service-Integration
    2024-Q3 : Testing
            : Dokumentation
            : Beta-Release
    2024-Q4 : Production
            : Monitoring
            : Optimierung
```

## Tipps für Mermaid

!!! tip "Syntax-Highlighting"
    In deiner IDE kannst du Mermaid-Syntax-Highlighting mit Extensions aktivieren:

    - VS Code: [Mermaid Preview](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid)
    - IntelliJ: [Mermaid Plugin](https://plugins.jetbrains.com/plugin/20146-mermaid)

!!! warning "Browser-Kompatibilität"
    Mermaid wird im Browser gerendert. Stelle sicher, dass JavaScript aktiviert ist.

!!! info "Theme-Anpassung"
    Das Mermaid-Theme folgt automatisch dem MkDocs Material Theme (Dark/Light Mode).
