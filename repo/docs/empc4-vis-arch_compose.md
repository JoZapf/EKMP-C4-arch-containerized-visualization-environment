# EMPC4 Visualisation Stack – Compose-Entwurf (`empc4-vis-arch_compose.md`)

Dieses Dokument beschreibt einen **Entwurf** für eine `docker-compose.yml`, die den EMPC4 VIS Stack bereitstellt.  
Ziel: ein **lokal oder im Intranet betreibbares Setup** zur Visualisierung von Architektur und komplexen Inhalten mit **PlantUML (inkl. C4-PlantUML)**, **Mermaid-Doku** und **Excalidraw**, ergänzt durch einen **Dashboard-Service** und optional **C4 Builder**.

> **Hinweis:**  
> - Die hier gezeigte Compose-Datei ist ein **Skelett** und muss an Umgebung, Pfade, DNS, TLS und Security-Anforderungen angepasst werden.  
> - Platzhalter wie `YOUR_DOMAIN`, `YOUR_REPO_PATH` oder `YOUR_SECRET` sind zu ersetzen.


## 1. Verzeichnisstruktur (Beispiel)

Angenommene lokale Struktur:

```text
/empc4-vis/
  ├─ docker-compose.yml          # Ziel-Datei, aus diesem Entwurf abgeleitet
  ├─ .env                        # Umgebungsvariablen (Domains, Ports, Secrets)
  └─ repo/                       # Architektur-/Doku-Repository (Git-Clone)
       ├─ docs/                  # Markdown, Mermaid, generierte HTML-Seiten
       ├─ c4/                    # PlantUML + C4-PlantUML-Definitionen
       └─ assets/                # Bilder, Excalidraw-Exports etc.
```

Die folgenden Beispiele gehen davon aus, dass `./repo` in mehrere Services als Volume eingebunden wird.


## 2. Beispiel `.env`

```bash
# Basis-Domain oder Hostname
ARCH_BASE_DOMAIN=arch.local

# Standard-Ports (können bei Bedarf angepasst werden)
HTTP_PORT=80
HTTPS_PORT=443

# Optionale Secrets / Tokens
BASIC_AUTH_USER=admin
BASIC_AUTH_PASSWORD=changeme

# Pfad zum lokalen Architektur-Repo (relativ zur docker-compose.yml)
ARCH_REPO_PATH=./repo
```


## 3. Compose-Skelett (Entwurf)

```yaml
version: "3.9"

services:
  reverse-proxy:
    image: traefik:v2.11
    container_name: empc4_reverse_proxy
    command:
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:${HTTP_PORT}"
      # Optional HTTPS/TLS:
      # - "--entrypoints.websecure.address=:${HTTPS_PORT}"
      # - "--certificatesresolvers.le.acme.httpchallenge=true"
      # - "--certificatesresolvers.le.acme.httpchallenge.entrypoint=web"
      # - "--certificatesresolvers.le.acme.email=you@example.com"
      # - "--certificatesresolvers.le.acme.storage=/letsencrypt/acme.json"
    ports:
      - "${HTTP_PORT}:80"
      # - "${HTTPS_PORT}:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      # - "./data/letsencrypt:/letsencrypt"
    networks:
      - empc4_net

  dashboard:
    image: nginx:stable-alpine
    container_name: empc4_dashboard
    volumes:
      # Statisches Dashboard (HTML/JS/CSS) liegt z. B. in ./dashboard/dist
      - ./dashboard/dist:/usr/share/nginx/html:ro
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host(`${ARCH_BASE_DOMAIN}`) && PathPrefix(`/`)"
      - "traefik.http.routers.dashboard.entrypoints=web"
      # Optional Basic Auth (Middleware):
      # - "traefik.http.middlewares.dashboard-auth.basicauth.users=${BASIC_AUTH_USER}:${BASIC_AUTH_PASSWORD_HASH}"
      # - "traefik.http.routers.dashboard.middlewares=dashboard-auth"
    networks:
      - empc4_net

  plantuml:
    image: plantuml/plantuml-server:jetty
    container_name: empc4_plantuml
    environment:
      # Optional: Java-Optionen oder andere Tuning-Variablen
      # PLANTUML_LIMIT_SIZE: 8192
      # JAVA_OPTS: "-Xmx512m"
    volumes:
      # Architektur-Repo read-only einbinden
      - "${ARCH_REPO_PATH}:/repo:ro"
      # Optional: separater Pfad für C4-PlantUML-Stdlib, falls nicht im Repo
      # - ./c4-plantuml:/c4-plantuml:ro
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.plantuml.rule=Host(`${ARCH_BASE_DOMAIN}`) && PathPrefix(`/plantuml`)"
      - "traefik.http.routers.plantuml.entrypoints=web"
      - "traefik.http.services.plantuml.loadbalancer.server.port=8080"
      # Optional: StripPrefix-Middleware, um /plantuml aus der URL zu entfernen
      # - "traefik.http.middlewares.plantuml-stripprefix.stripprefix.prefixes=/plantuml"
      # - "traefik.http.routers.plantuml.middlewares=plantuml-stripprefix"
    networks:
      - empc4_net

  docs:
    # Beispiel: MkDocs mit Material-Theme als Basis
    image: squidfunk/mkdocs-material:latest
    container_name: empc4_docs
    working_dir: /docs
    volumes:
      # Repo mit mkdocs.yml + docs/ + assets/ etc.
      - "${ARCH_REPO_PATH}:/docs"
    command: >
      sh -c "mkdocs serve -a 0.0.0.0:8000"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.docs.rule=Host(`${ARCH_BASE_DOMAIN}`) && PathPrefix(`/docs`)"
      - "traefik.http.routers.docs.entrypoints=web"
      - "traefik.http.services.docs.loadbalancer.server.port=8000"
      # Optional: Prefix-Stripping analog zur PlantUML-Config
    networks:
      - empc4_net

  excalidraw:
    image: excalidraw/excalidraw:latest
    container_name: empc4_excalidraw
    environment:
      # Beispielhafte Optionen – an tatsächliche Excalidraw-Variante anpassen
      - NODE_ENV=production
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.excalidraw.rule=Host(`${ARCH_BASE_DOMAIN}`) && PathPrefix(`/whiteboard`)"
      - "traefik.http.routers.excalidraw.entrypoints=web"
      - "traefik.http.services.excalidraw.loadbalancer.server.port=80"
    networks:
      - empc4_net

  # Optional: C4 Builder – als Helper-Container (z. B. in CI)
  c4builder:
    image: node:lts
    container_name: empc4_c4builder
    working_dir: /work
    volumes:
      - "${ARCH_REPO_PATH}:/work"
    # Beispielkommando: C4 Builder global installieren und Build ausführen
    command: >
      sh -c "npm install -g c4builder && c4builder build"
    # Kein traefik-Label, da typischerweise nicht als Webservice exponiert
    networks:
      - empc4_net
    # Optional: Im normalen Betrieb 'scale: 0' oder 'profiles: ["ci"]'

networks:
  empc4_net:
    driver: bridge
```


## 4. Abhängigkeiten & Zusammenspiel

### 4.1 Reverse Proxy

- Abhängig von:
  - Docker-Socket (`/var/run/docker.sock`) zur dynamischen Konfiguration.
- Bietet Routing für:
  - `dashboard`, `plantuml`, `docs`, `excalidraw`.

### 4.2 Dashboard

- Statische Dateien, unabhängig von anderen Services, **aber**:
  - Links und ggf. Healthchecks referenzieren URIs von
    - `plantuml`
    - `docs`
    - `excalidraw`
  - Konfiguration (z. B. Basis-URLs) idealerweise über `.env`/ENV-Variablen oder ein kleines Config-JSON.

### 4.3 PlantUML

- Nutzt:
  - PlantUML-Server-Jetty-Container
  - Optionale C4-PlantUML-Stdlib (im Repo enthalten oder gesondert)
- Wird genutzt von:
  - Entwickler-Workstations (IDE-Plugins, Browser)
  - CI-/Build-Jobs (Bildgenerierung)
  - Docs-/Mermaid-Service (Einbettung gerenderter Diagramme)

### 4.4 Docs-/Mermaid-Service

- Abhängig von:
  - `ARCH_REPO_PATH` (enthält mkdocs.yml, `docs/`, Mermaid-Diagramme, PlantUML-Bilder)
- Basiert auf:
  - MkDocs (oder einem alternativen Static-Site-Generator) mit Mermaid-Unterstützung.
- Liefert:
  - Zentrale Architektur-Dokumentation unter `/docs`.

### 4.5 Excalidraw

- Unabhängig von den anderen Services – keine harte Abhängigkeit.
- Optionaler Dateiaustausch:
  - Excalidraw-Exports können manuell oder per Script in `repo/assets/` abgelegt werden.

### 4.6 C4 Builder (optional)

- Abhängig von:
  - Architektur-Repo (`ARCH_REPO_PATH`)
  - Node-Paket `c4builder` (im Container installiert)
- Output:
  - Generierte HTML/PDF-Dokumentation in einem Unterverzeichnis (z. B. `/work/site`)
- Integration:
  - `docs`-Service kann dieses Verzeichnis ausliefern (z. B. durch Anpassung von mkdocs oder durch einen zweiten Static-Server).


## 5. Nächste Schritte / Anpassungshinweise

1. **Images verifizieren und ggf. austauschen**  
   - Prüfen, ob die verwendeten Images (z. B. `excalidraw/excalidraw`, `squidfunk/mkdocs-material`, `plantuml/plantuml-server:jetty`) den gewünschten Funktionsumfang bieten.

2. **Konkrete Doku-Toolchain festlegen**  
   - Entscheidung: MkDocs, Docusaurus, oder ein anderes System?
   - Mermaid-Integration überprüfen (Plugins, Config).

3. **C4-PlantUML & C4 Builder einbinden**  
   - C4-PlantUML in `repo/c4/` halten und in `.puml`-Dateien per `!include` verwenden.
   - C4 Builder-Konfiguration (Input/Output-Pfade) konkretisieren.

4. **Dashboard implementieren**  
   - Einfaches Kacheldesign mit Links:
     - `/` → Übersicht
     - `/docs` → Architektur-Doku
     - `/plantuml` → PlantUML-Server
     - `/whiteboard` → Excalidraw
   - Optional: kleine Admin-Ansicht mit Anzeige von ENV-Werten & Healthchecks.

5. **Security & Auth**  
   - TLS/TLS-Setup finalisieren (Let's Encrypt, interne CA, o. Ä.).
   - Zugriffssteuerung definieren (Basic Auth, SSO, OAuth2-Proxy etc.).

---

Dieses Dokument stellt einen **Compose-Entwurf** dar. Die endgültige `docker-compose.yml` sollte aus diesem Skelett abgeleitet, an Infrastruktur- und Sicherheitsanforderungen angepasst und in das Architektur-Repository versioniert werden.
