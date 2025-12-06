<!--
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEMPLATE ENTSCHEIDUNGSBAUM                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Welches Template sollst du verwenden?                                      │
│                                                                             │
│ ┌─────────────────────────────────────────┐                                │
│ │ Dokumentierst du ein Feature/Change?    │                                │
│ └─────────────┬───────────────────────────┘                                │
│               │                                                             │
│               ├─ JA → feature-header.md                                    │
│               │       Beispiele:                                            │
│               │       - Dashboard Health-Check                              │
│               │       - PlantUML Tools Implementation                       │
│               │       - Mermaid Save/Load Feature                           │
│               │       - Changelog-Einträge                                  │
│               │                                                             │
│               └─ NEIN → doc-header.md                                      │
│                         Beispiele:                                          │
│                         - Setup-Anleitungen                                 │
│                         - Docker Befehle                                    │
│                         - Dependencies                                      │
│                         - Architektur-Übersicht                             │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ WANN LOHNT SICH DAS SYSTEM ÜBERHAUPT?                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Phase 1: 1-5 Dokumente                                                     │
│ ──────────────────────                                                     │
│ Status:  ⚠️  Overhead höher als Nutzen                                     │
│ Tipp:    Besser manuell schreiben, später migrieren                        │
│                                                                             │
│ Phase 2: 5-15 Dokumente                                                    │
│ ───────────────────────                                                    │
│ Status:  ⚖️  Grauzone                                                      │
│ Benefit: Format-Konsistenz + zentrale Projekt-Namen                        │
│ Tipp:    Lohnt sich wenn Projekt-Name sich oft ändert                      │
│                                                                             │
│ Phase 3: 15+ Dokumente                                                     │
│ ──────────────────────                                                     │
│ Status:  ✅ Lohnt sich definitiv!                                          │
│ Benefit: - Feature-Listen automatisch generieren                           │
│          - Status-Dashboards erstellen                                     │
│          - Suche/Filter nach Metadaten                                     │
│          - Zentrale Änderungen (1 statt 50 Dateien)                        │
│          - Export in JSON/CSV für Statistiken                              │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ EHRLICHE KOSTEN-NUTZEN-RECHNUNG                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ KOSTEN (pro Dokument):                                                     │
│   - YAML Front Matter schreiben     (~50 Zeichen)                          │
│   - Template include                 (1 Zeile)                              │
│   - Mental overhead                  (Syntax merken)                        │
│                                                                             │
│ NUTZEN (sofort):                                                            │
│   - Projekt-Name automatisch         (30 Zeichen gespart)                  │
│   - Autor automatisch                (7 Zeichen gespart)                   │
│   - Format garantiert konsistent     (unbezahlbar bei 50 Docs)             │
│                                                                             │
│ NUTZEN (später):                                                            │
│   - Projekt umbenennen               (1 Zeile statt 50 Dateien)            │
│   - Feature-Listen generieren        (automatisch)                          │
│   - Status-Tracking                  (automatisch)                          │
│   - Veraltete Docs finden            (automatisch)                          │
│                                                                             │
│ BREAK-EVEN-PUNKT:                                                           │
│   Ab ~10-15 Dokumenten überwiegt der Nutzen die Kosten deutlich!           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Beispiel: Projekt-Name zentral ändern
──────────────────────────────────────

OHNE Templates (bei 20 Docs):
  1. Öffne dashboard-health-check.md         → Ändere Projekt-Name
  2. Öffne dashboard-quick-wins.md           → Ändere Projekt-Name
  3. Öffne plantuml-tools.md                 → Ändere Projekt-Name
  ...
  20. Öffne letzte-datei.md                  → Ändere Projekt-Name
  
  Aufwand: 20 Dateien × 2 Min = 40 Minuten ❌

MIT Templates (bei 20 Docs):
  1. Öffne mkdocs.yml                        → Ändere EINE Zeile
  2. docker compose build docs               → Fertig!
  
  Aufwand: 2 Minuten ✅
  
  Ersparnis: 38 Minuten! 🎉


Beispiel: Feature-Übersicht automatisch
────────────────────────────────────────

OHNE Templates:
  - Manuell Liste pflegen
  - Bei jedem neuen Feature: Liste updaten
  - Fehleranfällig (vergisst man leicht)
  
MIT Templates:
  In docs/features/index.md:
  
  {% for page in pages %}
    {% if page.meta.feature %}
      - [{{ page.meta.feature }}]({{ page.url }}) - {{ page.meta.status }}
    {% endif %}
  {% endfor %}
  
  → Automatisch IMMER aktuell! ✅


FAZIT
─────

Redundanz ist ein FEATURE, kein BUG!

Die "redundanten" YAML-Daten ermöglichen:
  ✅ Maschinelles Verarbeiten (Filter, Suche, Listen)
  ✅ Automatische Aggregation (Dashboards, Statistiken)
  ✅ Strukturierte Daten (Export, APIs)

Trade-off:
  Jetzt:    Etwas mehr Schreibaufwand (YAML statt direkter Text)
  Später:   Massive Zeitersparnis (Automatisierung)

Ab 10+ Docs ist es ein No-Brainer! 🚀
-->

# Diese Datei dient nur als Referenz und wird nicht included!
