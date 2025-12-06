---
feature: Metadaten-System Live-Beispiel
version: 1.0
status: ✅ PRODUKTIV
implemented: 30.11.2025
---

**Projekt:** {{ project.name_short }}  
**Feature:** {{ page.meta.feature }}  
**Implementiert:** {{ page.meta.implemented }}  
**Version:** {{ page.meta.version }}  
**Status:** {{ page.meta.status }}

---

# Metadaten-System Live-Beispiel

Diese Seite zeigt wie das **Metadaten-System** funktioniert!

---

## 📊 Automatische Projekt-Variablen

Diese Werte kommen aus `mkdocs.yml`:

- **Projekt-Name:** {{ project.name }}
- **Projekt-Name (kurz):** {{ project.name_short }}
- **Projekt-Abkürzung:** {{ project.name_abbr }}
- **Autor:** {{ project.author }}
- **Projekt-Version:** {{ project.version }}
- **Projekt-Status:** {{ project.status }}

---

## 📝 YAML Front Matter Werte

Diese Werte kommen aus dem YAML-Block am Anfang:

- **Feature:** {{ page.meta.feature }}
- **Version:** {{ page.meta.version }}
- **Status:** {{ page.meta.status }}
- **Implementiert:** {{ page.meta.implemented }}

---

## 📂 File-Macros (funktionieren!)

Referenzen zu anderen Dateien:

- **Docker-Befehle:** {{ file_modified_date('setup/docker-befehle.md') }} ({{ file_size('setup/docker-befehle.md') }})
- **Dashboard Health-Check:** {{ file_modified_date('setup/dashboard-health-check.md') }} ({{ file_size('setup/dashboard-health-check.md') }})

---

**Autor:** {{ project.author }}  
**Projekt:** {{ project.name_short }}
