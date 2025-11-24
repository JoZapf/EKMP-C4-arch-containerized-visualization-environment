# C4-Architekturmodellierung

## Was ist C4?

Das C4-Modell ist ein Ansatz zur Visualisierung von Softwarearchitektur auf vier Abstraktionsebenen:

1. **Context** (System Context) - Wie passt das System in die Welt?
2. **Container** - Was sind die Hauptbausteine?
3. **Component** - Wie ist ein Container intern strukturiert?
4. **Code** - Wie ist eine Komponente implementiert?

## C4-PlantUML Integration

EMPC4 VIS Stack nutzt [C4-PlantUML](https://github.com/plantuml-stdlib/C4-PlantUML) für "Architecture as Code".

### Vorteile

- ✅ Versionierbar in Git
- ✅ Automatisch aktualisierbar in CI/CD
- ✅ Konsistente Notation
- ✅ Live-Preview in IDEs
- ✅ Export in verschiedene Formate (PNG, SVG, PDF)

## Beispiel: System Context

Siehe [beispiel-context.puml](../../c4/beispiel-context.puml) im Repository:

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml

LAYOUT_WITH_LEGEND()

title System Context Diagram - EMPC4 VIS Stack

Person(user, "Entwickler/Architekt", "Erstellt und pflegt Architektur-Dokumentation")
Person(viewer, "Stakeholder", "Betrachtet Architektur-Dokumentation")

System(empc4, "EMPC4 VIS Stack", "Containerisierte Visualisierungsumgebung für PlantUML, Mermaid und Excalidraw")

System_Ext(ide, "IDE", "VS Code, IntelliJ mit PlantUML-Plugins")
System_Ext(git, "Git Repository", "Versionskontrolle für Architekturinhalte")
System_Ext(browser, "Web Browser", "Zugriff auf Dokumentation und Tools")

Rel(user, ide, "Erstellt Diagramme in", "PlantUML, Markdown")
Rel(user, empc4, "Nutzt für", "Rendering und Dokumentation")
Rel(viewer, browser, "Nutzt")
Rel(browser, empc4, "Zeigt Dokumentation von")
Rel(ide, empc4, "Rendert Diagramme via", "HTTP API")
Rel(empc4, git, "Liest Inhalte von")
Rel(user, git, "Commitet Änderungen zu")

@enduml
```

**Rendered Diagram**: Öffne [http://arch.local/plantuml](http://arch.local/plantuml) und füge den Code ein.

## Beispiel: Container Diagram

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

LAYOUT_WITH_LEGEND()

title Container Diagram - EMPC4 VIS Stack

Person(user, "Benutzer", "Nutzer der Visualisierung")

System_Boundary(empc4, "EMPC4 VIS Stack") {
    Container(reverse_proxy, "Reverse Proxy", "Traefik", "Routing, TLS-Termination")
    Container(dashboard, "Dashboard", "nginx", "Zentrale Einstiegsseite")
    Container(plantuml, "PlantUML Server", "Java, Jetty", "Rendert UML/C4-Diagramme")
    Container(docs, "Docs Server", "MkDocs Material", "Statische Dokumentation")
    Container(excalidraw, "Whiteboard", "Excalidraw", "Interaktives Zeichentool")
}

ContainerDb(repo, "Git Repository", "Filesystem", "Architektur-Inhalte")

Rel(user, reverse_proxy, "Nutzt", "HTTPS")
Rel(reverse_proxy, dashboard, "Routet zu")
Rel(reverse_proxy, plantuml, "Routet zu")
Rel(reverse_proxy, docs, "Routet zu")
Rel(reverse_proxy, excalidraw, "Routet zu")

Rel(plantuml, repo, "Liest .puml Dateien")
Rel(docs, repo, "Liest .md Dateien")

@enduml
```

## PlantUML in IDEs nutzen

### VS Code

1. Installiere Extension: [PlantUML](https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml)
2. Konfiguriere Server in `settings.json`:
   ```json
   {
     "plantuml.server": "http://arch.local/plantuml",
     "plantuml.render": "PlantUMLServer"
   }
   ```
3. Öffne `.puml` Datei und drücke `Alt+D` für Preview

### IntelliJ IDEA

1. Installiere Plugin: [PlantUML integration](https://plugins.jetbrains.com/plugin/7017-plantuml-integration)
2. Settings → PlantUML → Server URL: `http://arch.local/plantuml`
3. Rechtsklick auf `.puml` → "Show PlantUML Diagram"

## Best Practices

### Datei-Organisation

```
repo/c4/
├── context/
│   └── system-context.puml
├── container/
│   └── empc4-containers.puml
├── component/
│   └── dashboard-components.puml
└── includes/
    └── styles.puml
```

### Styling

Erstelle wiederverwendbare Styles:

```plantuml
' includes/styles.puml
!define PRIMARY_COLOR #1168bd
!define SECONDARY_COLOR #438dd5

skinparam BackgroundColor white
skinparam ArrowColor #666666
```

Include in Diagrammen:

```plantuml
@startuml
!include includes/styles.puml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml
' ... rest of diagram
@enduml
```

### Versionierung

- Commite `.puml` Dateien ins Git
- Optional: Generiere und commite PNG/SVG für schnelle Ansicht
- Nutze CI/CD für automatisches Rendering

## Weitere Ressourcen

- [C4-PlantUML auf GitHub](https://github.com/plantuml-stdlib/C4-PlantUML)
- [C4 Model Dokumentation](https://c4model.com/)
- [PlantUML Dokumentation](https://plantuml.com/)
