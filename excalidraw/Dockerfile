# Multi-Stage Dockerfile for Excalidraw
# Stage 1: Build Excalidraw from source
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install git and build dependencies
RUN apk add --no-cache git python3 make g++

# Clone Excalidraw repository
# Pin to specific stable version
RUN git clone --depth 1 --branch v0.17.6 https://github.com/excalidraw/excalidraw.git .

# Install dependencies
RUN yarn install --frozen-lockfile --network-timeout 600000

# Build for production
ENV NODE_ENV=production
ENV REACT_APP_DISABLE_SENTRY=true
ENV REACT_APP_DISABLE_TRACKING=true

# Build with Vite base path for correct asset paths when running under /whiteboard/
# Vite uses --base option (not PUBLIC_URL like Create React App)
RUN yarn vite build --base=/whiteboard/ --outDir=build --emptyOutDir

# Stage 2: Serve with nginx
FROM nginx:stable-alpine

# Copy global navigation files
COPY global-nav.css /tmp/global-nav.css
COPY global-nav.js /tmp/global-nav.js

# Copy built files from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy global navigation files into root directory
RUN cp /tmp/global-nav.css /usr/share/nginx/html/ && \
    cp /tmp/global-nav.js /usr/share/nginx/html/ && \
    rm /tmp/global-nav.*

# Inject global navigation into index.html
RUN sed -i 's|</head>|    <link rel="stylesheet" href="/whiteboard/global-nav.css">\n    </head>|' \
    /usr/share/nginx/html/index.html && \
    sed -i 's|</body>|    <script src="/whiteboard/global-nav.js"></script>\n</body>|' \
    /usr/share/nginx/html/index.html

# Verify injection
RUN grep -q "global-nav.css" /usr/share/nginx/html/index.html && \
    grep -q "global-nav.js" /usr/share/nginx/html/index.html && \
    echo "✓ Global navigation successfully injected" || \
    echo "✗ Global navigation injection FAILED"

# Copy nginx configuration
COPY ./excalidraw/nginx.conf /etc/nginx/conf.d/default.conf

# Add healthcheck (use 127.0.0.1 to force IPv4)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --spider -q http://127.0.0.1:80/ || exit 1

# Expose port
EXPOSE 80

# nginx will be started automatically by the base image
