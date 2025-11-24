# Willkommen bei EMPC4 VIS Stack

Dies ist die zentrale Dokumentationsseite für die **EMPC4 Containerisierte Visualisierungsumgebung**.

## Was ist EMPC4 VIS Stack?

EMPC4 VIS Stack ist eine containerisierte Umgebung, die verschiedene Visualisierungs- und Diagramm-Tools vereint:

- **PlantUML** (inkl. C4-PlantUML) für Architecture as Code
- **Mermaid** für Diagramme direkt in Markdown
- **Excalidraw** für interaktive Whiteboards und Skizzen

## Quick Start

### Zugriff auf die Tools

| Tool | URL | Beschreibung |
|------|-----|--------------|
| Dashboard | [http://arch.local/](http://arch.local/) | Haupteinstiegspunkt |
| Dokumentation | [http://arch.local/docs](http://arch.local/docs) | Diese Seite |
| PlantUML | [http://arch.local/plantuml](http://arch.local/plantuml) | Diagramm-Renderer |
| Whiteboard | [http://arch.local/whiteboard](http://arch.local/whiteboard) | Excalidraw |

### Services Status

!!! info "Service-Übersicht"
    Alle Services werden über Traefik als Reverse Proxy bereitgestellt und sind über die zentrale Domain `arch.local` erreichbar.

## Navigation

- **[Architektur](architecture/overview.md)**: Detaillierte Architekturbeschreibung
- **[Beispiele](examples/mermaid.md)**: Praktische Beispiele für Diagramme
- **[C4-Diagramme](architecture/c4-diagrams.md)**: C4-Architekturmodellierung

## Erste Schritte

1. Stelle sicher, dass alle Services laufen:
   ```bash
   docker-compose ps
   ```

2. Öffne das Dashboard: [http://arch.local/](http://arch.local/)

3. Erkunde die verschiedenen Tools und Beispiele

## Support

Bei Fragen oder Problemen:
- Siehe [Runbook](../runbook.md) für Betriebsanleitung
- Issues auf GitHub: [EMPC4 Repository](https://github.com/JoZapf/EMPC4-containerized-visualization-environment)
