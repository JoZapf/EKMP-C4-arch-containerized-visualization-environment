# PlantUML Proxy with Global Navigation + Collaboration Client
# nginx acts as reverse proxy to plantuml-server,
# injects navigation + collaboration UI into HTML responses,
# and proxies WebSocket traffic to plantuml-sync.
FROM nginx:stable-alpine

# Copy global navigation files
COPY global-nav.css /usr/share/nginx/html/global-nav.css
COPY global-nav.js /usr/share/nginx/html/global-nav.js

# Copy PlantUML-specific CSS to hide GitHub banner
COPY plantuml-hide.css /usr/share/nginx/html/plantuml-hide.css

# Copy collaboration client
COPY plantuml-proxy/collab-client.js /usr/share/nginx/html/collab-client.js

# Copy nginx configuration
COPY plantuml-proxy/nginx.conf /etc/nginx/conf.d/default.conf

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --spider -q http://127.0.0.1:80/health || exit 1

EXPOSE 80
