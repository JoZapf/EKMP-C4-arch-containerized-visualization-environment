---
feature: Metadaten-System - Finale Lösung
version: 1.0
status: ✅ FUNKTIONIERT
implemented: 30.11.2025
---

**Projekt:** {{ project.name_short }}  
**Feature:** {{ page.meta.feature }}  
**Implementiert:** {{ page.meta.implemented }}  
**Version:** {{ page.meta.version }}  
**Status:** {{ page.meta.status }}

---

# Metadaten-System - Finale Lösung

## 📊 Welche Daten sind automatisch?

| Was | Quelle | Status |
|-----|--------|--------|
| **Projekt-Name** | `mkdocs.yml` | ✅ Automatisch |
| **Autor** | `mkdocs.yml` | ✅ Automatisch |
| **Feature-Name** | YAML Front Matter | 📝 Manuell |
| **Version** | YAML Front Matter | 📝 Manuell |
| **Status** | YAML Front Matter | 📝 Manuell |
| **Implementiert** | YAML Front Matter | 📝 Manuell |
| **Datum ANDERER Dateien** | Filesystem (mtime) | ✅ Automatisch |

**Was sind "andere Dateien"?**  
Du kannst das Bearbeitungsdatum von **Datei B** anzeigen, während du **Datei A** bearbeitest. Zum Beispiel: In `dashboard-health-check.md` kannst du schreiben `{{ "{{" }} file_modified_date('setup/docker-befehle.md') {{ "}}" }}` um zu zeigen wann die Docker-Befehle zuletzt geändert wurden. Was NICHT funktioniert: Das Datum der AKTUELLEN Datei automatisch auslesen (verursacht Rekursion).

---

## 🎯 Das funktioniert!

**Problem erkannt:**
- Template-Includes → Rekursion ❌
- Macros die auf page.meta zugreifen → Rekursion ❌

**Lösung:**
- **Direkte Variablen** verwenden → Funktioniert! ✅

---

## ✅ So verwendest du es:

### Feature-Dokumentation

Kopiere diesen Block:

```
---
feature: Mein Feature
version: 1.0
status: ✅ PRODUKTIV
implemented: 30.11.2025
---

**Projekt:** {{ "{{" }} project.name_short {{ "}}" }}  
**Feature:** {{ "{{" }} page.meta.feature {{ "}}" }}  
**Implementiert:** {{ "{{" }} page.meta.implemented {{ "}}" }}  
**Version:** {{ "{{" }} page.meta.version {{ "}}" }}  
**Status:** {{ "{{" }} page.meta.status {{ "}}" }}

---

# Mein Feature

Inhalt...
```

### Standard-Dokumentation

```
**Projekt:** {{ "{{" }} project.name {{ "}}" }}  
**Autor:** {{ "{{" }} project.author {{ "}}" }}

---

# Meine Doku

Inhalt...
```

---

## 📊 Verfügbare Variablen

### Projekt-Variablen (aus mkdocs.yml)

| Variable | Wert |
|----------|------|
| `{{ "{{" }} project.name {{ "}}" }}` | {{ project.name }} |
| `{{ "{{" }} project.name_short {{ "}}" }}` | {{ project.name_short }} |
| `{{ "{{" }} project.name_abbr {{ "}}" }}` | {{ project.name_abbr }} |
| `{{ "{{" }} project.author {{ "}}" }}` | {{ project.author }} |
| `{{ "{{" }} project.version {{ "}}" }}` | {{ project.version }} |
| `{{ "{{" }} project.status {{ "}}" }}` | {{ project.status }} |

### Page-Variablen (aus YAML Front Matter)

| Variable | Wert |
|----------|------|
| `{{ "{{" }} page.meta.feature {{ "}}" }}` | {{ page.meta.feature }} |
| `{{ "{{" }} page.meta.version {{ "}}" }}` | {{ page.meta.version }} |
| `{{ "{{" }} page.meta.status {{ "}}" }}` | {{ page.meta.status }} |
| `{{ "{{" }} page.meta.implemented {{ "}}" }}` | {{ page.meta.implemented }} |

### File-Macros (funktionieren!)

| Macro | Beispiel |
|-------|----------|
| `{{ "{{" }} file_modified_date('pfad/datei.md') {{ "}}" }}` | {{ file_modified_date('setup/docker-befehle.md') }} |
| `{{ "{{" }} file_size('pfad/datei.md') {{ "}}" }}` | {{ file_size('setup/docker-befehle.md') }} |

---

## 🎯 Gewinn

**Vorher (manuell):**
- ~150 Zeichen tippen
- Projekt-Name in jeder Datei
- Inkonsistente Formatierung

**Nachher (automatisch):**
- ~90 Zeichen tippen
- Projekt-Name zentral in mkdocs.yml
- Garantiert konsistente Formatierung

**Ersparnis:** ~40%  
**Plus:** Projekt-Name zentral änderbar!

---

## 📝 Template zum Kopieren

```markdown
---
feature: FEATURE_NAME
version: 1.0
status: ✅ PRODUKTIV
implemented: DD.MM.YYYY
---

**Projekt:** {{ "{{" }} project.name_short {{ "}}" }}  
**Feature:** {{ "{{" }} page.meta.feature {{ "}}" }}  
**Implementiert:** {{ "{{" }} page.meta.implemented {{ "}}" }}  
**Version:** {{ "{{" }} page.meta.version {{ "}}" }}  
**Status:** {{ "{{" }} page.meta.status {{ "}}" }}

---

# FEATURE_NAME

## Übersicht

...
```

---

**Zuletzt aktualisiert:** 30.11.2025  
**Autor:** {{ project.author }}  
**Projekt:** {{ project.name_short }}
