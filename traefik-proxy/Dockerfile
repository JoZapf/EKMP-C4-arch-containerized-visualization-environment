# Traefik Dashboard Proxy with Global Navigation
# nginx acts as reverse proxy to Traefik Dashboard and injects navigation
FROM nginx:stable-alpine

# Copy global navigation CSS (shared)
COPY global-nav.css /usr/share/nginx/html/global-nav.css

# Copy Traefik-specific navigation JS (uses absolute URLs to arch.local)
COPY traefik-proxy/global-nav.js /usr/share/nginx/html/global-nav.js

# Copy nginx configuration
COPY traefik-proxy/nginx.conf /etc/nginx/conf.d/default.conf

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --spider -q http://127.0.0.1:80/health || exit 1

EXPOSE 80
