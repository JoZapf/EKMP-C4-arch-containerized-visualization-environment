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

# Copy collaboration client (legacy, textarea-based)
COPY plantuml-proxy/collab-client.js /usr/share/nginx/html/collab-client.js

# Copy collaboration control (opt-in for Monaco sync.js)
# MUST be loaded in HEAD after socket.io but BEFORE sync.js
COPY plantuml-proxy/collab-control.js /usr/share/nginx/html/collab-control.js

# Socket.IO client library - in IIFE einwickeln damit Monaco's AMD-Loader nicht die define()-Funktion
# kapert und window.io nicht gesetzt wird (UMD erkennt define.amd und nutzt AMD statt global)
RUN wget -q -O /tmp/socket.io.min.js \
    https://cdn.jsdelivr.net/npm/socket.io-client@4/dist/socket.io.min.js && \
    echo '(function(){var _def=window.define;window.define=undefined;' > /usr/share/nginx/html/socket.io.min.js && \
    cat /tmp/socket.io.min.js >> /usr/share/nginx/html/socket.io.min.js && \
    echo 'window.define=_def;})();' >> /usr/share/nginx/html/socket.io.min.js && \
    rm /tmp/socket.io.min.js

# Copy nginx configuration
COPY plantuml-proxy/nginx.conf /etc/nginx/conf.d/default.conf

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --spider -q http://127.0.0.1:80/health || exit 1

EXPOSE 80
