---
feature: Metadaten-System Test
version: 1.0
status: ✅ TEST
implemented: 30.11.2025
---

{% include "_templates/feature-header.md" %}

# Metadaten-System Test

## Test 1: Projekt-Variablen

Projekt-Name: {{ project.name_short }}

Autor: {{ project.author }}

## Test 2: YAML Werte

Feature: {{ page.meta.feature }}

Status: {{ page.meta.status }}

## Test 3: File-Referenz

Docker-Befehle Datum: {{ file_modified_date('setup/docker-befehle.md') }}

---

**Ende des Tests**
