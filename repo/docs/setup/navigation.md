# Global Navigation Integration - Hamburger-Menü

**Projekt:** EKMP-C4 Architektur-Visualisierungs Stack  
**Erstellt:** 23.11.2025  
**Version:** 1.2  
**Autor:** Jo Zapf

> **📍 Ablageorte dieser Dokumentation:**
> - **Projekt-Root:** `/GLOBAL_NAVIGATION_INTEGRATION.md` (für Quick-Access via GitHub)
> - **MkDocs-Dokumentation:** `/repo/docs/setup/navigation.md` (Web-Doku unter http://arch.local/docs)
> 
> Beide Versionen sollten synchron gehalten werden.

---

## 📋 Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Architektur](#architektur)
3. [Integration nach Service](#integration-nach-service)
4. [Kern-Komponenten](#kern-komponenten)
5. [Troubleshooting](#troubleshooting)
6. [Wartung und Updates](#wartung-und-updates)

---

## Übersicht

Das globale Hamburger-Menü bietet eine konsistente Navigation über alle Services der EMPC4-Visualisierungsumgebung hinweg.

### ✨ Features

- **Konsistentes Design**: Glassmorphism-Effekt, vertikal zentriert am rechten Rand
- **Responsive**: Mobile-optimiert (Menü öffnet oben auf kleinen Screens)
- **Accessibility**: ARIA-Labels, Keyboard-Navigation (ESC zum Schließen)
- **Active-State**: Aktueller Service wird highlighted
- **Keine Dependencies**: Vanilla JavaScript, kein Framework erforderlich

### 🎯 Navigation-Links

1. 🏠 Dashboard (`/`)
2. 📚 Dokumentation (`/docs`)
3. 🎯 Kroki Service (`/kroki`)
4. 🎨 PlantUML Server (`/plantuml`)
5. 📊 Mermaid Editor (`/mermaid`)
6. ✏️ Excalidraw Server (`/whiteboard`)
7. ⚙️ Traefik Dashboard (`http://localhost:8090`) - Mit Navigation!
8. 💻 GitHub Repository - Externes Fenster

---

## Architektur

### Integrationsmethoden

Die Integration erfolgt je nach Service-Typ unterschiedlich:

| Service | Methode | Grund |
|---------|---------|-------|
| Dashboard | **Statisch** | Direktes HTML |
| MkDocs | **Build-Zeit** | Extra CSS/JS via MkDocs Config |
| Excalidraw | **Build-Zeit** | sed-Injection ins HTML |
| Mermaid | **Build-Zeit** | sed-Injection ins HTML |
| PlantUML | **Runtime** | nginx sub_filter (Java-App) |
| Kroki | **Statisch** | Direktes HTML + Volume-Mount |
| **Traefik** | **Runtime** | nginx sub_filter (Go-App) |

### Dateistruktur (Projekt-Root)

```
empc4-vis-arch/
├── global-nav.css              # ← Kern: CSS (vertikal zentriert)
├── global-nav.js               # ← Kern: JavaScript (DOM-Injection)
├── docker-compose.yml
├── dashboard/
│   └── dist/
│       ├── index.html          # Integriert
│       ├── global-nav.css      # Kopie
│       └── global-nav.js       # Kopie
├── repo/
│   ├── mkdocs.yml              # Konfiguriert
│   └── docs/
│       ├── stylesheets/
│       │   ├── global-nav.css          # Kopie (Build-Zeit)
│       │   └── navigation-indent.css   # Custom CSS für Einrückung
│       ├── javascripts/
│       │   └── global-nav.js           # Kopie (Build-Zeit)
│       └── setup/
│           ├── navigation.md               # Diese Datei
│           ├── navigation-implementierung.md  # Detail-Anleitung
│           ├── docker-befehle.md           # Docker-Commands
│           └── mkdocs-usage.md            # MkDocs-Anleitung
├── excalidraw/
│   ├── Dockerfile              # Build: COPY + sed
│   └── nginx.conf
├── mermaid-live/
│   ├── Dockerfile              # Build: COPY + sed
│   └── nginx.conf
├── plantuml-proxy/
│   ├── Dockerfile              # Build: COPY
│   └── nginx.conf              # Runtime: sub_filter
├── traefik-proxy/
│   ├── Dockerfile              # Build: COPY
│   └── nginx.conf              # Runtime: sub_filter
└── kroki-frontend/
    ├── index.html              # Integriert
    ├── global-nav.css          # Kopie
    ├── global-nav.js           # Kopie
    └── nginx.conf
```

---

## Integration nach Service

> **📖 Detaillierte Implementierungs-Anleitung:** [Navigation-Implementierung](navigation-implementierung.md)  
> Vollständige Schritt-für-Schritt-Anleitungen mit Code-Beispielen für alle 7 Services.

---

## Kern-Komponenten

### global-nav.css

**Speicherort:** Projekt-Root  
**Größe:** ~4 KB

**Wichtigste CSS-Regeln:**

```css
/* Button: vertikal zentriert, rechts */
.empc4-nav-toggle {
    position: fixed;
    top: 50%;
    right: 0.8rem;
    transform: translateY(-50%);
    /* Glassmorphism */
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(10px);
}

/* Menü: vertikal zentriert, links vom Button */
.empc4-nav-menu {
    position: fixed;
    top: 50%;
    right: 4.2rem;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(20px);
}

/* Active-State */
.empc4-nav-menu a.active {
    background: rgba(74, 158, 255, 0.15);
    color: #4a9eff;
    border-left: 3px solid #4a9eff;
}
```

---

### global-nav.js

**Speicherort:** Projekt-Root  
**Größe:** ~5 KB

**Hauptfunktion:**

```javascript
function initGlobalNav() {
    // 1. Prüfe ob bereits vorhanden
    if (document.querySelector('.empc4-nav-toggle')) return;
    
    // 2. Erstelle DOM-Elemente
    const navToggle = document.createElement('button');
    const navMenu = document.createElement('nav');
    
    // 3. Baue Navigation
    const navItems = [
        { href: '/', icon: '🏠', text: 'Dashboard' },
        // ...
    ];
    
    // 4. Füge ins DOM ein
    document.body.appendChild(navToggle);
    document.body.appendChild(navMenu);
    
    // 5. Event-Listener
    navToggle.addEventListener('click', toggleMenu);
    document.addEventListener('keydown', closeOnEscape);
}
```

---

## Troubleshooting

### Problem: Menü erscheint nicht

**Debug-Schritte:**

```bash
# 1. Prüfe ob CSS/JS geladen wird (Browser DevTools → Network)
# 2. Prüfe Container-Dateien
docker exec <container> ls -la /usr/share/nginx/html/

# 3. Bei Build-Integration: Neu bauen
docker compose build --no-cache <service>
docker compose up -d <service>
```

---

### Problem: Falsche Pfade nach Traefik-Routing

**Analyse:**

```
Browser → /whiteboard/global-nav.css
Traefik → StripPrefix(/whiteboard)
nginx empfängt → /global-nav.css
```

**Lösung:** Pfade im HTML müssen Traefik-Routing berücksichtigen:
- **Mit StripPrefix:** Vollständiger Pfad nötig (`/whiteboard/...`)
- **Ohne StripPrefix:** Relativer Pfad möglich

---

### Problem: sub_filter funktioniert nicht

**Häufige Ursachen:**

1. **proxy_buffering off**  
   → sub_filter benötigt `proxy_buffering on`!

2. **Pattern stimmt nicht**  
   → Teste: `curl http://localhost | grep "</head>"`

3. **Gzip Compression**  
   → sub_filter funktioniert nicht mit gzip

---

## Wartung und Updates

### Globale Änderungen

**CSS/JS im Root editieren:**

```bash
# 1. Editiere
vim global-nav.css
vim global-nav.js

# 2. Services mit statischer Integration
cp global-nav.* dashboard/dist/
cp global-nav.* kroki-frontend/
docker compose restart dashboard kroki

# 3. Services mit Build-Integration
docker compose build --no-cache \
  excalidraw mermaid-live plantuml traefik-dashboard docs
docker compose up -d \
  excalidraw mermaid-live plantuml traefik-dashboard docs
```

---

### Navigation-Link hinzufügen

**Editiere:** `global-nav.js`

```javascript
const navItems = [
    // ... existing ...
    { 
        href: '/newservice', 
        icon: '🔧', 
        text: 'New Service',
        id: 'newservice'
    },
];
```

**Anwenden:** Wie bei "Globale Änderungen"

---

## Checkliste: Neue Service-Integration

- [ ] Integrationsmethode gewählt
- [ ] `global-nav.css` kopiert/referenziert
- [ ] `global-nav.js` kopiert/referenziert
- [ ] HTML angepasst
- [ ] Traefik-Routing berücksichtigt
- [ ] Container gebaut/gestartet
- [ ] Browser-Test (Hard-Refresh: Ctrl+Shift+R)
- [ ] DevTools geprüft
- [ ] Mobile getestet
- [ ] Active-State funktioniert
- [ ] Dokumentation aktualisiert

---

**Letzte Aktualisierung:** 23.11.2025  
**Dokumentations-Version:** 1.2
