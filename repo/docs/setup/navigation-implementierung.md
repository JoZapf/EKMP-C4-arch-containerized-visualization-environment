# Navigation - Service-Implementierungen

Detaillierte Anleitungen für die Integration des globalen Hamburger-Menüs in alle Services.

---

## 1. Dashboard (Statisches HTML)

**Methode:** Direktes HTML  
**Komplexität:** ⭐ Sehr einfach  
**Build-Zeit:** Keine (nur Restart)

### Dateibaum

```
dashboard/
├── dist/
│   ├── index.html          # ← Navigation integriert
│   ├── global-nav.css      # ← Kopiert vom Root
│   ├── global-nav.js       # ← Kopiert vom Root
│   ├── styles.css
│   └── script.js
└── src/
    └── ...
```

### Schritt 1: Dateien kopieren

```bash
# Ins Dashboard-Verzeichnis kopieren
cp global-nav.css dashboard/dist/
cp global-nav.js dashboard/dist/
```

### Schritt 2: HTML anpassen

**Datei:** `dashboard/dist/index.html`

```html
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>EMPC4 Dashboard</title>
    
    <!-- Andere CSS -->
    <link rel="stylesheet" href="styles.css">
    
    <!-- Global Navigation CSS -->
    <link rel="stylesheet" href="global-nav.css">
</head>
<body>
    <!-- Dashboard Content -->
    
    <!-- Andere Scripts -->
    <script src="script.js"></script>
    
    <!-- Global Navigation JS -->
    <script src="global-nav.js"></script>
</body>
</html>
```

### Schritt 3: Container neu starten

```bash
docker compose restart dashboard
```

### docker-compose.yml

```yaml
dashboard:
  image: nginx:stable-alpine
  container_name: empc4_dashboard
  volumes:
    - ./dashboard/dist:/usr/share/nginx/html:ro
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.dashboard.rule=Host(`${ARCH_BASE_DOMAIN}`) && PathPrefix(`/`)"
    - "traefik.http.routers.dashboard.priority=1"
  networks:
    - empc4_net
```

**Zugriff:** http://arch.local/

---

## 2. MkDocs Dokumentation (Material Theme)

**Methode:** Build-Zeit via Config  
**Komplexität:** ⭐⭐ Einfach  
**Build-Zeit:** ~2-3 Minuten

### Dateibaum

```
./
├── global-nav.css          # ← Quelle im Root
├── global-nav.js           # ← Quelle im Root
├── Dockerfile.mkdocs       # ← COPY-Befehle
└── repo/
    ├── mkdocs.yml          # ← extra_css, extra_javascript
    └── docs/
        ├── stylesheets/    # Wird beim Build erstellt
        │   └── global-nav.css
        └── javascripts/    # Wird beim Build erstellt
            └── global-nav.js
```

### Schritt 1: Dockerfile.mkdocs

**Datei:** `Dockerfile.mkdocs`

```dockerfile
FROM squidfunk/mkdocs-material:latest

WORKDIR /docs

# Copy global navigation files BEFORE docs/
COPY global-nav.css /docs/docs/stylesheets/
COPY global-nav.js /docs/docs/javascripts/

# Copy documentation source
COPY repo/ /docs/

# Build site
RUN mkdocs build --strict
# ... rest of Dockerfile
```

### Schritt 2: mkdocs.yml

**Datei:** `repo/mkdocs.yml`

```yaml
site_name: EKMP-C4 Architektur-Dokumentation

# ... andere Config ...

extra_css:
  - stylesheets/global-nav.css

extra_javascript:
  - javascripts/global-nav.js
```

### Schritt 3: Build & Deploy

```bash
docker compose build --no-cache docs
docker compose up -d docs
```

**Zugriff:** http://arch.local/docs

---

## 3. Excalidraw (React App)

**Methode:** Build-Zeit sed-Injection  
**Komplexität:** ⭐⭐⭐ Mittel  
**Build-Zeit:** ~8-10 Minuten

### Dateibaum

```
./
├── global-nav.css              # ← Root (Build-Context!)
├── global-nav.js               # ← Root (Build-Context!)
├── docker-compose.yml          # context: . (Root!)
└── excalidraw/
    ├── Dockerfile              # ← Integration hier
    └── nginx.conf
```

### Schritt 1: docker-compose.yml

**WICHTIG:** Build-Context muss Root sein!

```yaml
excalidraw:
  build:
    context: .                      # ← Root als Context!
    dockerfile: ./excalidraw/Dockerfile
  image: empc4-excalidraw:latest
  container_name: empc4_excalidraw
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.excalidraw.rule=PathPrefix(`/whiteboard`)"
    - "traefik.http.middlewares.excalidraw-stripprefix.stripprefix.prefixes=/whiteboard"
    - "traefik.http.routers.excalidraw.middlewares=excalidraw-stripprefix"
  networks:
    - empc4_net
```

### Schritt 2: Dockerfile

**Datei:** `excalidraw/Dockerfile`

```dockerfile
# Stage 1: Build Excalidraw
FROM node:18-alpine AS builder
WORKDIR /app
RUN apk add --no-cache git python3 make g++
RUN git clone --depth 1 --branch v0.17.6 https://github.com/excalidraw/excalidraw.git .
RUN yarn install --frozen-lockfile --network-timeout 600000

ENV NODE_ENV=production
ENV REACT_APP_DISABLE_SENTRY=true
ENV REACT_APP_DISABLE_TRACKING=true

# Build with /whiteboard/ base path
RUN yarn vite build --base=/whiteboard/ --outDir=build --emptyOutDir

# Stage 2: nginx mit Navigation
FROM nginx:stable-alpine

# Copy global navigation (context ist Root!)
COPY global-nav.css /tmp/global-nav.css
COPY global-nav.js /tmp/global-nav.js

# Copy built app
COPY --from=builder /app/build /usr/share/nginx/html

# Install navigation files
RUN cp /tmp/global-nav.css /usr/share/nginx/html/ && \
    cp /tmp/global-nav.js /usr/share/nginx/html/ && \
    rm /tmp/global-nav.*

# Inject navigation into HTML
RUN sed -i 's|</head>|    <link rel="stylesheet" href="/whiteboard/global-nav.css">\n    </head>|' \
    /usr/share/nginx/html/index.html && \
    sed -i 's|</body>|    <script src="/whiteboard/global-nav.js"></script>\n</body>|' \
    /usr/share/nginx/html/index.html

# Verify injection
RUN grep -q "global-nav.css" /usr/share/nginx/html/index.html && \
    echo "✓ Navigation injected" || \
    echo "✗ Navigation FAILED"

# Copy nginx config (Pfad angepasst für Root-Context!)
COPY ./excalidraw/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

### Schritt 3: Build & Deploy

```bash
docker compose build --no-cache excalidraw
docker compose up -d excalidraw
```

### Traefik-Routing

```
Browser: /whiteboard/abc
  ↓ Traefik StripPrefix(/whiteboard)
nginx: /abc
  ↓ Vite baut mit --base=/whiteboard/
HTML: <link href="/whiteboard/global-nav.css">
```

**Zugriff:** http://arch.local/whiteboard

---

## 4. Mermaid Live Editor (SvelteKit)

**Methode:** Build-Zeit sed-Injection  
**Komplexität:** ⭐⭐⭐ Mittel  
**Build-Zeit:** ~10-12 Minuten

### Dateibaum

```
./
├── global-nav.css              # ← Root (Build-Context!)
├── global-nav.js               # ← Root (Build-Context!)
├── docker-compose.yml          # context: . (Root!)
└── mermaid-live/
    ├── Dockerfile              # ← Integration hier
    └── nginx.conf
```

### Schritt 1: docker-compose.yml

```yaml
mermaid-live:
  build:
    context: .                      # ← Root als Context!
    dockerfile: ./mermaid-live/Dockerfile
  image: empc4-mermaid-live:latest
  container_name: empc4_mermaid_live
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.mermaid.rule=PathPrefix(`/mermaid`)"
    # KEIN StripPrefix! SvelteKit baut mit base: '/mermaid'
  networks:
    - empc4_net
```

### Schritt 2: Dockerfile

**Datei:** `mermaid-live/Dockerfile`

```dockerfile
# Stage 1: Build Mermaid
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache git python3 make g++ && npm install -g pnpm
RUN git clone --depth 1 --branch master https://github.com/mermaid-js/mermaid-live-editor.git .
RUN pnpm install --frozen-lockfile

# Configure SvelteKit base path
RUN cat > svelte.config.js << 'EOF'
import adapter from '@sveltejs/adapter-static';
import { sveltePreprocess } from 'svelte-preprocess';

const config = {
  preprocess: [sveltePreprocess({})],
  kit: {
    paths: {
      base: '/mermaid'           // ← WICHTIG!
    },
    adapter: adapter({
      pages: 'docs'
    })
  }
};
export default config;
EOF

ENV NODE_ENV=production
RUN pnpm run build
RUN mkdir -p /app/final-build && cp -r /app/docs/. /app/final-build/

# Stage 2: nginx mit Navigation
FROM nginx:stable-alpine

# Copy global navigation
COPY global-nav.css /tmp/global-nav.css
COPY global-nav.js /tmp/global-nav.js

# Copy built app unter /mermaid/
COPY --from=builder /app/final-build /usr/share/nginx/html/mermaid

# Install navigation
RUN cp /tmp/global-nav.css /usr/share/nginx/html/mermaid/ && \
    cp /tmp/global-nav.js /usr/share/nginx/html/mermaid/ && \
    rm /tmp/global-nav.*

# Inject navigation (Pfade mit /mermaid/)
RUN sed -i 's|</head>|    <link rel="stylesheet" href="/mermaid/global-nav.css">\n    </head>|' \
    /usr/share/nginx/html/mermaid/index.html && \
    sed -i 's|</body>|    <script src="/mermaid/global-nav.js"></script>\n</body>|' \
    /usr/share/nginx/html/mermaid/index.html

# Verify
RUN grep -q "global-nav.css" /usr/share/nginx/html/mermaid/index.html && \
    echo "✓ Navigation injected" || echo "✗ FAILED"

# Copy nginx config
COPY ./mermaid-live/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

### Schritt 3: Build & Deploy

```bash
docker compose build --no-cache mermaid-live
docker compose up -d mermaid-live
```

### Traefik-Routing

```
Browser: /mermaid/abc
  ↓ Traefik (KEIN StripPrefix!)
nginx: /mermaid/abc
  ↓ SvelteKit gebaut mit base: '/mermaid'
HTML: <link href="/mermaid/global-nav.css">
```

**Zugriff:** http://arch.local/mermaid

---

## 5. PlantUML Server (Java App)

**Methode:** Runtime nginx sub_filter  
**Komplexität:** ⭐⭐⭐⭐ Komplex  
**Build-Zeit:** ~1-2 Minuten (nur Proxy)

### Dateibaum

```
./
├── global-nav.css              # ← Root (Build-Context!)
├── global-nav.js               # ← Root (Build-Context!)
├── docker-compose.yml
└── plantuml-proxy/
    ├── Dockerfile              # ← nginx Proxy
    └── nginx.conf              # ← sub_filter Injection
```

### Architektur

```
User → Traefik → plantuml-proxy (nginx) → plantuml-backend (Jetty:8080)
                      ↓
                  sub_filter injiziert
                  global-nav.css/js
```

### Schritt 1: Proxy-Dockerfile

**Datei:** `plantuml-proxy/Dockerfile`

```dockerfile
FROM nginx:stable-alpine

# Copy global navigation
COPY global-nav.css /usr/share/nginx/html/global-nav.css
COPY global-nav.js /usr/share/nginx/html/global-nav.js

# Copy nginx config
COPY plantuml-proxy/nginx.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --spider -q http://127.0.0.1:80/health || exit 1

EXPOSE 80
```

### Schritt 2: nginx.conf mit sub_filter

**Datei:** `plantuml-proxy/nginx.conf`

```nginx
upstream plantuml_backend {
    server plantuml-backend:8080;
}

server {
    listen 80;
    server_name _;

    # Enable sub_filter
    sub_filter_once off;
    
    # Inject CSS before </head>
    sub_filter '</head>' '<link rel="stylesheet" href="/uml/global-nav.css"></head>';
    
    # Inject JS before </body>
    sub_filter '</body>' '<script src="/uml/global-nav.js"></script></body>';
    
    # Remove GitHub banner
    sub_filter '<div>
  <img
    style="display: inline; position: absolute; top: 0; right: 0; border: 0; max-width: 25%;"
    class="no-filter"
    src="assets/github-fork-me.svg"
    alt="Fork me on GitHub"
    usemap="#github-banner"
  />
  <map id="github-banner" name="github-banner" style="cursor: pointer;">
    <area
      shape="poly"
      coords="10,0 50,0 149,100 149,140"
      href="https://github.com/plantuml/plantuml-server"
      alt="Fork me on GitHub"
    />
  </map>
</div>' '';
    
    # Remove promotional text
    sub_filter '<p>Create your <a href="https://plantuml.com">PlantUML</a> diagrams directly in your browser!</p>' '';

    # Serve global navigation files
    location = /uml/global-nav.css {
        alias /usr/share/nginx/html/global-nav.css;
        add_header Content-Type text/css;
    }

    location = /uml/global-nav.js {
        alias /usr/share/nginx/html/global-nav.js;
        add_header Content-Type application/javascript;
    }

    # Health check
    location = /health {
        access_log off;
        return 200 "healthy\n";
    }

    # Proxy to PlantUML backend
    location / {
        proxy_pass http://plantuml_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # WICHTIG: sub_filter braucht buffering!
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
}
```

### Schritt 3: docker-compose.yml

```yaml
# Backend (nicht exponiert)
plantuml-backend:
  image: plantuml/plantuml-server:jetty
  container_name: empc4_plantuml_backend
  environment:
    - PLANTUML_LIMIT_SIZE=8192
    - BASE_URL=uml
  networks:
    - empc4_net

# Proxy (exponiert via Traefik)
plantuml:
  build:
    context: .
    dockerfile: ./plantuml-proxy/Dockerfile
  image: empc4-plantuml-proxy:latest
  container_name: empc4_plantuml_proxy
  depends_on:
    - plantuml-backend
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.plantuml.rule=PathPrefix(`/plantuml`)"
    - "traefik.http.middlewares.plantuml-stripprefix.stripprefix.prefixes=/plantuml"
    - "traefik.http.middlewares.plantuml-addprefix.addprefix.prefix=/uml"
    - "traefik.http.routers.plantuml.middlewares=plantuml-stripprefix,plantuml-addprefix"
  networks:
    - empc4_net
```

### Schritt 4: Build & Deploy

```bash
docker compose build --no-cache plantuml
docker compose up -d plantuml-backend plantuml
```

### Traefik-Routing

```
Browser: /plantuml/abc
  ↓ Traefik StripPrefix(/plantuml) + AddPrefix(/uml)
nginx: /uml/abc
  ↓ sub_filter injiziert
HTML: <link href="/uml/global-nav.css">
  ↓ Proxy
PlantUML Backend: /uml/abc
```

**Zugriff:** http://arch.local/plantuml

---

## 6. Kroki Service (Statisches HTML)

**Methode:** Statisch + Volume-Mount  
**Komplexität:** ⭐ Sehr einfach  
**Build-Zeit:** Keine (nur Restart)

### Dateibaum

```
kroki-frontend/
├── index.html              # ← Navigation integriert
├── global-nav.css          # ← Kopiert
├── global-nav.js           # ← Kopiert
└── nginx.conf              # ← Serve-Config
```

### Schritt 1: Dateien kopieren

```bash
cp global-nav.css kroki-frontend/
cp global-nav.js kroki-frontend/
```

### Schritt 2: HTML anpassen

**Datei:** `kroki-frontend/index.html`

```html
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>Kroki - Universal Diagram Service</title>
    
    <!-- Global Navigation CSS -->
    <link rel="stylesheet" href="/global-nav.css">
    
    <style>
        /* Kroki Styles */
    </style>
</head>
<body>
    <!-- Kroki Content -->
    
    <!-- Global Navigation JS -->
    <script src="/global-nav.js"></script>
</body>
</html>
```

### Schritt 3: nginx.conf

**Datei:** `kroki-frontend/nginx.conf`

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Serve landing page
    location = / {
        try_files /index.html =404;
    }

    # Serve global navigation files
    location = /global-nav.css {
        try_files /global-nav.css =404;
        add_header Content-Type text/css;
    }

    location = /global-nav.js {
        try_files /global-nav.js =404;
        add_header Content-Type application/javascript;
    }

    # Proxy API to Kroki backend
    location / {
        proxy_pass http://kroki-backend:8000;
        proxy_set_header Host $host;
    }
}
```

### Schritt 4: Container neu starten

```bash
docker compose restart kroki
```

### docker-compose.yml

```yaml
kroki:
  image: nginx:stable-alpine
  container_name: empc4_kroki
  volumes:
    - ./kroki-frontend:/usr/share/nginx/html:ro
    - ./kroki-frontend/nginx.conf:/etc/nginx/conf.d/default.conf:ro
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.kroki.rule=PathPrefix(`/kroki`)"
    - "traefik.http.middlewares.kroki-stripprefix.stripprefix.prefixes=/kroki"
  depends_on:
    - kroki-backend
  networks:
    - empc4_net
```

**Zugriff:** http://arch.local/kroki

---

## 7. Traefik Dashboard (Go App)

**Methode:** Runtime nginx sub_filter  
**Komplexität:** ⭐⭐⭐⭐ Komplex  
**Build-Zeit:** ~1 Minute (nur Proxy)

### Dateibaum

```
./
├── global-nav.css              # ← Root (Build-Context!)
├── global-nav.js               # ← Root (Build-Context!)
├── docker-compose.yml
└── traefik-proxy/
    ├── Dockerfile              # ← nginx Proxy
    └── nginx.conf              # ← sub_filter + Websocket
```

### Architektur

```
User (Port 8090) → traefik-dashboard (nginx) → reverse-proxy:8080 (Traefik API)
                        ↓
                    sub_filter injiziert
                    global-nav.css/js
```

### Schritt 1: Proxy-Dockerfile

**Datei:** `traefik-proxy/Dockerfile`

```dockerfile
FROM nginx:stable-alpine

# Copy global navigation
COPY global-nav.css /usr/share/nginx/html/global-nav.css
COPY global-nav.js /usr/share/nginx/html/global-nav.js

# Copy nginx config
COPY traefik-proxy/nginx.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --spider -q http://127.0.0.1:80/health || exit 1

EXPOSE 80
```

### Schritt 2: nginx.conf mit Websocket

**Datei:** `traefik-proxy/nginx.conf`

```nginx
upstream traefik_backend {
    server reverse-proxy:8080;
}

server {
    listen 80;
    server_name _;

    # Enable sub_filter
    sub_filter_once off;
    
    # Inject CSS
    sub_filter '</head>' '<link rel="stylesheet" href="/global-nav.css"></head>';
    
    # Inject JS
    sub_filter '</body>' '<script src="/global-nav.js"></script></body>';

    # Serve global navigation files
    location = /global-nav.css {
        alias /usr/share/nginx/html/global-nav.css;
        add_header Content-Type text/css;
    }

    location = /global-nav.js {
        alias /usr/share/nginx/html/global-nav.js;
        add_header Content-Type application/javascript;
    }

    # Health check
    location = /health {
        access_log off;
        return 200 "healthy\n";
    }

    # Proxy to Traefik Dashboard
    location / {
        proxy_pass http://traefik_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # WICHTIG: Buffering für sub_filter
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
        
        # WICHTIG: Websocket-Support für Live-Updates
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Schritt 3: docker-compose.yml

```yaml
reverse-proxy:
  image: traefik:v2.11
  container_name: empc4_reverse_proxy
  command:
    - "--api.insecure=true"  # Dashboard aktiviert
  ports:
    - "${HTTP_PORT:-80}:80"
    # Port 8080 NICHT mehr exponiert!
  networks:
    - empc4_net

# NEU: Traefik Dashboard mit Navigation
traefik-dashboard:
  build:
    context: .
    dockerfile: ./traefik-proxy/Dockerfile
  image: empc4-traefik-dashboard:latest
  container_name: empc4_traefik_dashboard
  depends_on:
    - reverse-proxy
  ports:
    - "${TRAEFIK_DASHBOARD_PORT:-8090}:80"  # Port 8090!
  networks:
    - empc4_net
  healthcheck:
    test: ["CMD", "wget", "--spider", "-q", "http://127.0.0.1:80/health"]
```

### Schritt 4: Build & Deploy

```bash
docker compose build --no-cache traefik-dashboard
docker compose up -d reverse-proxy traefik-dashboard
```

### Port-Änderung

**Vorher:** `localhost:8080` (direkt)  
**Nachher:** `localhost:8090` (mit Navigation)

**Zugriff:** http://localhost:8090

---

## Zusammenfassung

| Service | Methode | Build-Zeit | Komplexität |
|---------|---------|------------|-------------|
| Dashboard | Statisch | Keine | ⭐ |
| MkDocs | Build-Zeit | ~2-3 min | ⭐⭐ |
| Excalidraw | sed-Injection | ~8-10 min | ⭐⭐⭐ |
| Mermaid | sed-Injection | ~10-12 min | ⭐⭐⭐ |
| PlantUML | sub_filter | ~1-2 min | ⭐⭐⭐⭐ |
| Kroki | Statisch | Keine | ⭐ |
| Traefik | sub_filter | ~1 min | ⭐⭐⭐⭐ |

**Alle Services sind jetzt integriert!** ✅
