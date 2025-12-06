<!--
┌────────────────────────────────────────────────────────────────────────────────┐
│ TEMPLATE: Feature-Dokumentations-Header                                        │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│ ZWECK:                                                                         │
│   Zeigt Feature-Metadaten für Feature-Dokumentation (Changelog, Features)      │
│                                                                                │
│ BENEFIT:                                                                       │
│   ✅ Projekt-Name aus mkdocs.yml (NICHT redundant - muss nicht getippt werden)│
│   ✅ Format zentral änderbar (1 Datei statt 50 Dateien)                       │
│   ❌ Feature, Version, Status, Datum sind redundant (stehen auch im YAML)     │
│                                                                                │
│ WANN WIRD REDUNDANZ ZUM BENEFIT?                                               │
│                                                                                │
│   Szenario 1: Projekt-Name ändert sich                                         │
│   ─────────────────────────────────────────────────────────────────────        │
│   Ohne Template: 50 Dateien manuell ändern ❌                                 │
│   Mit Template:  1 Zeile in mkdocs.yml ändern ✅                              │
│                                                                                │
│   Szenario 2: Feature-Übersicht automatisch generieren                         │
│   ─────────────────────────────────────────────────────────────────────        │
│   In docs/features/index.md:                                                   │
│   {% for page in pages %}                                                      │
│     {% if page.meta.feature %}                                                 │
│       - {{ page.meta.feature }} ({{ page.meta.status }})                       │
│     {% endif %}                                                                │
│   {% endfor %}                                                                 │
│   → Automatische Liste ALLER Features! ✅                                     │
│                                                                                │
│   Szenario 3: Status-Dashboard                                                 │
│   ─────────────────────────────────────────────────────────────────────        │
│   Finde alle Features mit Status "✅ PRODUKTIV"                               │
│   → Nur möglich weil Daten strukturiert im YAML! ✅                           │
│                                                                                │
│ FAUSTREGEL:                                                                    │
│   < 5 Features:   Overhead zu groß, besser manuell                             │
│   5-10 Features:  Grauzone, lohnt sich bei zentralen Änderungen                │
│   > 10 Features:  PFLICHT! Automatisierung + Konsistenz unbezahlbar            │
│                                                                                │
│ VERWENDUNG:                                                                    │
│   In deiner feature.md Datei:                                                  │
│                                                                                │
│   ---                                                                          │
│   feature: Dashboard Health-Check                                              │
│   version: 1.0                                                                 │
│   status: ✅ PRODUKTIV                                                        │
│   implemented: 29.11.2025                                                      │
│   ---                                                                          │
│                                                                                │
│   {% include "_templates/feature-header.md" %}                                 │
│                                                                                │
│   # Dashboard Health-Check                                                     │
│   ...                                                                          │
│                                                                                │
│ KRITISCHER PUNKT:                                                              │
│   Ja, Feature-Name steht 2x (YAML + Ausgabe) = redundant                       │
│   ABER: Diese Redundanz ermöglicht spätere Automatisierung!                    │
│   Trade-off: Jetzt etwas Overhead → Später massive Zeitersparnis               │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
-->

**Projekt:** {{ project.name_short }}  
**Feature:** {{ page.meta.feature }}  
**Implementiert:** {{ page.meta.implemented | default('Nicht angegeben') }}  
**Version:** {{ page.meta.version | default('1.0') }}  
**Status:** {{ page.meta.status | default('📋 PLANUNG') }}

---
