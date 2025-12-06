{% raw %}
# MkDocs Macros - Automatische Datumsstempel

**Projekt:** EKMP-C4 Architektur-Visualisierungs Stack  
**Version:** 1.0  
**Zuletzt bearbeitet:** {{ auto_modified_date() }}

---

## 📋 Übersicht

Dieses Dokument demonstriert die **automatischen Datumsstempel** aus File-System-Metadaten.

### Was ist neu?

Wir haben ein **Custom Macro** gebaut, das Datei-Metadaten ausliest:

- ✅ Bearbeitungsdatum aus File System (mtime)
- ✅ Funktioniert im Docker (keine `.git` nötig)
- ✅ Automatisch aktualisiert bei jeder Änderung

---

## 🔧 Verfügbare Macros

### 1. `auto_modified_date()`

**Bearbeitungsdatum der aktuellen Seite:**

```markdown
Zuletzt bearbeitet: {{ auto_modified_date() }}
```

**Ausgabe:**  
Zuletzt bearbeitet: {{ auto_modified_date() }}

**Mit anderem Format:**
```markdown
Last modified: {{ auto_modified_date('%Y-%m-%d') }}
```

**Ausgabe:**  
Last modified: {{ auto_modified_date('%Y-%m-%d') }}

---

### 2. `auto_created_date()`

**Erstellungsdatum der aktuellen Seite:**

```markdown
Erstellt am: {{ auto_created_date() }}
```

**Ausgabe:**  
Erstellt am: {{ auto_created_date() }}

**Hinweis:** Auf Unix-Systemen ist `ctime` oft = `mtime`, daher nicht 100% zuverlässig.

---

### 3. `file_modified_date(path)`

**Bearbeitungsdatum einer ANDEREN Datei:**

```markdown
Docker-Befehle zuletzt geändert: {{ file_modified_date('setup/docker-befehle.md') }}
```

**Ausgabe:**  
Docker-Befehle zuletzt geändert: {{ file_modified_date('setup/docker-befehle.md') }}

---

### 4. `file_size(path)`

**Dateigröße anzeigen:**

```markdown
Größe dieser Datei: {{ file_size('mkdocs-macros-demo.md') }}
```

**Ausgabe:**  
Größe dieser Datei: {{ file_size('mkdocs-macros-demo.md') }}

**Andere Dateien:**
```markdown
dashboard-health-check.md: {{ file_size('setup/dashboard-health-check.md') }}
```

**Ausgabe:**  
dashboard-health-check.md: {{ file_size('setup/dashboard-health-check.md') }}

---

## 📝 Verwendung in Templates

### Feature-Header Template

**VORHER (mit manuellem Datum):**
```yaml
---
feature: Mein Feature
implemented: 29.11.2025
---
```

**NACHHER (automatisch):**
```yaml
---
feature: Mein Feature
# implemented fehlt → Fallback zu auto_modified_date()
---
```

**Template:** `_templates/feature-header.md`
```markdown
**Implementiert:** {{ page.meta.implemented | default(auto_modified_date()) }}
```

---

## 🎯 Vorteile

### ✅ Kein Git erforderlich
- Funktioniert im Docker-Build
- Keine `.git` Verzeichnis-Kopie nötig
- Schneller Build

### ✅ Automatisch aktuell
- Bei jeder Datei-Änderung aktualisiert sich das Datum
- Kein manuelles Datum-Pflegen mehr

### ✅ Flexibel
- Verschiedene Datums-Formate
- Kann auch andere Dateien referenzieren
- Kombinierbar mit YAML Front Matter

---

## 🚀 Praxis-Beispiele

### Beispiel 1: Changelog mit Auto-Datum

```yaml
---
feature: Dashboard Health-Check
version: 1.0
status: ✅ PRODUKTIV
# implemented NICHT angegeben
---

{% include "_templates/feature-header.md" %}
```

**Ergebnis:**
```
Projekt: EKMP-C4 Architektur-Stack
Feature: Dashboard Health-Check
Implementiert: 29.11.2025    ← Automatisch aus File-System!
Version: 1.0
Status: ✅ PRODUKTIV
```

---

### Beispiel 2: Dokumentations-Footer

```markdown
---

*Dieses Dokument wurde zuletzt am {{ auto_modified_date() }} aktualisiert.*
```

**Ausgabe:**

---

*Dieses Dokument wurde zuletzt am {{ auto_modified_date() }} aktualisiert.*

---

### Beispiel 3: Verwandte Dokumente mit Datum

```markdown
## Verwandte Dokumentation

- [Docker Befehle](setup/docker-befehle.md) - Zuletzt geändert: {{ file_modified_date('setup/docker-befehle.md') }}
- [Dependencies](setup/dependencies.md) - Zuletzt geändert: {{ file_modified_date('setup/dependencies.md') }}
```

**Ausgabe:**

## Verwandte Dokumentation

- [Docker Befehle](setup/docker-befehle.md) - Zuletzt geändert: {{ file_modified_date('setup/docker-befehle.md') }}
- [Dependencies](setup/dependencies.md) - Zuletzt geändert: {{ file_modified_date('setup/dependencies.md') }}

---

## ⚠️ Limitierungen

### File System vs. Git

**File System Timestamps:**
- ✅ Funktioniert überall
- ✅ Kein Git erforderlich
- ❌ Zeigt nur letztes Build-Datum (im Docker)
- ❌ Nicht die "echte" Commit-Historie

**Git Timestamps:**
- ✅ Echte Änderungs-Historie
- ✅ Pro Commit-Datum
- ❌ Braucht `.git` Verzeichnis
- ❌ Funktioniert nicht im Docker

### Docker-Besonderheit

Im Docker-Build zeigen die Timestamps:
- **Nicht** das Datum der letzten Datei-Änderung auf deinem PC
- **Sondern** das Datum des Docker-Builds (wann die Datei in den Container kopiert wurde)

**Bedeutet:**  
Alle Dateien haben das gleiche Datum (Build-Datum), nicht ihre individuellen Änderungs-Daten.

**Lösung:**  
Für echte Änderungs-Historie → Manuelles `implemented` Feld im YAML verwenden!

---

## 📊 Zusammenfassung

| Feature | File System | Git | Manuell (YAML) |
|---------|-------------|-----|----------------|
| **Funktioniert im Docker** | ✅ (Build-Datum) | ❌ | ✅ |
| **Echte Änderungs-Historie** | ❌ | ✅ | ✅ |
| **Automatisch aktualisiert** | ✅ | ✅ | ❌ |
| **Aufwand** | Keiner | `.git` kopieren | Manuell pflegen |

**Empfehlung:**
- **Wichtige Docs:** Manuelles `implemented` Feld (genau, zuverlässig)
- **Unwichtige Docs:** `auto_modified_date()` (bequem, automatisch)

---

## 🔄 Migration

### Von manuellem Datum zu Auto-Datum

**Vorher:**
```yaml
---
feature: Mein Feature
implemented: 29.11.2025
---
```

**Nachher:**
```yaml
---
feature: Mein Feature
# implemented entfernt → Fallback zu auto_modified_date()
---
```

### Von Auto-Datum zu manuellem Datum

**Wenn du echte Daten brauchst:**
```yaml
---
feature: Mein Feature
implemented: 29.11.2025    ← Explizit setzen
---
```

---

**Autor:** Jo Zapf  
**Projekt:** EKMP-C4 Architektur-Visualisierungs Stack  
**Zuletzt bearbeitet:** {{ auto_modified_date() }}  
**Version:** 1.0
{% endraw %}
