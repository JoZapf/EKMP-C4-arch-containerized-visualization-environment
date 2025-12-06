{% raw %}
# MkDocs Automatisches Metadaten System

**Projekt:** EKMP-C4 Architektur-Visualisierungs Stack  
**Feature:** Automatisierte Dokumentations-Metadaten  
**Implementiert:** 29.11.2025  
**Version:** 1.0  
**Status:** ✅ Produktiv

---

## 📋 Übersicht

Dieses System automatisiert die Verwaltung von Metadaten (Datum, Autor, Version, etc.) in allen Markdown-Dokumentationen.

### Komponenten

1. **MkDocs Macros Plugin** - Zentrale Variablen für Projekt-Informationen
2. **YAML Front Matter** - Dokumenten-spezifische Metadaten (inkl. Datum)

**Hinweis:** Das Git Revision Date Plugin wird bewusst NICHT verwendet, da `.git` nicht im Docker-Container verfügbar ist. Stattdessen verwenden wir ein manuelles `implemented` Feld im YAML Front Matter.

---

## 🎯 Motivation

### Problem

Vorher mussten in jedem Dokument manuell Projekt-Name, Datum, Autor, Version, etc. gepflegt werden. Das führte zu:

- ❌ Inkonsistenten Formaten
- ❌ Veralteten Datumsstempeln
- ❌ Vergessenen Updates
- ❌ Copy-Paste Fehlern

### Lösung

Jetzt werden diese Informationen zentral konfiguriert und automatisch eingefügt:

- ✅ Zentrale Konfiguration in `mkdocs.yml`
- ✅ Manuelle Datumsstempel im YAML Front Matter
- ✅ Konsistentes Format
- ✅ Keine manuellen Updates in jedem Dokument

---

## 🔧 Installation

### Plugins installieren

Die Plugins sind bereits im Dockerfile konfiguriert:

```bash
# Im Dockerfile.mkdocs:
RUN python -m pip install --no-cache-dir \
    mkdocs-mermaid2-plugin \
    mkdocs-macros-plugin
```

### Konfiguration in mkdocs.yml

```yaml
plugins:
  - search
  - macros

extra:
  project:
    name: "EKMP-C4 Architektur-Visualisierungs Stack"
    name_short: "EKMP-C4 Architektur-Stack"
    author: "Jo Zapf"
    version: "1.3"
    status: "✅ PRODUKTIV"
```

---

## 📚 Verfügbare Variablen

### Projekt-Variablen

Diese Variablen sind überall verfügbar:

- `project.name` → "EKMP-C4 Architektur-Visualisierungs Stack"
- `project.name_short` → "EKMP-C4 Architektur-Stack"
- `project.author` → "Jo Zapf"
- `project.version` → "1.3"
- `project.status` → "✅ PRODUKTIV"

### Dokumenten-Metadaten (YAML Front Matter)

Diese Felder werden manuell im YAML Front Matter jedes Dokuments angegeben:

- `page.meta.feature` → Feature-Name (z.B. "Dashboard Health-Check")
- `page.meta.version` → Feature-Version (z.B. "1.0")
- `page.meta.status` → Feature-Status (z.B. "✅ PRODUKTIV")
- `page.meta.implemented` → Implementierungs-Datum (z.B. "29.11.2025")

---

## 📝 Template-Dateien

### Standard-Template

**Datei:** `docs/_templates/doc-header.md`

Enthält Header für normale Dokumentation mit Projekt-Name, Autor, Version und Status.

### Feature-Template

**Datei:** `docs/_templates/feature-header.md`

Enthält Header für Feature-Dokumentation mit zusätzlichen Feldern für Feature-Name, Implementierungs-Datum, Version und Status.

---

## 🚀 Verwendung

### In neuen Dokumenten

1. **YAML Front Matter** am Anfang hinzufügen:

```yaml
---
feature: Mein Feature Name
version: 1.0
status: ✅ PRODUKTIV
implemented: 29.11.2025
---
```

2. **Template einbinden:**

```markdown
{% include "_templates/feature-header.md" %}
```

3. **Variablen verwenden:**

Statt "EKMP-C4 Architektur-Stack" hardcoded zu schreiben, verwende die Variable (Syntax mit doppelten geschweiften Klammern).

---

## 📊 Vorteile

### Für Entwickler

- ✅ Weniger Wartungsaufwand
- ✅ Keine manuellen Datumsstempel
- ✅ Konsistente Formatierung
- ✅ Zentrale Konfiguration

### Für Projekt

- ✅ Skalierbar (viele Dokumente)
- ✅ Wartbar (zentrale Änderungen)
- ✅ Professionelles Erscheinungsbild

---

## 🔄 Wartung

### Projekt-Version aktualisieren

Um die Projekt-Version zu ändern:

1. Öffne `mkdocs.yml`
2. Ändere `extra.project.version` auf neuen Wert
3. Build neu → Überall aktualisiert!

### Neue Variablen hinzufügen

Neue Variablen können in `mkdocs.yml` unter `extra.project` hinzugefügt werden.

---

## 📖 Weitere Ressourcen

- **MkDocs Macros Plugin:** https://mkdocs-macros-plugin.readthedocs.io/
- **Git Revision Date Plugin:** https://github.com/timvink/mkdocs-git-revision-date-localized-plugin
- **MkDocs Dokumentation:** https://www.mkdocs.org/

---

## 📝 Changelog

### Version 1.0 (29.11.2025)

**Implementiert:**
- ✅ MkDocs Macros Plugin konfiguriert
- ✅ Zentrale Variablen definiert
- ✅ 2 Template-Dateien erstellt
- ✅ Dokumentation erstellt
- ✅ Manuelle Datumsstempel via YAML Front Matter

**Nicht implementiert:**
- ❌ Git Revision Date Plugin (`.git` nicht im Docker verfügbar)

**Konfiguration:**
- `Dockerfile.mkdocs` erweitert (2 Plugins: mermaid2, macros)
- `mkdocs.yml` erweitert (Plugins, Extra)
- `docs/_templates/` Verzeichnis erstellt
- Keine Breaking Changes

---

**Autor:** Jo Zapf  
**Projekt:** EKMP-C4 Architektur-Visualisierungs Stack  
**Implementiert:** 29.11.2025  
**Version:** 1.0  
**Status:** ✅ Implementiert
{% endraw %}
