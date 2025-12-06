# Multi-Stage Dockerfile for Mermaid Live Editor
# Stage 1: Build with custom base path
FROM node:20-alpine AS builder

WORKDIR /app

# Install git, build dependencies, and pnpm
RUN apk add --no-cache git python3 make g++ && \
    npm install -g pnpm

# Clone Mermaid Live Editor (latest stable)
RUN git clone --depth 1 --branch master https://github.com/mermaid-js/mermaid-live-editor.git .

# Install dependencies with pnpm
RUN pnpm install --frozen-lockfile

# Configure base path for /mermaid routing
# Check original config
RUN echo "=== Original svelte.config.js ===" && cat svelte.config.js && echo "=== End ==="

# Replace svelte.config.js with version that has /mermaid base path
# IMPORTANT: base must be '/mermaid' because SvelteKit needs to generate assets with this prefix
# Traefik will NOT use StripPrefix, so nginx receives requests at /mermaid
RUN cat > svelte.config.js << 'EOF'
import adapter from '@sveltejs/adapter-static';
import { sveltePreprocess } from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [sveltePreprocess({})],
  kit: {
    alias: {
      '$/*': './src/lib/*'
    },
    paths: {
      base: '/mermaid'
    },
    adapter: adapter({
      pages: 'docs',
      fallback: '404.html'
    })
  }
};

export default config;
EOF

# Verify the modification
RUN echo "=== Modified svelte.config.js ===" && cat svelte.config.js && echo "=== End ==="

# Build for production with base path
ENV NODE_ENV=production
RUN pnpm run build

# Verify the build was configured correctly
RUN echo "=== Build completed with base path /mermaid ==="

# Verify build output exists and find the correct directory
RUN echo "=== Checking for build output ===" && \
    ls -la /app/ && \
    echo "=== Checking common build directories ===" && \
    (test -d /app/build && echo "Found: /app/build" && ls -la /app/build) || echo "Not found: /app/build" && \
    (test -d /app/.svelte-kit/output && echo "Found: /app/.svelte-kit/output" && ls -la /app/.svelte-kit/output) || echo "Not found: /app/.svelte-kit/output" && \
    (test -d /app/dist && echo "Found: /app/dist" && ls -la /app/dist) || echo "Not found: /app/dist"

# Create a unified build output directory
# adapter-static outputs to 'pages' directory (default 'build', but Mermaid uses 'docs')
RUN mkdir -p /app/final-build && \
    if [ -d /app/docs ]; then \
        echo "Using /app/docs (adapter-static pages directory)" && cp -r /app/docs/. /app/final-build/; \
    elif [ -d /app/build ]; then \
        echo "Using /app/build" && cp -r /app/build/. /app/final-build/; \
    elif [ -d /app/dist ]; then \
        echo "Using /app/dist" && cp -r /app/dist/. /app/final-build/; \
    else \
        echo "ERROR: Could not find build output (checked: docs, build, dist)" && exit 1; \
    fi && \
    echo "=== Final build directory ===" && ls -la /app/final-build

# Stage 2: Serve with nginx
FROM nginx:stable-alpine

# Copy global navigation files and ad-hide CSS
COPY global-nav.css /tmp/global-nav.css
COPY global-nav.js /tmp/global-nav.js
COPY mermaid-save-override.js /tmp/mermaid-save-override.js
COPY mermaid-load-button.js /tmp/mermaid-load-button.js
COPY mermaid-debug.js /tmp/mermaid-debug.js
COPY mermaid-ad-hide.css /tmp/mermaid-ad-hide.css

# Copy built files from builder stage into /mermaid subdirectory
COPY --from=builder /app/final-build /usr/share/nginx/html/mermaid

# Copy global navigation files and ad-hide CSS into mermaid directory
RUN cp /tmp/global-nav.css /usr/share/nginx/html/mermaid/ && \
    cp /tmp/global-nav.js /usr/share/nginx/html/mermaid/ && \
    cp /tmp/mermaid-save-override.js /usr/share/nginx/html/mermaid/ && \
    cp /tmp/mermaid-load-button.js /usr/share/nginx/html/mermaid/ && \
    cp /tmp/mermaid-debug.js /usr/share/nginx/html/mermaid/ && \
    cp /tmp/mermaid-ad-hide.css /usr/share/nginx/html/mermaid/ && \
    rm /tmp/global-nav.* /tmp/mermaid-*.js /tmp/mermaid-ad-hide.css

# Inject global navigation and ad-hide CSS into index.html
RUN sed -i 's|</head>|    <link rel="stylesheet" href="/mermaid/global-nav.css">\n    <link rel="stylesheet" href="/mermaid/mermaid-ad-hide.css">\n    </head>|' \
    /usr/share/nginx/html/mermaid/index.html && \
    sed -i 's|</body>|    <script src="/mermaid/global-nav.js"></script>\n    <script src="/mermaid/mermaid-debug.js"></script>\n    <script src="/mermaid/mermaid-save-override.js"></script>\n    <script src="/mermaid/mermaid-load-button.js"></script>\n</body>|' \
    /usr/share/nginx/html/mermaid/index.html

# Verify injection
RUN grep -q "global-nav.css" /usr/share/nginx/html/mermaid/index.html && \
    grep -q "global-nav.js" /usr/share/nginx/html/mermaid/index.html && \
    grep -q "mermaid-save-override.js" /usr/share/nginx/html/mermaid/index.html && \
    grep -q "mermaid-load-button.js" /usr/share/nginx/html/mermaid/index.html && \
    echo "✓ All scripts successfully injected" || \
    echo "✗ Injection FAILED"

# Copy nginx configuration
COPY ./mermaid-live/nginx.conf /etc/nginx/conf.d/default.conf

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --spider -q http://127.0.0.1:80/mermaid/ || exit 1

EXPOSE 80
