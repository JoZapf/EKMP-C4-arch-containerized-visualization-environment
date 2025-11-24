#!/bin/bash

# EMPC4 VIS Stack - Setup Script
# Dieses Script bereitet die Umgebung für den ersten Start vor

set -e  # Exit bei Fehlern

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktionen für farbigen Output
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Header
echo "======================================================================"
echo "  EMPC4 VIS Stack - Setup Script"
echo "======================================================================"
echo ""

# 1. Prüfe Voraussetzungen
info "Prüfe Voraussetzungen..."

# Docker prüfen
if ! command -v docker &> /dev/null; then
    error "Docker ist nicht installiert!"
    echo "Installiere Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
success "Docker gefunden: $(docker --version)"

# Docker Compose prüfen
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    error "Docker Compose ist nicht installiert!"
    echo "Installiere Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi
if command -v docker-compose &> /dev/null; then
    success "Docker Compose gefunden: $(docker-compose --version)"
else
    success "Docker Compose gefunden: $(docker compose version)"
fi

# 2. Erstelle .env wenn nicht vorhanden
info "Prüfe .env Datei..."
if [ ! -f .env ]; then
    warning ".env nicht gefunden - erstelle aus .env.example"
    cp .env.example .env
    success ".env erstellt"
    info "WICHTIG: Passe .env an deine Umgebung an!"
else
    success ".env bereits vorhanden"
fi

# 3. Prüfe Verzeichnisstruktur
info "Prüfe Verzeichnisstruktur..."

DIRS=("repo/docs" "repo/c4" "repo/assets/excalidraw" "dashboard/dist" "data/letsencrypt")

for dir in "${DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        warning "Verzeichnis $dir nicht gefunden - erstelle..."
        mkdir -p "$dir"
        success "$dir erstellt"
    fi
done

success "Verzeichnisstruktur vollständig"

# 4. Prüfe /etc/hosts Eintrag
info "Prüfe /etc/hosts für arch.local..."

if grep -q "arch.local" /etc/hosts; then
    success "arch.local in /etc/hosts gefunden"
else
    warning "arch.local nicht in /etc/hosts gefunden"
    echo ""
    echo "Füge folgenden Eintrag zu /etc/hosts hinzu:"
    echo ""
    echo "    127.0.0.1    arch.local"
    echo ""
    echo "Befehl (benötigt sudo):"
    echo "    echo '127.0.0.1    arch.local' | sudo tee -a /etc/hosts"
    echo ""

    read -p "Soll ich das jetzt machen? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if echo "127.0.0.1    arch.local" | sudo tee -a /etc/hosts > /dev/null; then
            success "arch.local zu /etc/hosts hinzugefügt"
        else
            error "Konnte arch.local nicht zu /etc/hosts hinzufügen"
        fi
    else
        warning "Übersprungen - bitte manuell hinzufügen!"
    fi
fi

# 5. Prüfe ob Container bereits laufen
info "Prüfe laufende Container..."

if docker-compose ps 2>/dev/null | grep -q "Up" || docker compose ps 2>/dev/null | grep -q "running"; then
    warning "Container laufen bereits!"
    read -p "Soll ich die Container neu starten? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info "Stoppe Container..."
        docker-compose down 2>/dev/null || docker compose down
        success "Container gestoppt"
    fi
fi

# 6. Pull Images
info "Lade Docker Images..."
if command -v docker-compose &> /dev/null; then
    docker-compose pull
else
    docker compose pull
fi
success "Images geladen"

# 7. Starte Services
info "Starte Services..."
echo ""
if command -v docker-compose &> /dev/null; then
    docker-compose up -d
else
    docker compose up -d
fi

echo ""
success "Services gestartet!"

# 8. Warte auf Services
info "Warte auf Service-Initialisierung..."
sleep 10

# 9. Prüfe Service-Status
info "Prüfe Service-Status..."
echo ""

if command -v docker-compose &> /dev/null; then
    docker-compose ps
else
    docker compose ps
fi

echo ""

# 10. Teste Erreichbarkeit
info "Teste Service-Erreichbarkeit..."

SERVICES=(
    "http://arch.local|Dashboard"
    "http://arch.local/docs|Dokumentation"
    "http://arch.local/plantuml|PlantUML"
    "http://arch.local/whiteboard|Excalidraw"
    "http://localhost:8080|Traefik Dashboard"
)

for service in "${SERVICES[@]}"; do
    IFS='|' read -r url name <<< "$service"

    if curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" | grep -q "200\|301\|302"; then
        success "$name erreichbar: $url"
    else
        warning "$name nicht erreichbar: $url (kann noch initialisieren)"
    fi
done

# 11. Zusammenfassung
echo ""
echo "======================================================================"
echo "  Setup abgeschlossen!"
echo "======================================================================"
echo ""
echo "Zugriff auf Services:"
echo ""
echo "  🏠 Dashboard:       http://arch.local"
echo "  📚 Dokumentation:   http://arch.local/docs"
echo "  🎨 PlantUML:        http://arch.local/plantuml"
echo "  ✏️  Whiteboard:      http://arch.local/whiteboard"
echo "  🔧 Traefik:         http://localhost:8080"
echo ""
echo "Nützliche Befehle:"
echo ""
echo "  Status anzeigen:    docker-compose ps"
echo "  Logs anzeigen:      docker-compose logs -f"
echo "  Services stoppen:   docker-compose down"
echo "  Services neustarten: docker-compose restart"
echo ""
echo "Weitere Informationen:"
echo ""
echo "  📖 Runbook:         runbook.md"
echo "  📝 Dokumentation:   repo/docs/"
echo "  🎨 C4-Diagramme:    repo/c4/"
echo ""
echo "======================================================================"
