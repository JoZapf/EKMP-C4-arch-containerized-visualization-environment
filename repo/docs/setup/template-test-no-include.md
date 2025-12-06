---
feature: Template Test
version: 1.0
status: ✅ TEST
implemented: 30.11.2025
---

# Template Test - Ohne Include

## Variablen die im Template verwendet werden:

Projekt: {{ project.name_short }}

Feature: {{ page.meta.feature }}

Implementiert: {{ page.meta.implemented }}

Version: {{ page.meta.version }}

Status: {{ page.meta.status }}

---

**Das sind die gleichen Variablen wie im Template, aber OHNE include!**
