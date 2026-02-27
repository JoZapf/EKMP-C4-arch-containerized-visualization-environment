# ==============================================================================
# EKMP-C4 Architecture Visualization Environment - Setup Script (PowerShell)
# ==============================================================================
# Repository : https://github.com/JoZapf/EKMP-C4-arch-containerized-visualization-environment
# License    : MIT
# Author     : Jo Zapf
# Since      : November 2025
# Updated    : February 2026
# ==============================================================================
# This script prepares the environment for first-time deployment on Windows.
# It checks prerequisites, creates required directories, validates the
# configuration, and starts all Docker services.
# ==============================================================================

# Halt on errors
$ErrorActionPreference = "Stop"

# --- Helper Functions --------------------------------------------------------

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Ok {
    param([string]$Message)
    Write-Host "[  OK] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Err {
    param([string]$Message)
    Write-Host "[ ERR] $Message" -ForegroundColor Red
}

# Detect docker compose command (V2 preferred)
function Get-ComposeCmd {
    try {
        $null = docker compose version 2>$null
        if ($LASTEXITCODE -eq 0) { return "docker compose" }
    } catch {}
    try {
        $null = docker-compose --version 2>$null
        if ($LASTEXITCODE -eq 0) { return "docker-compose" }
    } catch {}
    return $null
}

# Read a value from .env file (simple key=value parser)
function Get-EnvValue {
    param([string]$Key, [string]$Default)
    if (Test-Path ".env") {
        $match = Select-String -Path ".env" -Pattern "^${Key}=(.+)$" | Select-Object -First 1
        if ($match) {
            return $match.Matches[0].Groups[1].Value.Trim()
        }
    }
    return $Default
}

# --- Main Script -------------------------------------------------------------

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  EKMP-C4 Architecture Visualization Environment - Setup" -ForegroundColor Cyan
Write-Host "  Platform: Windows (PowerShell)" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# ---- 1. Prerequisites -------------------------------------------------------

Write-Info "Checking prerequisites..."

# Docker
try {
    $dockerVersion = (docker --version 2>$null)
    if ($LASTEXITCODE -ne 0) { throw "not found" }
    Write-Ok "Docker found: $dockerVersion"
} catch {
    Write-Err "Docker is not installed!"
    Write-Host "  Install Docker Desktop: https://docs.docker.com/desktop/install/windows-install/"
    exit 1
}

# Docker Compose
$COMPOSE = Get-ComposeCmd
if (-not $COMPOSE) {
    Write-Err "Docker Compose is not installed!"
    Write-Host "  Docker Desktop ships with 'docker compose' (V2) by default."
    exit 1
}
$composeVer = if ($COMPOSE -eq "docker compose") {
    (docker compose version 2>$null)
} else {
    (docker-compose --version 2>$null)
}
Write-Ok "Docker Compose found: $composeVer"

# Git (optional, but useful)
try {
    $gitVersion = (git --version 2>$null)
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Git found: $gitVersion"
    }
} catch {
    Write-Warn "Git not found - optional but recommended for version control"
}

Write-Host ""

# ---- 2. Environment Configuration -------------------------------------------

Write-Info "Checking .env configuration..."

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Warn ".env not found - creating from .env.example"
        Copy-Item ".env.example" ".env"
        Write-Ok ".env created"
        Write-Host ""
        Write-Warn "IMPORTANT: Review and adjust .env for your environment!"
        Write-Host "  At minimum, set ARCH_BASE_DOMAIN to your hostname." -ForegroundColor Yellow
        Write-Host ""
    } else {
        Write-Err ".env.example not found - cannot create .env"
        Write-Host "  Make sure you are running this script from the project root."
        exit 1
    }
} else {
    Write-Ok ".env already exists"
}

# Read configuration values
$DOMAIN = Get-EnvValue -Key "ARCH_BASE_DOMAIN" -Default "arch.local"
$HTTP_PORT = Get-EnvValue -Key "HTTP_PORT" -Default "80"
$TRAEFIK_PORT = Get-EnvValue -Key "TRAEFIK_DASHBOARD_PORT" -Default "9090"

Write-Info "Configuration: ARCH_BASE_DOMAIN=$DOMAIN  HTTP_PORT=$HTTP_PORT  TRAEFIK_DASHBOARD_PORT=$TRAEFIK_PORT"

# ---- 3. Directory Structure --------------------------------------------------

Write-Info "Checking directory structure..."

$requiredDirs = @(
    "repo\docs",
    "repo\c4",
    "repo\assets\excalidraw",
    "dashboard\dist",
    "scripts"
)

foreach ($dir in $requiredDirs) {
    if (-not (Test-Path $dir)) {
        Write-Warn "Directory '$dir' missing - creating..."
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Ok "Created $dir"
    }
}

Write-Ok "Directory structure complete"
Write-Host ""

# ---- 4. Hosts File -----------------------------------------------------------

Write-Info "Checking hosts file for '$DOMAIN'..."

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$hostsContent = Get-Content $hostsPath -ErrorAction SilentlyContinue

if ($hostsContent -match [regex]::Escape($DOMAIN)) {
    Write-Ok "'$DOMAIN' found in hosts file"
} else {
    Write-Warn "'$DOMAIN' not found in hosts file"
    Write-Host ""
    Write-Host "  Add this line to $hostsPath :"
    Write-Host ""
    Write-Host "    127.0.0.1    $DOMAIN" -ForegroundColor Yellow
    Write-Host ""

    $response = Read-Host "  Add it now? (requires admin privileges) [y/N]"
    if ($response -eq "y" -or $response -eq "Y") {
        $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
            [Security.Principal.WindowsBuiltInRole]::Administrator)

        if ($isAdmin) {
            Add-Content -Path $hostsPath -Value "`n127.0.0.1    $DOMAIN"
            Write-Ok "'$DOMAIN' added to hosts file"
        } else {
            Write-Err "No admin privileges! Run PowerShell as Administrator."
            Write-Host "  Manual command:"
            Write-Host "    Add-Content -Path '$hostsPath' -Value '``n127.0.0.1    $DOMAIN'"
        }
    } else {
        Write-Warn "Skipped - please add the entry manually"
    }
}

Write-Host ""

# ---- 5. Port Availability Check ----------------------------------------------

Write-Info "Checking port availability..."

$pythonCmd = $null
if (Get-Command python -ErrorAction SilentlyContinue) { $pythonCmd = "python" }
elseif (Get-Command python3 -ErrorAction SilentlyContinue) { $pythonCmd = "python3" }

if ($pythonCmd -and (Test-Path "scripts/empc4_port_check.py")) {
    $psutilOk = & $pythonCmd -c "import psutil" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Info "Running port check..."
        & $pythonCmd scripts/empc4_port_check.py --suggest-fixes

        if ($LASTEXITCODE -ne 0) {
            Write-Err "Port conflicts detected!"
            Write-Host ""
            Write-Host "  Options:" -ForegroundColor Yellow
            Write-Host "    1. Change ports in .env (e.g. HTTP_PORT=8080)"
            Write-Host "    2. Stop conflicting services/containers"
            Write-Host ""
            $response = Read-Host "  Continue anyway? [y/N]"
            if ($response -ne "y" -and $response -ne "Y") {
                Write-Err "Setup aborted"
                exit 1
            }
            Write-Warn "Continuing despite port conflicts..."
        } else {
            Write-Ok "All required ports available"
        }
    } else {
        Write-Warn "psutil not installed - port check skipped"
        Write-Host "  Install with: pip install psutil"
    }
} else {
    Write-Warn "Python or port check script not found - port check skipped"
}

Write-Host ""

# ---- 6. Running Container Check ---------------------------------------------

Write-Info "Checking for running containers..."

$runningContainers = Invoke-Expression "$COMPOSE ps -q" 2>$null
if ($runningContainers) {
    Write-Warn "Containers are already running!"
    $response = Read-Host "  Restart containers? [y/N]"
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Info "Stopping containers..."
        Invoke-Expression "$COMPOSE down"
        Write-Ok "Containers stopped"
    }
}

# ---- 7. Pull & Build --------------------------------------------------------

Write-Info "Pulling base images..."
Invoke-Expression "$COMPOSE pull --ignore-buildable"
Write-Ok "Base images pulled"

Write-Info "Building custom images..."
Invoke-Expression "$COMPOSE build"
Write-Ok "Custom images built"

# ---- 8. Start Services ------------------------------------------------------

Write-Host ""
Write-Info "Starting services..."
Invoke-Expression "$COMPOSE up -d"

Write-Host ""
Write-Ok "All services started!"

# ---- 9. Wait for Initialization ----------------------------------------------

Write-Info "Waiting for services to initialize (15s)..."
Start-Sleep -Seconds 15

# ---- 10. Service Status ------------------------------------------------------

Write-Info "Service status:"
Write-Host ""
Invoke-Expression "$COMPOSE ps"
Write-Host ""

# ---- 11. Connectivity Tests --------------------------------------------------

Write-Info "Testing service connectivity..."

$services = @(
    @{Name="Dashboard";          Url="http://${DOMAIN}"},
    @{Name="Documentation";      Url="http://${DOMAIN}/docs"},
    @{Name="PlantUML Editor";    Url="http://${DOMAIN}/plantuml"},
    @{Name="Excalidraw";         Url="http://${DOMAIN}/whiteboard"},
    @{Name="Mermaid Live";       Url="http://${DOMAIN}/mermaid"},
    @{Name="Kroki";              Url="http://${DOMAIN}/kroki"},
    @{Name="Traefik Dashboard";  Url="http://localhost:${TRAEFIK_PORT}"}
)

foreach ($svc in $services) {
    try {
        $resp = Invoke-WebRequest -Uri $svc.Url -Method Head -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($resp.StatusCode -in @(200, 301, 302)) {
            Write-Ok "$($svc.Name) reachable: $($svc.Url)"
        } else {
            Write-Warn "$($svc.Name) returned HTTP $($resp.StatusCode): $($svc.Url)"
        }
    } catch {
        Write-Warn "$($svc.Name) not reachable: $($svc.Url) (may still be initializing)"
    }
}

# ---- 12. Summary -------------------------------------------------------------

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Services:" -ForegroundColor Cyan
Write-Host ""
Write-Host "    Dashboard:          http://${DOMAIN}"
Write-Host "    Documentation:      http://${DOMAIN}/docs"
Write-Host "    PlantUML Editor:    http://${DOMAIN}/plantuml"
Write-Host "    Excalidraw:         http://${DOMAIN}/whiteboard"
Write-Host "    Mermaid Live:       http://${DOMAIN}/mermaid"
Write-Host "    Kroki:              http://${DOMAIN}/kroki"
Write-Host "    Traefik Dashboard:  http://localhost:${TRAEFIK_PORT}"
Write-Host ""
Write-Host "  Useful commands:" -ForegroundColor Cyan
Write-Host ""
Write-Host "    Status:             $COMPOSE ps"
Write-Host "    Logs:               $COMPOSE logs -f"
Write-Host "    Stop:               $COMPOSE down"
Write-Host "    Restart:            $COMPOSE restart"
Write-Host "    Rebuild:            $COMPOSE up -d --build"
Write-Host ""
Write-Host "  Documentation:" -ForegroundColor Cyan
Write-Host ""
Write-Host "    README:             README.md"
Write-Host "    Changelog:          CHANGELOG.md"
Write-Host "    Architecture docs:  repo\docs\"
Write-Host "    C4 diagrams:        repo\c4\"
Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
