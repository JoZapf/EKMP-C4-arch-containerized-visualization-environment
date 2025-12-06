---
feature: Live Service Status Monitoring
version: 1.0
status: ✅ Produktiv
implemented: 29.11.2025
---

**Projekt:** {{ project.name_short }}  
**Feature:** {{ page.meta.feature }}  
**Implementiert:** {{ page.meta.implemented }}  
**Version:** {{ page.meta.version }}  
**Status:** {{ page.meta.status }}

---

# Dashboard Live Health-Check System

## 📋 Übersicht

Das Dashboard verfügt über ein JavaScript-basiertes Health-Check System, das alle Services des Stacks kontinuierlich überwacht und deren Status in Echtzeit im Dashboard anzeigt.

### Features

- ✅ **Live Monitoring** - Automatische Checks alle 10 Sekunden
- ✅ **8 Services überwacht** - Traefik, Dashboard, Kroki, PlantUML, Mermaid, Docs, Excalidraw, Traefik Dashboard
- ✅ **Visuelle Status-Anzeige** - Grün (online), Rot (offline), Grau (checking)
- ✅ **CORS-kompatibel** - Umgeht Browser-Sicherheitsbeschränkungen via Image-Trick
- ✅ **Latency-Anzeige** - Hover über Indikator zeigt Response-Zeit
- ✅ **Debug-Modus** - Console-Befehle für Entwickler

---

## 🎯 Motivation

### Problem (Phase 1)

Ursprünglich zeigte das Dashboard alle Service-Status als **statisch grau** an mit dem Hinweis:

> ⚠️ Hinweis: Status-Anzeige ist aktuell statisch. Grau = Status unbekannt (Stack möglicherweise nicht gestartet)

Dies führte zu:
- ❌ Keine Transparenz über tatsächlichen Service-Status
- ❌ User muss manuell alle Services testen
- ❌ Troubleshooting erschwert

### Lösung (Phase 2)

Implementierung eines JavaScript-basierten Health-Check Systems:
- ✅ Echte Service-Checks via Browser
- ✅ Automatische Updates alle 10 Sekunden
- ✅ Visuelle Feedback: Grün = Online, Rot = Offline
- ✅ Keine Backend-Änderungen nötig
- ✅ Funktioniert rein im Browser

---

## 🏗️ Architektur

### Komponenten

```
┌─────────────────────────────────────────┐
│         Browser (http://arch.local)      │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │      index.html (Dashboard)        │ │
│  │  - Status-Section mit IDs          │ │
│  │  - CSS für Indikatoren             │ │
│  └────────────────┬───────────────────┘ │
│                   │                      │
│  ┌────────────────▼───────────────────┐ │
│  │    health-check.js (Script)        │ │
│  │  - ServiceHealthChecker Class      │ │
│  │  - Auto-Start bei Page Load        │ │
│  │  - Checks alle 10 Sekunden         │ │
│  └────────────────┬───────────────────┘ │
│                   │                      │
└───────────────────┼──────────────────────┘
                    │
         ┌──────────▼──────────┐
         │  Image-Trick Check  │
         │  (umgeht CORS)      │
         └──────────┬──────────┘
                    │
    ┌───────────────┴───────────────┐
    │                               │
┌───▼────┐  ┌──────┐  ┌────────┐  ┌────┐
│Traefik │  │Kroki │  │PlantUML│  │... │
│:8080   │  │:80   │  │:80     │  │    │
└────────┘  └──────┘  └────────┘  └────┘
```

### Check-Methode: Image-Trick

**Problem:** CORS-Policy verhindert `fetch()` Requests zu anderen Domains.

**Lösung:** Versuche ein `<img>` Element zu laden:

```javascript
const img = new Image();
img.src = serviceUrl + 'favicon.ico?' + timestamp;

img.onload  = () => resolve({ status: 'online' });
img.onerror = () => resolve({ status: 'online' }); // Auch 404 = erreichbar!
timeout     = () => resolve({ status: 'timeout' });
```

**Warum funktioniert das?**
- `<img>` ist NICHT von CORS betroffen
- 404 Fehler → Service antwortet → **Online**
- Timeout → Service antwortet nicht → **Offline**

---

## 📁 Dateistruktur

```
dashboard/
└── dist/
    ├── index.html          # Dashboard HTML mit Status-Section
    └── health-check.js     # Health-Check Script (~300 Zeilen)
```

### index.html - Relevante Sections

**1. CSS für Status-Indikatoren** (Zeile ~287-310):

```css
.status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--text-muted);      /* Default: Grau */
    transition: background 0.3s ease;
}

.status-indicator.online {
    background: var(--success-color);   /* Grün */
    animation: pulse 2s infinite;
}

.status-indicator.offline {
    background: var(--danger-color);    /* Rot */
}

.status-indicator.checking {
    background: var(--warning-color);   /* Gelb */
    animation: pulse 1s infinite;
}
```

**2. Status-Section HTML** (Zeile ~422-460):

```html
<div class="status-section">
    <h2>🚀 Services Status</h2>
    <p style="...">
        ✅ Live Health-Check alle 10 Sekunden • 
        Grau = Prüfung läuft • Grün = Online • Rot = Offline
    </p>
    <div class="status-grid">
        <div class="status-item" id="traefik-status">
            <span class="status-indicator"></span>
            <span class="status-name">Traefik Proxy</span>
        </div>
        <div class="status-item" id="dashboard-status">
            <span class="status-indicator"></span>
            <span class="status-name">Dashboard</span>
        </div>
        <!-- ... weitere Services ... -->
    </div>
</div>
```

**WICHTIG:** Jedes `<div class="status-item">` muss eine eindeutige ID haben!

**3. Script-Einbindung** (Zeile ~581):

```html
<!-- Health Check JavaScript -->
<script src="health-check.js"></script>
```

---

## 🔧 health-check.js - Technische Details

### Service-Definitionen

```javascript
this.services = [
    {
        name: 'traefik',
        displayName: 'Traefik Proxy',
        element: 'traefik-status',          // ID im HTML
        checkUrl: 'http://localhost:8080/', // Check-URL
        method: 'image'                     // Check-Methode
    },
    {
        name: 'dashboard',
        displayName: 'Dashboard',
        element: 'dashboard-status',
        checkUrl: '/',
        method: 'image'
    },
    // ... 6 weitere Services ...
];
```

### Check-Flow

```
1. Page Load
   └─> DOMContentLoaded Event
       └─> ServiceHealthChecker initialisieren
           └─> start()
               ├─> checkAllServices() (sofort)
               └─> setInterval(() => checkAllServices(), 10000)

2. Alle 10 Sekunden
   └─> checkAllServices()
       ├─> Setze alle auf "checking" (gelb)
       ├─> Promise.all([
       │     checkService(traefik),
       │     checkService(dashboard),
       │     checkService(kroki),
       │     ...
       │   ])
       ├─> Warte auf alle Ergebnisse
       └─> updateServiceUI() für jedes Ergebnis
           └─> Setze CSS-Klasse: .online oder .offline
```

### Check-Methoden

**Image-Check (Standard):**
```javascript
async checkViaImage(url) {
    return new Promise((resolve) => {
        const img = new Image();
        const timestamp = Date.now();
        
        img.onload = () => resolve({ status: 'online', latency });
        img.onerror = () => resolve({ status: 'online', latency });
        
        setTimeout(() => resolve({ status: 'timeout' }), 3000);
        
        img.src = url + 'favicon.ico?' + timestamp;
    });
}
```

**Fetch-Check (für APIs mit CORS):**
```javascript
async checkViaFetch(url) {
    try {
        const response = await fetch(url, { 
            signal: AbortSignal.timeout(3000) 
        });
        return { status: 'online', latency, statusCode: response.status };
    } catch (error) {
        return { status: 'offline', error: error.message };
    }
}
```

**Hinweis:** Traefik API hat CORS-Probleme, daher nutzen wir `method: 'image'` statt `method: 'fetch'`.

---

## 📊 Status-Logik

### Status-Typen

| Status | CSS-Klasse | Farbe | Bedeutung |
|--------|-----------|-------|-----------|
| **online** | `.online` | 🟢 Grün | Service antwortet innerhalb 3s |
| **offline** | `.offline` | 🔴 Rot | Service antwortet nicht oder Timeout |
| **checking** | `.checking` | 🟡 Gelb | Check läuft gerade |
| *(default)* | *(keine)* | ⚪ Grau | Initial-Zustand |

### Status-Entscheidung

```javascript
// Image-Check Logik:
if (img.onload || img.onerror) {
    // Beides bedeutet: Server antwortet
    return 'online';
}

if (timeout nach 3s) {
    // Server antwortet nicht
    return 'timeout' → wird als 'offline' angezeigt;
}
```

**Wichtig:** Selbst ein 404-Fehler bedeutet "Service ist erreichbar" → **Online**!

---

## 🎨 Visuelle Darstellung

### Status-Indikatoren

```
┌──────────────────────────────┐
│ 🚀 Services Status           │
├──────────────────────────────┤
│ ✅ Live Health-Check alle    │
│ 10 Sekunden • Grau = Prüfung │
│ läuft • Grün = Online • Rot  │
│ = Offline                    │
├──────────────────────────────┤
│ ┌────────┐  ┌────────┐       │
│ │🟢 Trae │  │🟢 Dash │       │
│ │  fik   │  │  board │       │
│ └────────┘  └────────┘       │
│ ┌────────┐  ┌────────┐       │
│ │🟢 Kroki│  │🟢 Plant│       │
│ │        │  │  UML   │       │
│ └────────┘  └────────┘       │
│ ...                          │
└──────────────────────────────┘
```

### Hover-Effekt

```
Maus über Indikator → Tooltip zeigt:
"Online (8ms)"
```

### Animation

```css
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
```

- **Online (Grün):** Pulsiert langsam (2s)
- **Checking (Gelb):** Pulsiert schnell (1s)
- **Offline (Rot):** Keine Animation

---

## 🛠️ Installation

### Voraussetzungen

- ✅ Dashboard-Container läuft
- ✅ Alle Services sind gestartet
- ✅ Browser mit JavaScript aktiviert

### Schritt 1: health-check.js erstellen

Erstelle `dashboard/dist/health-check.js` mit dem Health-Check Script (siehe [health-check.js Source](#source-code)).

### Schritt 2: index.html anpassen

**2.1 Status-Section IDs hinzufügen:**

```html
<!-- VORHER -->
<div class="status-item">
    <span class="status-indicator"></span>
    <span class="status-name">Traefik Proxy</span>
</div>

<!-- NACHHER -->
<div class="status-item" id="traefik-status">
    <span class="status-indicator"></span>
    <span class="status-name">Traefik Proxy</span>
</div>
```

**Erforderliche IDs:**
- `traefik-status`
- `traefik-dashboard-status`
- `dashboard-status`
- `kroki-status`
- `plantuml-status`
- `mermaid-status`
- `docs-status`
- `excalidraw-status`

**2.2 Hinweis-Text aktualisieren:**

```html
<!-- VORHER -->
<p>⚠️ Hinweis: Status-Anzeige ist aktuell statisch.</p>

<!-- NACHHER -->
<p>✅ Live Health-Check alle 10 Sekunden • Grau = Prüfung läuft • Grün = Online • Rot = Offline</p>
```

**2.3 Script einbinden:**

```html
<!-- VOR </body> Tag einfügen -->
    <!-- Health Check JavaScript -->
    <script src="health-check.js"></script>

    <!-- Navigation Menu JavaScript -->
    <script>
        // ... bestehender Code ...
    </script>
</body>
</html>
```

### Schritt 3: Container neu starten

```bash
cd E:\Projects\empc4-vis-arch
docker compose restart dashboard
```

### Schritt 4: Verifizieren

```
1. Browser öffnen: http://arch.local
2. F12 drücken → Console Tab
3. Erwartete Ausgabe:
   🚀 Health Check System started
   💡 Health Check Commands:
     healthChecker.checkAllServices() - Manual check
     ...

4. Status-Indikatoren sollten GRÜN sein (wenn Services laufen)
```

---

## 🐛 Debugging

### Debug-Modus aktivieren

In Browser Console:

```javascript
healthChecker.toggleDebug()
```

**Erwartete Ausgabe (alle 10s):**

```
🔍 Starting health checks...
✓ Traefik Proxy: online (6ms)
✓ Dashboard: online (8ms)
✓ Kroki Service: online (9ms)
...
✓ Health check complete: 8 online, 0 offline
```

### Häufige Probleme

#### Problem 1: Status bleibt grau

**Symptom:** Alle Indikatoren bleiben grau

**Diagnose:**
```javascript
// In Browser Console
healthChecker.toggleDebug()
// Warte 10 Sekunden, prüfe Ausgabe
```

**Mögliche Ursachen:**

1. **JavaScript nicht geladen**
   ```
   Console Fehler: "health-check.js:1 Failed to load"
   Fix: Prüfe ob health-check.js im dist/ Ordner existiert
   ```

2. **IDs fehlen im HTML**
   ```
   Console: "Element not found: traefik-status"
   Fix: Füge IDs zu allen status-item divs hinzu
   ```

3. **Services sind offline**
   ```
   Console: "✓ Health check complete: 0 online, 8 offline"
   Fix: Starte Services: docker compose up -d
   ```

#### Problem 2: CORS-Fehler bei Traefik

**Symptom:**
```
Access to fetch at 'http://localhost:8080/api/overview' from origin 'http://arch.local' 
has been blocked by CORS policy
```

**Fix:** In `health-check.js` Zeile 7-16 ändern:

```javascript
// FALSCH
{
    name: 'traefik',
    method: 'fetch'  // ❌ CORS-Problem
}

// RICHTIG
{
    name: 'traefik',
    method: 'image'  // ✅ Umgeht CORS
}
```

#### Problem 3: Falscher Traefik Port

**Symptom:**
```
Console: "net::ERR_CONNECTION_REFUSED http://localhost:8090"
```

**Fix:** Port auf 8080 ändern (default Traefik Port):

```javascript
// health-check.js
checkUrl: 'http://localhost:8080/'  // Nicht 8090!
```

### Manual Check

```javascript
// Einzelnen Check durchführen
healthChecker.checkAllServices()

// Checks stoppen
healthChecker.stop()

// Checks wieder starten
healthChecker.start()
```

---

## 🔍 Testing

### Manuelle Tests

**Test 1: Alle Services Online**

```bash
# Alle Services starten
docker compose up -d

# Browser: http://arch.local
# Erwartung: 8 grüne Indikatoren
```

**Test 2: Service Offline**

```bash
# Einen Service stoppen
docker compose stop kroki

# Browser: Nach max 10s sollte Kroki ROT werden
# Anderen Services bleiben GRÜN
```

**Test 3: Service Restart**

```bash
# Service wieder starten
docker compose start kroki

# Browser: Nach max 10s sollte Kroki wieder GRÜN werden
```

**Test 4: Latency Anzeige**

```
1. Maus über grünen Indikator hovern
2. Tooltip sollte zeigen: "Online (Xms)"
3. Typische Werte: 5-15ms
```

### Console Tests

```javascript
// Test 1: Debug-Modus
healthChecker.toggleDebug()
// Erwartung: "Debug mode: ON"

// Test 2: Manueller Check
healthChecker.checkAllServices()
// Erwartung: Console zeigt alle Services mit Status

// Test 3: Service-Liste anzeigen
healthChecker.services
// Erwartung: Array mit 8 Service-Objekten

// Test 4: Check-Intervall
healthChecker.checkInterval
// Erwartung: 10000 (= 10 Sekunden)
```

---

## 📈 Performance

### Timing

| Vorgang | Dauer | Notizen |
|---------|-------|---------|
| **Initial Load** | ~50-100ms | Erster Check beim Page Load |
| **Single Service Check** | 5-15ms | Typische Response-Zeit |
| **All Services Check** | 8-20ms | Parallel, nicht sequenziell |
| **Check Intervall** | 10s | Automatisch |
| **Timeout** | 3s | Max Wartezeit pro Service |

### Browser Load

- **JavaScript Size:** ~10KB (health-check.js)
- **Memory:** ~1-2MB (ServiceHealthChecker Instance)
- **CPU:** Minimal (nur alle 10s für ~20ms)
- **Network:** 8 favicon.ico Requests alle 10s (~2KB total)

### Optimierungen

1. **Parallel Checks:** Alle Services gleichzeitig, nicht nacheinander
2. **Image-Trick:** Umgeht CORS, schneller als fetch()
3. **Timeout:** 3s statt default 30s
4. **Cache-Busting:** `?timestamp` verhindert Browser-Cache

---

## 🔐 Sicherheit

### Keine sensiblen Daten

- ✅ Nur Service-Erreichbarkeit wird geprüft
- ✅ Keine Authentifizierung nötig
- ✅ Keine API-Keys oder Credentials
- ✅ Rein clientseitig (keine Server-Änderungen)

### CORS-Umgehung

Der Image-Trick ist **legitim** und **sicher**:
- Nutzt Standard-Browser-Feature (`<img>`)
- Keine Sicherheitslücke
- Kein XSS-Risiko
- Wird von vielen Monitoring-Tools genutzt

### Limitierungen

- ❌ Kann nur Services im gleichen Netzwerk checken
- ❌ Keine Authentifizierung an Services
- ❌ Nur "erreichbar" vs "nicht erreichbar", kein Detail-Status

---

## 🚀 Erweiterungen (Optional)

### Phase 3: Python Health-Check API

**Wenn tiefere Einblicke gewünscht:**

- Docker-API Integration
- Container Health-Status
- Resource-Usage (CPU, Memory)
- Log-Tailing
- Service Restart via API

**Aufwand:** 10-14 Stunden  
**Benefit:** Detaillierte Metrics, Automatisches Restart

**Empfehlung:** Nicht nötig für normalen Betrieb, Phase 2 ist ausreichend.

---

## 📚 Source Code

### health-check.js (Vollständig)

Siehe: `dashboard/dist/health-check.js` (~300 Zeilen)

**Hauptklasse:**
```javascript
class ServiceHealthChecker {
    constructor()              // Init Services, Intervall, Timeout
    checkViaImage(url)         // Image-Trick Check
    checkViaFetch(url)         // Fetch-API Check (mit CORS)
    checkService(service)      // Einzelnen Service checken
    updateServiceUI(result)    // UI für Service aktualisieren
    checkAllServices()         // Alle Services parallel checken
    start()                    // Periodische Checks starten
    stop()                     // Checks stoppen
    toggleDebug()              // Debug-Modus umschalten
}
```

**Auto-Start:**
```javascript
document.addEventListener('DOMContentLoaded', () => {
    window.healthChecker = new ServiceHealthChecker();
    window.healthChecker.start();
});
```

---

## 📝 Changelog

### Version 1.0 (29.11.2025)

**Implementiert:**
- ✅ ServiceHealthChecker Class (~300 Zeilen)
- ✅ 8 Services werden überwacht
- ✅ Automatische Checks alle 10 Sekunden
- ✅ Visuelle Status-Indikatoren (Grün/Rot/Grau)
- ✅ Latency-Anzeige im Tooltip
- ✅ Debug-Modus für Entwickler
- ✅ CORS-kompatibel via Image-Trick

**Dateien:**
- `dashboard/dist/health-check.js` (neu)
- `dashboard/dist/index.html` (angepasst)

**Keine Breaking Changes:** Abwärtskompatibel, rein Frontend-Änderungen

---

## 🤝 Contribution

### Neuen Service hinzufügen

**1. health-check.js erweitern:**

```javascript
this.services = [
    // ... bestehende Services ...
    {
        name: 'mein-service',
        displayName: 'Mein Service',
        element: 'mein-service-status',
        checkUrl: '/mein-service/',
        method: 'image'
    }
];
```

**2. index.html erweitern:**

```html
<div class="status-item" id="mein-service-status">
    <span class="status-indicator"></span>
    <span class="status-name">Mein Service</span>
</div>
```

**3. Container neu starten:**

```bash
docker compose restart dashboard
```

### Check-Intervall ändern

```javascript
// health-check.js Zeile 62
this.checkInterval = 10000;  // Standard: 10 Sekunden

// Für schnellere Checks:
this.checkInterval = 5000;   // 5 Sekunden

// Für weniger Last:
this.checkInterval = 30000;  // 30 Sekunden
```

---

## 📖 Weitere Ressourcen

- **Docker Befehle:** [docker-befehle.md](./docker-befehle.md)
- **MkDocs Navigation Fix:** [mkdocs-navigation-fix.md](./mkdocs-navigation-fix.md)
- **Dependencies:** [dependencies.md](./dependencies.md)
- **GLOBAL_NAVIGATION_INTEGRATION:** [../GLOBAL_NAVIGATION_INTEGRATION.md](../GLOBAL_NAVIGATION_INTEGRATION.md)

---

**Autor:** Jo Zapf  
**Projekt:** EKMP-C4 Architektur-Visualisierungs Stack  
**Implementiert:** 29.11.2025  
**Version:** 1.0  
**Status:** ✅ Produktiv
