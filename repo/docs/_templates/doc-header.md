<!--
┌─────────────────────────────────────────────────────────────────────────────────┐
│ TEMPLATE: Standard-Dokumentations-Header                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ ZWECK:                                                                          │
│   Zeigt Projekt-Metadaten für normale Dokumentation (Setup, Anleitungen)        │
│                                                                                 │
│ BENEFIT:                                                                        │
│   ✅ Projekt-Name aus mkdocs.yml (NICHT redundant - muss nicht getippt werden) │
│   ✅ Autor aus mkdocs.yml (NICHT redundant - muss nicht getippt werden)        │
│   ✅ Format zentral änderbar (1 Datei statt 50 Dateien)                        │
│   ❌ Version & Status sind redundant (stehen auch im YAML)                     │
│                                                                                 │
│ WANN LOHNT ES SICH?                                                             │
│   < 5 Docs:   Overhead zu groß, besser manuell schreiben                        │
│   5-10 Docs:  Grauzone, Format-Konsistenz ist nice-to-have                      │
│   > 10 Docs:  Lohnt sich! Zentrale Änderungen + Konsistenz                      │
│                                                                                 │
│ VERWENDUNG:                                                                     │
│   In deiner .md Datei:                                                          │
│                                                                                 │
│   ---                                                                           │
│   version: 1.0                                                                  │
│   status: ✅ AKTUELL                                                           │
│   implemented: 29.11.2025                                                       │
│   ---                                                                           │
│                                                                                 │
│   {% include "_templates/doc-header.md" %}                                      │
│                                                                                 │
│   # Dein Dokument                                                               │
│   ...                                                                           │
│                                                                                 │
│ ZUKUNFTS-BENEFIT (wenn viele Docs):                                             │
│   - Automatische Dokumenten-Listen nach Status filtern                          │
│   - Suche nach veralteten Docs (status != "✅ AKTUELL")                        │
│   - Statistiken: Anzahl Docs pro Status                                         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
-->

**Projekt:** {{ project.name }}  
**Autor:** {{ project.author }}  
{% if page.meta.implemented %}**Implementiert:** {{ page.meta.implemented }}{% else %}**Zuletzt bearbeitet:** {{ auto_modified_date() }}{% endif %}  
{% if page.meta.version %}**Version:** {{ page.meta.version }}{% endif %}  
{% if page.meta.status %}**Status:** {{ page.meta.status }}{% endif %}

---
