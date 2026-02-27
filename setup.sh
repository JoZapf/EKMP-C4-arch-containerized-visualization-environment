#!/usr/bin/env bash
# ==============================================================================
# EKMP-C4 Architecture Visualization Environment - Setup Script (Bash)
# ==============================================================================
# Repository : https://github.com/JoZapf/EKMP-C4-arch-containerized-visualization-environment
# License    : MIT
# Author     : Jo Zapf
# Since      : November 2025
# Updated    : February 2026
# ==============================================================================
# This script prepares the environment for first-time deployment on Linux/macOS.
# It checks prerequisites, creates required directories, validates the
# configuration, and starts all Docker services.
# ==============================================================================

set -e  # Exit on error

# --- Helper Functions --------------------------------------------------------

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
ok()      { echo -e "${GREEN}[  OK]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()     { echo -e "${RED}[ ERR]${NC} $1"; }

# Detect docker compose command (V2 preferred)
detect_compose() {
    if docker compose version &>/dev/null; then
        echo "docker compose"
    elif command -v docker-compose &>/dev/null; then
        echo "docker-compose"
    else
        echo ""
    fi
}

# Read a value from .env file (simple key=value parser)
env_val() {
    local key="$1" default="$2"
    if [[ -f .env ]]; then
        local val
        val=$(grep -E "^${key}=" .env 2>/dev/null | head -1 | cut -d'=' -f2- | xargs)
        [[ -n "$val" ]] && echo "$val" && return
    fi
    echo "$default"
}

# --- Main Script -------------------------------------------------------------

echo ""
echo -e "${CYAN}======================================================================${NC}"
echo -e "${CYAN}  EKMP-C4 Architecture Visualization Environment - Setup${NC}"
echo -e "${CYAN}  Platform: Linux / macOS (Bash)${NC}"
echo -e "${CYAN}======================================================================${NC}"
echo ""

# ---- 1. Prerequisites -------------------------------------------------------

info "Checking prerequisites..."

# Docker
if ! command -v docker &>/dev/null; then
    err "Docker is not installed!"
    echo "  Install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
ok "Docker found: $(docker --version)"

# Docker Compose
COMPOSE=$(detect_compose)
if [[ -z "$COMPOSE" ]]; then
    err "Docker Compose is not installed!"
    echo "  Install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi
ok "Docker Compose found: $($COMPOSE version 2>/dev/null || $COMPOSE --version 2>/dev/null)"

# Git (optional)
if command -v git &>/dev/null; then
    ok "Git found: $(git --version)"
else
    warn "Git not found - optional but recommended for version control"
fi

echo ""

# ---- 2. Environment Configuration -------------------------------------------

info "Checking .env configuration..."

if [[ ! -f .env ]]; then
    if [[ -f .env.example ]]; then
        warn ".env not found - creating from .env.example"
        cp .env.example .env
        ok ".env created"
        echo ""
        warn "IMPORTANT: Review and adjust .env for your environment!"
        echo "  At minimum, set ARCH_BASE_DOMAIN to your hostname."
        echo ""
    else
        err ".env.example not found - cannot create .env"
        echo "  Make sure you are running this script from the project root."
        exit 1
    fi
else
    ok ".env already exists"
fi

# Read configuration values
DOMAIN=$(env_val "ARCH_BASE_DOMAIN" "arch.local")
HTTP_PORT=$(env_val "HTTP_PORT" "80")
TRAEFIK_PORT=$(env_val "TRAEFIK_DASHBOARD_PORT" "9090")

info "Configuration: ARCH_BASE_DOMAIN=$DOMAIN  HTTP_PORT=$HTTP_PORT  TRAEFIK_DASHBOARD_PORT=$TRAEFIK_PORT"

# ---- 3. Directory Structure --------------------------------------------------

info "Checking directory structure..."

REQUIRED_DIRS=(
    "repo/docs"
    "repo/c4"
    "repo/assets/excalidraw"
    "dashboard/dist"
    "scripts"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [[ ! -d "$dir" ]]; then
        warn "Directory '$dir' missing - creating..."
        mkdir -p "$dir"
        ok "Created $dir"
    fi
done

ok "Directory structure complete"
echo ""

# ---- 4. Hosts File -----------------------------------------------------------

info "Checking /etc/hosts for '$DOMAIN'..."

if grep -q "$DOMAIN" /etc/hosts 2>/dev/null; then
    ok "'$DOMAIN' found in /etc/hosts"
else
    warn "'$DOMAIN' not found in /etc/hosts"
    echo ""
    echo "  Add this line to /etc/hosts:"
    echo ""
    echo -e "    ${YELLOW}127.0.0.1    $DOMAIN${NC}"
    echo ""

    read -rp "  Add it now? (requires sudo) [y/N]: " response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        if echo "127.0.0.1    $DOMAIN" | sudo tee -a /etc/hosts >/dev/null; then
            ok "'$DOMAIN' added to /etc/hosts"
        else
            err "Could not modify /etc/hosts"
        fi
    else
        warn "Skipped - please add the entry manually"
    fi
fi

echo ""

# ---- 5. Port Availability Check ----------------------------------------------

info "Checking port availability..."

PYTHON_CMD=""
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
fi

if [[ -n "$PYTHON_CMD" ]] && [[ -f "scripts/empc4_port_check.py" ]]; then
    if $PYTHON_CMD -c "import psutil" 2>/dev/null; then
        info "Running port check..."

        if $PYTHON_CMD scripts/empc4_port_check.py --suggest-fixes; then
            ok "All required ports available"
        else
            err "Port conflicts detected!"
            echo ""
            echo "  Options:"
            echo "    1. Change ports in .env (e.g. HTTP_PORT=8080)"
            echo "    2. Stop conflicting services/containers"
            echo ""
            read -rp "  Continue anyway? [y/N]: " response
            if [[ ! "$response" =~ ^[Yy]$ ]]; then
                err "Setup aborted"
                exit 1
            fi
            warn "Continuing despite port conflicts..."
        fi
    else
        warn "psutil not installed - port check skipped"
        echo "  Install with: pip install psutil"
    fi
else
    warn "Python or port check script not found - port check skipped"
fi

echo ""

# ---- 6. Running Container Check ---------------------------------------------

info "Checking for running containers..."

if $COMPOSE ps -q 2>/dev/null | grep -q .; then
    warn "Containers are already running!"
    read -rp "  Restart containers? [y/N]: " response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        info "Stopping containers..."
        $COMPOSE down
        ok "Containers stopped"
    fi
fi

# ---- 7. Pull & Build --------------------------------------------------------

info "Pulling base images..."
$COMPOSE pull --ignore-buildable
ok "Base images pulled"

info "Building custom images..."
$COMPOSE build
ok "Custom images built"

# ---- 8. Start Services ------------------------------------------------------

echo ""
info "Starting services..."
$COMPOSE up -d

echo ""
ok "All services started!"

# ---- 9. Wait for Initialization ----------------------------------------------

info "Waiting for services to initialize (15s)..."
sleep 15

# ---- 10. Service Status ------------------------------------------------------

info "Service status:"
echo ""
$COMPOSE ps
echo ""

# ---- 11. Connectivity Tests --------------------------------------------------

info "Testing service connectivity..."

declare -A SERVICES=(
    ["Dashboard"]="http://${DOMAIN}"
    ["Documentation"]="http://${DOMAIN}/docs"
    ["PlantUML Editor"]="http://${DOMAIN}/plantuml"
    ["Excalidraw"]="http://${DOMAIN}/whiteboard"
    ["Mermaid Live"]="http://${DOMAIN}/mermaid"
    ["Kroki"]="http://${DOMAIN}/kroki"
    ["Traefik Dashboard"]="http://localhost:${TRAEFIK_PORT}"
)

# Ordered service names for consistent output
SERVICE_ORDER=(
    "Dashboard"
    "Documentation"
    "PlantUML Editor"
    "Excalidraw"
    "Mermaid Live"
    "Kroki"
    "Traefik Dashboard"
)

for name in "${SERVICE_ORDER[@]}"; do
    url="${SERVICES[$name]}"
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")

    if [[ "$http_code" =~ ^(200|301|302)$ ]]; then
        ok "$name reachable: $url"
    else
        warn "$name not reachable: $url (may still be initializing)"
    fi
done

# ---- 12. Summary -------------------------------------------------------------

echo ""
echo -e "${CYAN}======================================================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${CYAN}======================================================================${NC}"
echo ""
echo -e "${CYAN}  Services:${NC}"
echo ""
echo "    Dashboard:          http://${DOMAIN}"
echo "    Documentation:      http://${DOMAIN}/docs"
echo "    PlantUML Editor:    http://${DOMAIN}/plantuml"
echo "    Excalidraw:         http://${DOMAIN}/whiteboard"
echo "    Mermaid Live:       http://${DOMAIN}/mermaid"
echo "    Kroki:              http://${DOMAIN}/kroki"
echo "    Traefik Dashboard:  http://localhost:${TRAEFIK_PORT}"
echo ""
echo -e "${CYAN}  Useful commands:${NC}"
echo ""
echo "    Status:             $COMPOSE ps"
echo "    Logs:               $COMPOSE logs -f"
echo "    Stop:               $COMPOSE down"
echo "    Restart:            $COMPOSE restart"
echo "    Rebuild:            $COMPOSE up -d --build"
echo ""
echo -e "${CYAN}  Documentation:${NC}"
echo ""
echo "    README:             README.md"
echo "    Changelog:          CHANGELOG.md"
echo "    Architecture docs:  repo/docs/"
echo "    C4 diagrams:        repo/c4/"
echo ""
echo -e "${CYAN}======================================================================${NC}"
