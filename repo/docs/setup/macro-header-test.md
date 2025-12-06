---
feature: Macro Header Test
version: 1.0
status: ✅ TEST
implemented: 30.11.2025
---

{{ feature_header() }}

# Macro Header Test

Diese Seite verwendet das **feature_header() Macro** statt Template-Include!

## Wie funktioniert's?

**Statt:**
```
{% include "_templates/feature-header.md" %}
```

**Verwende:**
```
{{ feature_header() }}
```

## Vorteile

✅ Keine Rekursion  
✅ Funktioniert mit mkdocs-macros  
✅ Gleiche Automatisierung  

---

**Das war's!**
