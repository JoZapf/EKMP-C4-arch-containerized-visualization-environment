# Automatisches Fix-Skript für Docs-Router-Problem
# Ausführung: .\fix-docs-routing.ps1

param(
    [ValidateSet("restart", "recreate", "full-restart", "diagnose")]
    [string]$Action = "diagnose"
)

Write-Host "=== EMPC4 Docs-Router Fix-Skript ===" -ForegroundColor Cyan
Write-Host "Aktion: $Action" -ForegroundColor Yellow
Write-Host ""

function Show-RouterStatus {
    Write-Host "Aktuelle Router:" -ForegroundColor Yellow
    try {
        $routers = Invoke-RestMethod http://localhost:8080/api/http/routers -ErrorAction Stop
        $docsRouter = $routers | Where-Object {$_.name -like "*docs*"}
        if ($docsRouter) {
            Write-Host "✓ Docs-Router gefunden:" -ForegroundColor Green
            $docsRouter | Format-List name, rule, status, priority
        } else {
            Write-Host "✗ Docs-Router NICHT gefunden" -ForegroundColor Red
            Write-Host "  Verfügbare Router:" -ForegroundColor Gray
            $routers | ForEach-Object { Write-Host "    - $($_.name)" -ForegroundColor Gray }
        }
    } catch {
        Write-Host "✗ Fehler beim Abrufen der Router: $_" -ForegroundColor Red
    }
    Write-Host ""
}

function Show-ContainerStatus {
    Write-Host "Container-Status:" -ForegroundColor Yellow
    docker ps -a --filter "name=empc4_docs" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    Write-Host ""
}

function Show-DocsLogs {
    Write-Host "Docs-Container Logs (letzte 20 Zeilen):" -ForegroundColor Yellow
    docker logs empc4_docs --tail 20 2>&1
    Write-Host ""
}

switch ($Action) {
    "diagnose" {
        Write-Host ">>> Führe Diagnose durch..." -ForegroundColor Cyan
        Write-Host ""

        Show-ContainerStatus
        Show-DocsLogs
        Show-RouterStatus

        Write-Host "Diagnose abgeschlossen. Verwende einen der folgenden Fix-Modi:" -ForegroundColor Cyan
        Write-Host "  .\fix-docs-routing.ps1 -Action restart        # Sanfter Neustart" -ForegroundColor White
        Write-Host "  .\fix-docs-routing.ps1 -Action recreate       # Container neu erstellen" -ForegroundColor White
        Write-Host "  .\fix-docs-routing.ps1 -Action full-restart   # Alle Services neu starten" -ForegroundColor White
    }

    "restart" {
        Write-Host ">>> Führe sanften Neustart durch..." -ForegroundColor Cyan
        Write-Host ""

        Write-Host "1. Stoppe Docs-Container..." -ForegroundColor Yellow
        docker-compose stop docs

        Write-Host "2. Starte Docs-Container neu..." -ForegroundColor Yellow
        docker-compose start docs

        Write-Host "3. Warte 40 Sekunden auf Health-Check..." -ForegroundColor Yellow
        Start-Sleep -Seconds 40

        Show-ContainerStatus
        Show-RouterStatus

        Write-Host "Test: http://arch.local/docs" -ForegroundColor Yellow
        try {
            $response = Invoke-WebRequest -Uri "http://arch.local/docs" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
            Write-Host "✓ Docs erreichbar! Status: $($response.StatusCode)" -ForegroundColor Green
        } catch {
            Write-Host "✗ Docs nicht erreichbar: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "Versuche: .\fix-docs-routing.ps1 -Action recreate" -ForegroundColor Yellow
        }
    }

    "recreate" {
        Write-Host ">>> Erstelle Docs-Container neu..." -ForegroundColor Cyan
        Write-Host ""

        Write-Host "1. Stoppe Docs-Container..." -ForegroundColor Yellow
        docker-compose stop docs

        Write-Host "2. Entferne Docs-Container..." -ForegroundColor Yellow
        docker-compose rm -f docs

        Write-Host "3. Erstelle Docs-Container neu..." -ForegroundColor Yellow
        docker-compose up -d docs

        Write-Host "4. Warte 50 Sekunden auf Start und Health-Check..." -ForegroundColor Yellow
        for ($i = 50; $i -gt 0; $i--) {
            Write-Host "`r  Verbleibende Zeit: $i Sekunden..." -NoNewline -ForegroundColor Gray
            Start-Sleep -Seconds 1
        }
        Write-Host ""
        Write-Host ""

        Show-ContainerStatus
        Show-DocsLogs
        Show-RouterStatus

        Write-Host "Test: http://arch.local/docs" -ForegroundColor Yellow
        try {
            $response = Invoke-WebRequest -Uri "http://arch.local/docs" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
            Write-Host "✓ Docs erreichbar! Status: $($response.StatusCode)" -ForegroundColor Green
        } catch {
            Write-Host "✗ Docs nicht erreichbar: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "Prüfe die Logs oben auf Fehler." -ForegroundColor Yellow
            Write-Host "Wenn das Problem weiterhin besteht, versuche: .\fix-docs-routing.ps1 -Action full-restart" -ForegroundColor Yellow
        }
    }

    "full-restart" {
        Write-Host ">>> Führe kompletten Neustart durch..." -ForegroundColor Cyan
        Write-Host ""

        Write-Host "WARNUNG: Alle Services werden neu gestartet!" -ForegroundColor Red
        Write-Host "Fortfahren? (J/N): " -NoNewline
        $confirm = Read-Host

        if ($confirm -ne "J" -and $confirm -ne "j") {
            Write-Host "Abgebrochen." -ForegroundColor Yellow
            return
        }

        Write-Host "1. Stoppe alle Services..." -ForegroundColor Yellow
        docker-compose down

        Write-Host "2. Starte alle Services neu..." -ForegroundColor Yellow
        docker-compose up -d

        Write-Host "3. Warte 60 Sekunden auf Start..." -ForegroundColor Yellow
        for ($i = 60; $i -gt 0; $i--) {
            Write-Host "`r  Verbleibende Zeit: $i Sekunden..." -NoNewline -ForegroundColor Gray
            Start-Sleep -Seconds 1
        }
        Write-Host ""
        Write-Host ""

        Write-Host "Container-Status aller Services:" -ForegroundColor Yellow
        docker-compose ps
        Write-Host ""

        Show-RouterStatus

        Write-Host "Tests:" -ForegroundColor Yellow
        $tests = @(
            @{Name="Dashboard"; Url="http://arch.local/"},
            @{Name="PlantUML"; Url="http://arch.local/plantuml"},
            @{Name="Docs"; Url="http://arch.local/docs"}
        )

        foreach ($test in $tests) {
            try {
                $response = Invoke-WebRequest -Uri $test.Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
                Write-Host "  ✓ $($test.Name): $($response.StatusCode)" -ForegroundColor Green
            } catch {
                Write-Host "  ✗ $($test.Name): $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
}

Write-Host ""
Write-Host "=== Fertig ===" -ForegroundColor Cyan
