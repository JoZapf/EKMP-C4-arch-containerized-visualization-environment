# PlantUML Tools - Benutzeranleitung

**Feature:** Python-basierte Utilities für PlantUML-Diagramme  
**Version:** 1.0  
**Datum:** 27.11.2025

---

## 📖 Übersicht

Die PlantUML Tools erweitern das EMPC4 VIS Stack um leistungsstarke Python-Utilities für die Verarbeitung von PlantUML-Diagrammen.

### Was kann ich damit machen?

- 🔗 **URL-Encoding** - PlantUML-Dateien für URLs encodieren
- 🖼️ **Einzelne Diagramme rendern** - PNG/SVG Export
- 📦 **Batch-Processing** - Alle Diagramme auf einmal verarbeiten
- 🚀 **CI/CD Integration** - Automatische Diagramm-Generierung
- ✅ **Server-Tests** - Verbindung zum PlantUML-Server prüfen

---

## 🚀 Quick Start

### Voraussetzungen

PlantUML-Server muss laufen:

```bash
docker compose up -d plantuml-backend
```

### Tool bauen

```bash
docker compose build plantuml-tools
```

### Erster Test

```bash
docker compose run --rm plantuml-tools test
```

**Erwartete Ausgabe:**
```
Testing connection to http://empc4_plantuml_backend:8080...
✓ PlantUML server is reachable
  Status: 200
  Content-Type: image/png
```

---

## 🎯 Anwendungsfälle

### 1. URL für PlantUML-Diagramm generieren

**Wann:** Du willst ein Diagramm im Browser öffnen oder in Dokumentation verlinken.

```bash
docker compose run --rm plantuml-tools encode repo/c4/beispiel-context.puml
```

**Ausgabe:**
```
Encoded string: SyfFKj2rKt3CoKnELR1Io4ZDoSa70000

PNG URL:
http://empc4_plantuml_backend:8080/uml/png/SyfFKj2rKt3CoKnELR1Io4ZDoSa70000

SVG URL:
http://empc4_plantuml_backend:8080/uml/svg/SyfFKj2rKt3CoKnELR1Io4ZDoSa70000
```

**Nutzen:**
- ✅ Direkt im Browser öffnen
- ✅ In Markdown verlinken
- ✅ In Confluence/Wiki einbinden

---

### 2. Einzelnes Diagramm als Bild exportieren

**Wann:** Du brauchst ein PNG/SVG für Präsentationen oder Dokumentation.

```bash
# PNG (default)
docker compose run --rm plantuml-tools render repo/c4/beispiel-context.puml
```

**Ergebnis:** `repo/c4/beispiel-context.png` wird erstellt

**Optionen:**

=== "SVG (empfohlen)"
    ```bash
    docker compose run --rm plantuml-tools render repo/c4/beispiel-context.puml -f svg
    ```
    **Vorteil:** Bessere Qualität, kleinere Dateigröße

=== "Custom Output"
    ```bash
    docker compose run --rm plantuml-tools render repo/c4/beispiel-context.puml -o output/diagram.png
    ```
    **Vorteil:** Freie Wahl des Ausgabeorts

=== "Text-Format"
    ```bash
    docker compose run --rm plantuml-tools render repo/c4/beispiel-context.puml -f txt
    ```
    **Vorteil:** ASCII-Art Darstellung

---

### 3. Alle Diagramme in einem Verzeichnis rendern

**Wann:** Du hast viele `.puml` Dateien und willst alle auf einmal exportieren.

```bash
docker compose run --rm plantuml-tools batch repo/c4
```

**Ausgabe:**
```
Found 3 PlantUML file(s)
  beispiel-context.puml → beispiel-context.png... ✓
  beispiel-container.puml → beispiel-container.png... ✓
  beispiel-component.puml → beispiel-component.png... ✓

Completed: 3 successful, 0 failed
```

**Erweiterte Optionen:**

=== "SVG statt PNG"
    ```bash
    docker compose run --rm plantuml-tools batch repo/c4 -f svg
    ```

=== "Eigenes Output-Verzeichnis"
    ```bash
    docker compose run --rm plantuml-tools batch repo/c4 -o repo/assets/c4
    ```
    **Nutzen:** Bilder getrennt von Quellen speichern

=== "Rekursiv (mit Unterverzeichnissen)"
    ```bash
    docker compose run --rm plantuml-tools batch repo/c4 --recursive
    ```

---

### 4. CI/CD: Automatische Diagramm-Generierung

**Wann:** Bei jedem Git-Push sollen Diagramme automatisch aktualisiert werden.

**GitHub Actions Beispiel:**

```yaml
name: Generate Diagrams

on:
  push:
    paths:
      - 'repo/c4/*.puml'

jobs:
  render:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start PlantUML
        run: docker compose up -d plantuml-backend
      
      - name: Wait for server
        run: sleep 10
      
      - name: Generate Diagrams
        run: docker compose run --rm plantuml-tools batch repo/c4 -o repo/assets/c4
      
      - name: Commit & Push
        run: |
          git config user.name "GitHub Actions"
          git add repo/assets/c4/*.png
          git commit -m "Auto-generate diagrams" || exit 0
          git push
```

**GitLab CI Beispiel:**

```yaml
generate-diagrams:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker compose up -d plantuml-backend
    - sleep 10
    - docker compose run --rm plantuml-tools batch repo/c4 -o assets/
  artifacts:
    paths:
      - assets/*.png
```

---

## 📋 Befehlsreferenz

### encode

**Zweck:** Encodiert PlantUML-Datei für URL-Nutzung

**Syntax:**
```bash
docker compose run --rm plantuml-tools encode <datei.puml>
```

**Beispiel:**
```bash
docker compose run --rm plantuml-tools encode repo/c4/beispiel-context.puml
```

**Ausgabe:**
- Encoded String
- PNG URL
- SVG URL

**Verwendung:** URLs in Browser öffnen, in Dokumentation einbinden

---

### render

**Zweck:** Rendert einzelnes Diagramm als Bild

**Syntax:**
```bash
docker compose run --rm plantuml-tools render <datei.puml> [Optionen]
```

**Optionen:**

| Option | Beschreibung | Beispiel |
|--------|--------------|----------|
| `-f, --format` | Ausgabeformat (png/svg/txt) | `-f svg` |
| `-o, --out` | Ausgabedatei | `-o output/diagram.png` |

**Beispiele:**

```bash
# PNG (default)
docker compose run --rm plantuml-tools render diagram.puml

# SVG
docker compose run --rm plantuml-tools render diagram.puml -f svg

# Custom Output
docker compose run --rm plantuml-tools render diagram.puml -o images/diagram.png
```

---

### batch

**Zweck:** Rendert alle `.puml` Dateien in einem Verzeichnis

**Syntax:**
```bash
docker compose run --rm plantuml-tools batch <verzeichnis> [Optionen]
```

**Optionen:**

| Option | Beschreibung | Beispiel |
|--------|--------------|----------|
| `-f, --format` | Ausgabeformat (png/svg) | `-f svg` |
| `-o, --out-dir` | Ausgabeverzeichnis | `-o output/` |
| `-r, --recursive` | Unterverzeichnisse einschließen | `--recursive` |

**Beispiele:**

```bash
# Alle Dateien in repo/c4/
docker compose run --rm plantuml-tools batch repo/c4

# SVG statt PNG
docker compose run --rm plantuml-tools batch repo/c4 -f svg

# Custom Output-Verzeichnis
docker compose run --rm plantuml-tools batch repo/c4 -o repo/assets/c4

# Mit Unterverzeichnissen
docker compose run --rm plantuml-tools batch repo/c4 --recursive
```

---

### test

**Zweck:** Testet Verbindung zum PlantUML-Server

**Syntax:**
```bash
docker compose run --rm plantuml-tools test
```

**Erfolgreiche Ausgabe:**
```
Testing connection to http://empc4_plantuml_backend:8080...
✓ PlantUML server is reachable
  Status: 200
  Content-Type: image/png
  Image size: 1234 bytes
```

**Fehlerhafte Ausgabe:**
```
✗ Connection failed: Connection refused
```

**Lösung bei Fehler:**
```bash
# Starte PlantUML-Server
docker compose up -d plantuml-backend

# Warte kurz
sleep 5

# Test erneut
docker compose run --rm plantuml-tools test
```

---

## 💡 Tipps & Tricks

### Tipp 1: Alias für häufige Befehle

Erstelle in deiner `.bashrc` oder `.zshrc`:

```bash
alias puml-encode='docker compose run --rm plantuml-tools encode'
alias puml-render='docker compose run --rm plantuml-tools render'
alias puml-batch='docker compose run --rm plantuml-tools batch'
```

**Nutzung:**
```bash
puml-encode repo/c4/beispiel-context.puml
puml-batch repo/c4 -f svg
```

---

### Tipp 2: SVG für bessere Qualität

SVG-Diagramme sind:
- ✅ Verlustfrei skalierbar
- ✅ Kleinere Dateigröße
- ✅ Bessere Qualität in Dokumentation

**Immer verwenden:**
```bash
docker compose run --rm plantuml-tools batch repo/c4 -f svg
```

---

### Tipp 3: Ausgabe-Verzeichnis trennen

**Best Practice:** Trenne Quellen (`.puml`) von generierten Bildern

```bash
# Struktur:
repo/
├── c4/              # Quell-Diagramme (.puml)
└── assets/
    └── c4/          # Generierte Bilder (.png/.svg)
```

**Befehl:**
```bash
docker compose run --rm plantuml-tools batch repo/c4 -o repo/assets/c4
```

**In .gitignore:**
```
repo/assets/c4/*.png
repo/assets/c4/*.svg
```

---

### Tipp 4: Pre-Commit Hook

Automatisches Rendern vor jedem Commit:

**`.git/hooks/pre-commit`:**
```bash
#!/bin/bash

echo "Generating PlantUML diagrams..."
docker compose run --rm plantuml-tools batch repo/c4 -o repo/assets/c4 -f svg

if [ $? -ne 0 ]; then
    echo "❌ Diagram generation failed!"
    exit 1
fi

echo "✓ Diagrams generated"
git add repo/assets/c4/
```

```bash
chmod +x .git/hooks/pre-commit
```

---

## 🐛 Troubleshooting

### Problem: "Container empc4_plantuml_backend not running"

**Ursache:** PlantUML-Server nicht gestartet

**Lösung:**
```bash
docker compose up -d plantuml-backend
docker compose run --rm plantuml-tools test
```

---

### Problem: "Server returned status 404"

**Ursache:** Falsche PlantUML-URL (veraltet)

**Lösung:** Rebuild des Tools mit aktueller Version
```bash
docker compose build --no-cache plantuml-tools
```

---

### Problem: "No .puml files found"

**Ursache:** Falsches Verzeichnis oder keine `.puml` Dateien

**Lösung:**
```bash
# Prüfe Verzeichnisinhalt
ls repo/c4/*.puml

# Verwende korrekten Pfad
docker compose run --rm plantuml-tools batch repo/c4
```

---

### Problem: Rendering dauert sehr lange

**Ursache:** Große/komplexe Diagramme oder langsamer Server

**Lösungen:**

1. **PLANTUML_LIMIT_SIZE erhöhen:**
   ```bash
   # In .env
   PLANTUML_LIMIT_SIZE=16384
   
   # Container neu starten
   docker compose restart plantuml-backend
   ```

2. **SVG statt PNG (schneller):**
   ```bash
   docker compose run --rm plantuml-tools batch repo/c4 -f svg
   ```

3. **Diagramme vereinfachen:**
   - Weniger Elemente
   - Aufteilen in mehrere Diagramme

---

## 📚 Weitere Ressourcen

- **Technische Implementierung:** [PlantUML Tools - Implementierung](plantuml-tools-implementation.md)
- **PlantUML Beispiele:** [PlantUML Anwendungsbeispiele](../examples/plantuml.md)
- **C4-Diagramme:** [C4-Anwendungsbeispiele](../examples/c4.md)
- **Docker Compose Referenz:** [Docker Befehle](../setup/docker-befehle.md)

---

## ❓ FAQ

**Q: Muss ich Python lokal installieren?**  
A: Nein! Die Tools laufen vollständig in Docker-Containern.

**Q: Kann ich die Tools auch ohne Docker nutzen?**  
A: Ja, mit dem lokalen Script: `python scripts/plantuml_encode.py`

**Q: Werden die generierten Bilder committed?**  
A: Das ist deine Entscheidung. Für Dokumentation: Ja. Für große Diagramme: Lieber in CI/CD generieren.

**Q: Funktioniert das auch mit anderen PlantUML-Diagrammen?**  
A: Ja! Alle PlantUML-Diagrammtypen werden unterstützt (nicht nur C4).

**Q: Kann ich die Tools in meiner eigenen Anwendung nutzen?**  
A: Ja! Siehe [Technische Implementierung](plantuml-tools-implementation.md) für Details.

---

**Version:** 1.0  
**Status:** ✅ Produktionsbereit  
**Support:** [GitHub Issues](https://github.com/JoZapf/EKMP-C4-arch-containerized-visualization-environment/issues)
