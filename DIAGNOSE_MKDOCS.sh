#!/bin/bash
# MkDocs Asset Loading Diagnose

echo "======================================"
echo "MkDocs Container Diagnose"
echo "======================================"
echo ""

echo "1️⃣ Prüfe, ob Container läuft..."
docker ps --filter "name=empc4_docs" --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"
echo ""

echo "2️⃣ Prüfe ACTUAL HTML im Container (erste 100 Zeilen)..."
echo "Suche nach asset paths (<link href=, <script src=):"
docker exec empc4_docs head -100 /usr/share/nginx/html/index.html | grep -E '(href=|src=).*/(assets|stylesheets|javascripts|images)' --color=always
echo ""

echo "3️⃣ Zeige wie MkDocs die Pfade generiert hat..."
echo "Wenn das sed-Script funktioniert hat, sollten ALLE Pfade /docs/ enthalten!"
echo "z.B. href=\"/docs/assets/...\" statt href=\"/assets/...\""
echo ""

echo "4️⃣ Prüfe ob /assets/ Verzeichnis im Container existiert..."
docker exec empc4_docs ls -la /usr/share/nginx/html/
echo ""

echo "5️⃣ Prüfe nginx Access Logs..."
docker exec empc4_docs tail -20 /var/log/nginx/access.log 2>/dev/null || echo "Keine Access Logs verfügbar"
echo ""

echo "======================================"
echo "ERWARTETES ERGEBNIS:"
echo "Alle <link href= und <script src= sollten /docs/assets/ enthalten"
echo "NICHT: href=\"/assets/...\" ❌"
echo "SONDERN: href=\"/docs/assets/...\" ✅"
echo "======================================"
