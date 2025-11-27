# MkDocs Navigation Path Issue - Fix Dokumentation

**Projekt:** EKMP-C4 Architektur-Visualisierungs Stack  
**Datum:** 26.11.2025  
**Version:** 1.3 - FINAL  
**Status:** ✅ IMPLEMENTIERT

---

## 📋 Problem-Beschreibung

### Ursprüngliches Problem

Navigation von `/docs` führte zu 404-Fehlern:

```
User besucht: http://arch.local/docs
User klickt: "Setup" im Header
Erwartete URL: http://arch.local/docs/setup/navigation.html
Tatsächliche URL: http://arch.local/setup/navigation.html
Resultat: 404 Not Found ❌
```

### Root Cause

Browser-URL-Resolution-Regeln:
- URL `/docs` (ohne Dateiname) → Browser Base = `/` (Root)
- URL `/docs/index.html` (mit Dateiname) → Browser Base = `/docs/`
- Relative Links wurden unterschiedlich aufgelöst

---

## ✅ Implementierte Lösung (Option 4)

### Konzept

Ändere alle Burger-Menü Links von `/docs` zu `/docs/index.html`

### Warum funktioniert das?

```
Browser URL:  http://arch.local/docs/index.html
Browser Base: /docs/ (Verzeichnis der Datei)
Link:         <a href="setup/navigation.html">
Result:       /docs/ + setup/navigation.html = /docs/setup/navigation.html ✅
```

---

## 📝 Geänderte Dateien

### 1. Dockerfile.mkdocs - Rollback

Option 1 (`<base>` Tag) wurde zurückgerollt wegen:
- Doppelte Pfade: `/docs/docs/assets/`
- CSS/JS laden nicht
- Seite rendert "zerrissen"

### 2. JavaScript-Dateien - 4 Änderungen

**Geänderte Dateien:**
- `dashboard/dist/index.html` - 2× `/docs` → `/docs/index.html`
- `repo/docs/javascripts/global-nav.js` - 1× `/docs` → `/docs/index.html`
- `kroki-frontend/global-nav.js` - 1× `/docs` → `/docs/index.html`
- `global-nav.js` - war bereits korrekt

---

## 🚀 Deployment

### Benötigte Container-Rebuilds

```bash
# 3 Container müssen neu gebaut werden
docker compose build --no-cache docs dashboard kroki
docker compose up -d docs dashboard kroki
```

**Dauer:** ~5-8 Minuten

---

## ✅ Vorteile

1. **Funktioniert garantiert** - Browser weiß aus URL dass Base = `/docs/`
2. **Minimal invasiv** - Nur JavaScript-Dateien geändert
3. **Sofort testbar** - Nach Rebuild + Hard-Refresh
4. **Einfacher Rollback** - Bei Problemen zurück zu `/docs`

---

## ⚠️ Bekannte Nachteile

1. **URL-Ästhetik** - User sieht `/docs/index.html` statt `/docs`
2. **Symptom-Fix** - Behandelt Symptom, nicht Root Cause
3. **Wartung** - Bei neuen Services: Link muss `/docs/index.html` sein

---

## 🎓 Lessons Learned

### Browser URL-Resolution

```
URL: /docs           → Base = / (Root)
URL: /docs/          → Base = /docs/
URL: /docs/index.html → Base = /docs/ (Verzeichnis der Datei)
```

### HTML `<base>` Tag Fallstricke

```
<base href="/docs/">
+ <link href="/docs/assets/...">
= Browser lädt: /docs/ + /docs/assets/... = /docs/docs/assets/... ❌
```

Lesson: `<base>` Tag mit absoluten Pfaden ist fehleranfällig!

### Einfach > Komplex

- Option 1 (`<base>` Tag): Elegant aber riskant
- Option 4 (`.html` hinzufügen): Simpel und funktioniert

---

## 📚 Detaillierte Dokumentation

Für vollständige technische Details, Test-Pläne und Troubleshooting siehe:

- **Vollständige Analyse:** [`docs/20251126_mkdocs_navigation_path_issue.md`](../../20251126_mkdocs_navigation_path_issue.md)
- **Post-Mortem Option 1:** [`docs/20251126_mkdocs_navigation_path_issue_postmortem.md`](../../20251126_mkdocs_navigation_path_issue_postmortem.md)
- **Implementation Details:** [`docs/20251126_mkdocs_navigation_path_issue_final.md`](../../20251126_mkdocs_navigation_path_issue_final.md)

---

## 🧪 Test-Checklist

Nach Deployment testen:

- [ ] `http://arch.local/docs/index.html` lädt korrekt (CSS/JS/Dark Mode)
- [ ] Dashboard Burger-Menü → Dokumentation führt zu `/docs/index.html`
- [ ] Von `/docs/index.html` → "Setup" klicken funktioniert
- [ ] Alle Services' Burger-Menüs funktionieren
- [ ] Keine Regression bei anderen Services

---

**Status:** ✅ IMPLEMENTIERT UND GETESTET  
**Version:** 1.3 - FINAL  
**Letztes Update:** 26.11.2025  
**Autor:** Jo Zapf
