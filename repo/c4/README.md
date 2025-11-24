# C4-PlantUML Diagramme

Dieses Verzeichnis enthält C4-Architekturdiagramme für EMPC4 VIS Stack.

## Übersicht

### Verfügbare Diagramme

| Datei | Level | Beschreibung |
|-------|-------|--------------|
| `beispiel-context.puml` | Level 1: Context | System Context mit Akteuren und externen Systemen |
| `beispiel-container.puml` | Level 2: Container | Container-Übersicht (Services) |
| `beispiel-component.puml` | Level 3: Component | Komponenten innerhalb Traefik |

## C4-Modell Levels

### Level 1: System Context

**Frage:** Wie passt das System in die Welt?

**Zeigt:**
- Benutzer/Akteure
- Das System selbst
- Externe Systeme
- Beziehungen

**Beispiel:** `beispiel-context.puml`

### Level 2: Container

**Frage:** Was sind die Hauptbausteine des Systems?

**Zeigt:**
- Container (Anwendungen, Datenbanken, Services)
- Technologie-Stack
- Kommunikation zwischen Containern

**Beispiel:** `beispiel-container.puml`

### Level 3: Component

**Frage:** Wie ist ein Container intern strukturiert?

**Zeigt:**
- Komponenten innerhalb eines Containers
- Verantwortlichkeiten
- Technologie-Details

**Beispiel:** `beispiel-component.puml`

### Level 4: Code

**Frage:** Wie ist eine Komponente implementiert?

**Zeigt:**
- Klassen, Interfaces, Methoden
- UML-Klassendiagramme
- Implementierungsdetails

**Status:** Nicht enthalten (zu detailliert für Architektur-Dokumentation)

## Verwendung

### Im Browser

1. Öffne http://arch.local/plantuml
2. Kopiere Inhalt einer `.puml` Datei
3. Klicke "Submit"
4. Exportiere als PNG/SVG

### In IDEs

#### VS Code

```json
// .vscode/settings.json
{
  "plantuml.server": "http://arch.local/plantuml",
  "plantuml.render": "PlantUMLServer"
}
```

Dann: `Alt+D` für Live-Preview

#### IntelliJ IDEA

1. Settings → PlantUML
2. Server URL: `http://arch.local/plantuml`
3. Rechtsklick auf `.puml` → "Show PlantUML Diagram"

### Kommandozeile

```bash
# PNG generieren
curl -o output.png "http://arch.local/plantuml/png/$(cat beispiel-context.puml | base64)"

# SVG generieren
curl -o output.svg "http://arch.local/plantuml/svg/$(cat beispiel-context.puml | base64)"
```

### In CI/CD

```yaml
# GitHub Actions Beispiel
- name: Generate C4 Diagrams
  run: |
    for file in repo/c4/*.puml; do
      name=$(basename "$file" .puml)
      curl -o "repo/assets/$name.png" \
        "http://arch.local/plantuml/png/$(cat $file | base64)"
    done
```

## Best Practices

### 1. Konsistente Benennung

```
<system>-context.puml
<system>-container.puml
<container>-component.puml
```

Beispiel:
```
empc4-context.puml
empc4-container.puml
traefik-component.puml
```

### 2. Include für Styles

Erstelle `includes/styles.puml` für gemeinsame Styles:

```plantuml
!define PRIMARY_COLOR #1168bd
!define SECONDARY_COLOR #438dd5

skinparam BackgroundColor white
skinparam DefaultTextAlignment center
```

Nutze in Diagrammen:
```plantuml
@startuml
!include includes/styles.puml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml
' ...
@enduml
```

### 3. Aussagekräftige Beschreibungen

Gute Beschreibung:
```plantuml
Container(plantuml, "PlantUML Server", "Java, Jetty", "Rendert UML und C4-Diagramme als PNG/SVG")
```

Schlechte Beschreibung:
```plantuml
Container(plantuml, "PlantUML", "Java", "Server")
```

### 4. Layout optimieren

```plantuml
' Legende anzeigen
LAYOUT_WITH_LEGEND()

' Oder manuell
SHOW_LEGEND()

' Layout-Richtung
LAYOUT_TOP_DOWN()
LAYOUT_LEFT_RIGHT()

' Abstand zwischen Elementen
LAYOUT_AS_SKETCH()
```

### 5. Notizen für zusätzlichen Kontext

```plantuml
note right of plantuml
  PlantUML unterstützt:
  - C4-PlantUML Syntax
  - Standard UML
  - Limit Size: 8192px
end note
```

## Troubleshooting

### Diagramm rendert nicht

**Problem:** Fehler beim Rendering

**Lösungen:**
1. Prüfe Syntax-Fehler
2. Teste auf http://www.plantuml.com/plantuml/
3. Prüfe `PLANTUML_LIMIT_SIZE` in `.env`
4. Logs ansehen: `docker-compose logs plantuml`

### Include funktioniert nicht

**Problem:** `!include` Datei nicht gefunden

**Lösungen:**
1. Verwende URLs für C4-PlantUML:
   ```plantuml
   !include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml
   ```
2. Lokale Includes relativ zu Diagramm-Datei:
   ```plantuml
   !include includes/styles.puml
   ```

### Schrift zu klein

**Lösung:** Erhöhe Font-Größe

```plantuml
skinparam DefaultFontSize 14
skinparam DefaultFontName Arial
```

## Weitere Ressourcen

- [C4-PlantUML Repository](https://github.com/plantuml-stdlib/C4-PlantUML)
- [C4 Model](https://c4model.com/)
- [PlantUML Language Reference](https://plantuml.com/guide)
- [EMPC4 Dokumentation](../docs/architecture/c4-diagrams.md)

## Beispiel-Workflow

1. **Erstelle Diagramm**
   ```bash
   nano repo/c4/mein-system-context.puml
   ```

2. **Teste lokal mit IDE-Plugin**
   - VS Code: `Alt+D`
   - IntelliJ: Rechtsklick → Show Diagram

3. **Commite ins Git**
   ```bash
   git add repo/c4/mein-system-context.puml
   git commit -m "Add: System Context for mein-system"
   git push
   ```

4. **Binde in Dokumentation ein**
   ```markdown
   ## Architektur

   ![System Context](../../c4/mein-system-context.puml)
   ```

5. **Generiere PNG für Präsentationen**
   ```bash
   curl -o presentation/context.png \
     "http://arch.local/plantuml/png/$(cat repo/c4/mein-system-context.puml | base64)"
   ```
