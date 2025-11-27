# Scripts - EMPC4 VIS Stack

Dieses Verzeichnis enthält Utility-Scripts für Build, Deployment und Wartung des EMPC4 VIS Stack.

---

## 📜 Verfügbare Scripts

### empc4_port_check.py

**Zweck:** Pre-Flight Port-Check vor Container-Start

**Features:**
- Lädt Port-Konfiguration aus `.env`
- Prüft Host-Port-Verfügbarkeit
- Erkennt Port-Konflikte mit laufenden Prozessen
- Docker-Integration (zeigt belegende Container)
- Schlägt alternative Ports vor

**Abhängigkeiten:**
```bash
pip install psutil
```

**Usage:**
```bash
# Einfacher Check
python scripts/empc4_port_check.py

# Mit Details
python scripts/empc4_port_check.py --verbose

# Mit Lösungsvorschlägen
python scripts/empc4_port_check.py --suggest-fixes
```

**Exit-Codes:**
- `0` = Alle Ports frei
- `1` = Konflikte gefunden
- `2` = Fehler (z.B. .env nicht gefunden)

**Integration in setup.sh:**
```bash
#!/bin/bash

# Port-Check vor Start
python scripts/empc4_port_check.py --suggest-fixes
if [ $? -ne 0 ]; then
    echo "❌ Port-Konflikte gefunden! Löse diese zuerst."
    exit 1
fi

# Starte Container
docker compose up -d
```

---

## 🔧 Zukünftige Scripts

### Geplant:
- `empc4_health_check.py` - Container Health Monitoring
- `empc4_backup.py` - Backup-Automation
- `empc4_update.py` - Update-Management

---

## 📚 Dokumentation

- **Port-Management:** [`../docs/20251127_analysing_env_usage.md`](../docs/20251127_analysing_env_usage.md)
- **Dependencies:** [`../repo/docs/setup/dependencies.md`](../repo/docs/setup/dependencies.md)

---

**Letztes Update:** 27.11.2025
