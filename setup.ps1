# EKMP-C4 ARCHITEKTUR VISUALISIERUNGS STACK - Setup Script (PowerShell)
# Dieses Script bereitet die Umgebung für den ersten Start vor (Windows)

# Setze Error Action
$ErrorActionPreference = "Stop"

# Funktionen für farbigen Output
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Header
Write-Host "======================================================================"
Write-Host "  EMPC4 VIS Stack - Setup Script (Windows)"
Write-Host "======================================================================"
Write-Host ""

# 1. Prüfe Voraussetzungen
Write-Info "Prüfe Voraussetzungen..."

# Docker prüfen
try {
    $dockerVersion = docker --version
    Write-Success "Docker gefunden: $dockerVersion"
} catch {
    Write-Error-Custom "Docker ist nicht installiert!"
    Write-Host "Installiere Docker Desktop: https://docs.docker.com/desktop/install/windows-install/"
    exit 1
}

# Docker Compose prüfen
try {
    $composeVersion = docker-compose --version
    Write-Success "Docker Compose gefunden: $composeVersion"
} catch {
    try {
        $composeVersion = docker compose version
        Write-Success "Docker Compose gefunden: $composeVersion"
    } catch {
        Write-Error-Custom "Docker Compose ist nicht installiert!"
        exit 1
    }
}

# 2. Erstelle .env wenn nicht vorhanden
Write-Info "Prüfe .env Datei..."
if (-not (Test-Path ".env")) {
    Write-Warning ".env nicht gefunden - erstelle aus .env.example"
    Copy-Item ".env.example" ".env"
    Write-Success ".env erstellt"
    Write-Info "WICHTIG: Passe .env an deine Umgebung an!"
} else {
    Write-Success ".env bereits vorhanden"
}

# 3. Prüfe Verzeichnisstruktur
Write-Info "Prüfe Verzeichnisstruktur..."

$dirs = @(
    "repo\docs",
    "repo\c4",
    "repo\assets\excalidraw",
    "dashboard\dist",
    "data\letsencrypt"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        Write-Warning "Verzeichnis $dir nicht gefunden - erstelle..."
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Success "$dir erstellt"
    }
}

Write-Success "Verzeichnisstruktur vollständig"

# 4. Prüfe hosts-Datei
Write-Info "Prüfe hosts-Datei für arch.local..."

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$hostsContent = Get-Content $hostsPath -ErrorAction SilentlyContinue

if ($hostsContent -match "arch.local") {
    Write-Success "arch.local in hosts-Datei gefunden"
} else {
    Write-Warning "arch.local nicht in hosts-Datei gefunden"
    Write-Host ""
    Write-Host "Füge folgenden Eintrag zur hosts-Datei hinzu:"
    Write-Host ""
    Write-Host "    127.0.0.1    arch.local"
    Write-Host ""
    Write-Host "Datei: $hostsPath"
    Write-Host ""

    $response = Read-Host "Soll ich das jetzt machen? (erfordert Admin-Rechte) (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        try {
            # Prüfe Admin-Rechte
            $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

            if ($isAdmin) {
                Add-Content -Path $hostsPath -Value "`n127.0.0.1    arch.local"
                Write-Success "arch.local zu hosts-Datei hinzugefügt"
            } else {
                Write-Error-Custom "Keine Admin-Rechte! Starte PowerShell als Administrator."
                Write-Host ""
                Write-Host "Manuell hinzufügen:"
                Write-Host "1. Öffne PowerShell als Administrator"
                Write-Host "2. Führe aus: Add-Content -Path '$hostsPath' -Value '`n127.0.0.1    arch.local'"
                Write-Host ""
            }
        } catch {
            Write-Error-Custom "Konnte arch.local nicht zu hosts-Datei hinzufügen: $_"
        }
    } else {
        Write-Warning "Übersprungen - bitte manuell hinzufügen!"
    }
}

# 5. Port-Check (falls verfügbar)
Write-Info "Prüfe Port-Verfügbarkeit..."

# Prüfe ob Python verfügbar ist
$pythonCmd = $null
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    $pythonCmd = "python3"
}

if ($pythonCmd) {
    # Prüfe ob psutil verfügbar ist
    $psutilCheck = & $pythonCmd -c "import psutil" 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Info "Führe Port-Check aus..."
        
        # Führe Port-Check Script aus
        & $pythonCmd scripts/empc4_port_check.py --suggest-fixes
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Alle Ports verfügbar"
        } else {
            Write-Error-Custom "Port-Konflikte gefunden!"
            Write-Host ""
            Write-Warning "Löse die Port-Konflikte bevor du die Container startest."
            Write-Host "Tipps:"
            Write-Host "  1. Ändere Ports in .env (z.B. HTTP_PORT=8080)"
            Write-Host "  2. Stoppe belegende Services/Container"
            Write-Host ""
            $response = Read-Host "Trotzdem fortfahren? (y/N)"
            if ($response -ne "y" -and $response -ne "Y") {
                Write-Error-Custom "Setup abgebrochen"
                exit 1
            }
            Write-Warning "Fahre fort trotz Port-Konflikten..."
        }
    } else {
        Write-Warning "psutil nicht installiert - Port-Check übersprungen"
        Write-Info "Installiere mit: pip install psutil"
    }
} else {
    Write-Warning "Python nicht gefunden - Port-Check übersprungen"
}

Write-Host ""

# 6. Prüfe ob Container bereits laufen
Write-Info "Prüfe laufende Container..."

$runningContainers = docker-compose ps -q 2>$null
if ($runningContainers) {
    Write-Warning "Container laufen bereits!"
    $response = Read-Host "Soll ich die Container neu starten? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Info "Stoppe Container..."
        docker-compose down
        Write-Success "Container gestoppt"
    }
}

# 7. Pull Images
Write-Info "Lade Docker Images..."
try {
    docker-compose pull
} catch {
    docker compose pull
}
Write-Success "Images geladen"

# 8. Starte Services
Write-Info "Starte Services..."
Write-Host ""
try {
    docker-compose up -d
} catch {
    docker compose up -d
}

Write-Host ""
Write-Success "Services gestartet!"

# 9. Warte auf Services
Write-Info "Warte auf Service-Initialisierung..."
Start-Sleep -Seconds 10

# 10. Prüfe Service-Status
Write-Info "Prüfe Service-Status..."
Write-Host ""

try {
    docker-compose ps
} catch {
    docker compose ps
}

Write-Host ""

# 11. Teste Erreichbarkeit
Write-Info "Teste Service-Erreichbarkeit..."

$services = @(
    @{Url="http://arch.local"; Name="Dashboard"},
    @{Url="http://arch.local/docs"; Name="Dokumentation"},
    @{Url="http://arch.local/plantuml"; Name="PlantUML"},
    @{Url="http://arch.local/whiteboard"; Name="Excalidraw"},
    @{Url="http://localhost:8080"; Name="Traefik Dashboard"}
)

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri $service.Url -Method Head -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -in @(200, 301, 302)) {
            Write-Success "$($service.Name) erreichbar: $($service.Url)"
        } else {
            Write-Warning "$($service.Name) nicht erreichbar: $($service.Url) (HTTP $($response.StatusCode))"
        }
    } catch {
        Write-Warning "$($service.Name) nicht erreichbar: $($service.Url) (kann noch initialisieren)"
    }
}

# 12. Zusammenfassung
Write-Host ""
Write-Host "======================================================================"
Write-Host "  Setup abgeschlossen!"
Write-Host "======================================================================"
Write-Host ""
Write-Host "Zugriff auf Services:"
Write-Host ""
Write-Host "  🏠 Dashboard:       http://arch.local"
Write-Host "  📚 Dokumentation:   http://arch.local/docs"
Write-Host "  🎨 PlantUML:        http://arch.local/plantuml"
Write-Host "  ✏️  Whiteboard:      http://arch.local/whiteboard"
Write-Host "  🔧 Traefik:         http://localhost:8080"
Write-Host ""
Write-Host "Nützliche Befehle:"
Write-Host ""
Write-Host "  Status anzeigen:    docker-compose ps"
Write-Host "  Logs anzeigen:      docker-compose logs -f"
Write-Host "  Services stoppen:   docker-compose down"
Write-Host "  Services neustarten: docker-compose restart"
Write-Host ""
Write-Host "Weitere Informationen:"
Write-Host ""
Write-Host "  📖 Runbook:         runbook.md"
Write-Host "  📝 Dokumentation:   repo\docs\"
Write-Host "  🎨 C4-Diagramme:    repo\c4\"
Write-Host ""
Write-Host "======================================================================"
