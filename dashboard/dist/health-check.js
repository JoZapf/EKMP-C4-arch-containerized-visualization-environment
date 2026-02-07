/**
 * EKMP-C4 ARCHITEKTUR VISUALISIERUNGS STACK - Health Check System
 * Überprüft Status aller Services und aktualisiert UI
 * Version: 1.0
 * Author: Jo Zapf
 * Date: 29.11.2025
 */

class ServiceHealthChecker {
    constructor() {
        // Service-Definitionen mit Check-URLs
        this.services = [
            {
                name: 'traefik',
                displayName: 'Traefik Proxy',
                element: 'traefik-status',
                checkUrl: 'http://localhost:9090/api/overview',
                method: 'image' // Traefik API
            },
            {
                name: 'traefik-dashboard',
                displayName: 'Traefik Dashboard',
                element: 'traefik-dashboard-status',
                checkUrl: 'http://localhost:9090/dashboard/',
                method: 'image' // Favicon check
            },
            {
                name: 'dashboard',
                displayName: 'Dashboard',
                element: 'dashboard-status',
                checkUrl: '/',
                method: 'image'
            },
            {
                name: 'plantuml',
                displayName: 'PlantUML Server',
                element: 'plantuml-status',
                checkUrl: '/plantuml/',
                method: 'image'
            },
            {
                name: 'kroki',
                displayName: 'Kroki Service',
                element: 'kroki-status',
                checkUrl: '/kroki/',
                method: 'image'
            },
            {
                name: 'mermaid',
                displayName: 'Mermaid Editor',
                element: 'mermaid-status',
                checkUrl: '/mermaid/',
                method: 'image'
            },
            {
                name: 'docs',
                displayName: 'Dokumentation',
                element: 'docs-status',
                checkUrl: '/docs/',
                method: 'image'
            },
            {
                name: 'excalidraw',
                displayName: 'Excalidraw',
                element: 'excalidraw-status',
                checkUrl: '/whiteboard/',
                method: 'image'
            }
        ];

        // Check-Intervall (10 Sekunden)
        this.checkInterval = 10000;
        
        // Timeout für einzelne Checks (3 Sekunden)
        this.checkTimeout = 3000;
        
        // Interval-ID für cleanup
        this.intervalId = null;

        // Logging aktiviert
        this.debug = false;
    }

    /**
     * Service-Check via Fetch (Same-Origin) oder Image (Cross-Origin)
     * Verwendet fetch() für Services auf gleicher Domain, Image-Trick für externe
     */
    async checkViaImage(url) {
        const timestamp = Date.now();
        
        // Prüfe ob Same-Origin (dann können wir fetch verwenden)
        const isSameOrigin = url.startsWith('/') || url.startsWith(window.location.origin);
        
        if (isSameOrigin) {
            // Same-Origin: Verwende fetch (kein CORS-Problem)
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.checkTimeout);

                const response = await fetch(url, {
                    method: 'HEAD', // Nur Header, kein Body
                    signal: controller.signal,
                    cache: 'no-cache'
                });

                clearTimeout(timeoutId);
                const latency = Date.now() - timestamp;

                // Status 200-399 = Online, 400-599 = Erreichbar (warning)
                if (response.ok) {
                    return { status: 'online', latency };
                } else {
                    return { status: 'online', latency }; // Server antwortet = online
                }

            } catch (error) {
                const latency = Date.now() - timestamp;
                
                if (error.name === 'AbortError') {
                    return { status: 'timeout', latency };
                }
                
                return { status: 'offline', latency, error: error.message };
            }
        } else {
            // Cross-Origin: Verwende Image-Trick
            return new Promise((resolve) => {
                const img = new Image();
                let resolved = false;

                // Timeout handler
                const timeoutId = setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        resolve({ status: 'timeout', latency: this.checkTimeout });
                    }
                }, this.checkTimeout);

                // Success handler
                img.onload = () => {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeoutId);
                        const latency = Date.now() - timestamp;
                        resolve({ status: 'online', latency });
                    }
                };

                // Error handler - bei Cross-Origin bedeutet jede Antwort "erreichbar"
                img.onerror = () => {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeoutId);
                        const latency = Date.now() - timestamp;
                        // Cross-Origin: onerror kann auch bei 200 OK ausgelöst werden
                        // Wenn schnell = vermutlich online
                        if (latency < 1000) {
                            resolve({ status: 'online', latency });
                        } else {
                            resolve({ status: 'error', latency });
                        }
                    }
                };

                // Versuche Favicon zu laden
                img.src = url + 'favicon.ico?' + timestamp;
            });
        }
    }

    /**
     * Service-Check via Fetch (für APIs mit CORS-Support)
     */
    async checkViaFetch(url) {
        const timestamp = Date.now();
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.checkTimeout);

            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal,
                cache: 'no-cache'
            });

            clearTimeout(timeoutId);
            const latency = Date.now() - timestamp;

            // Auch 404 oder 500 bedeuten: Service ist erreichbar
            return { 
                status: 'online', 
                latency,
                statusCode: response.status 
            };

        } catch (error) {
            const latency = Date.now() - timestamp;
            
            if (error.name === 'AbortError') {
                return { status: 'timeout', latency, error: 'Timeout' };
            }
            
            return { status: 'offline', latency, error: error.message };
        }
    }

    /**
     * Einzelnen Service checken
     */
    async checkService(service) {
        const startTime = Date.now();

        try {
            let result;
            
            if (service.method === 'fetch') {
                result = await this.checkViaFetch(service.checkUrl);
            } else {
                result = await this.checkViaImage(service.checkUrl);
            }

            if (this.debug) {
                console.log(`✓ ${service.displayName}: ${result.status} (${result.latency}ms)`);
            }

            return {
                name: service.name,
                element: service.element,
                status: result.status,
                latency: result.latency,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            if (this.debug) {
                console.error(`✗ ${service.displayName}:`, error);
            }

            return {
                name: service.name,
                element: service.element,
                status: 'offline',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * UI für einzelnen Service aktualisieren
     */
    updateServiceUI(result) {
        const container = document.getElementById(result.element);
        if (!container) {
            if (this.debug) {
                console.warn(`Element not found: ${result.element}`);
            }
            return;
        }

        const indicator = container.querySelector('.status-indicator');
        if (!indicator) {
            if (this.debug) {
                console.warn(`Indicator not found in: ${result.element}`);
            }
            return;
        }

        // Entferne alle Status-Klassen
        indicator.classList.remove('online', 'offline', 'checking', 'timeout', 'warning');

        // Setze neue Status-Klasse
        if (result.status === 'online') {
            indicator.classList.add('online');
            indicator.title = `Online (${result.latency}ms)`;
        } else if (result.status === 'error') {
            indicator.classList.add('warning');
            indicator.title = `Erreichbar aber Fehler (${result.latency}ms)`;
        } else if (result.status === 'timeout') {
            indicator.classList.add('offline');
            indicator.title = 'Timeout - möglicherweise offline';
        } else {
            indicator.classList.add('offline');
            indicator.title = 'Offline';
        }
    }

    /**
     * Alle Services checken
     */
    async checkAllServices() {
        if (this.debug) {
            console.log('🔍 Starting health checks...');
        }

        // Setze alle auf "checking" während Check läuft
        this.services.forEach(service => {
            const container = document.getElementById(service.element);
            if (container) {
                const indicator = container.querySelector('.status-indicator');
                if (indicator) {
                    indicator.classList.add('checking');
                    indicator.title = 'Checking...';
                }
            }
        });

        // Checke alle Services parallel
        const results = await Promise.all(
            this.services.map(service => this.checkService(service))
        );

        // Update UI für alle Ergebnisse
        results.forEach(result => this.updateServiceUI(result));

        // Statistik
        const online = results.filter(r => r.status === 'online').length;
        const offline = results.filter(r => r.status === 'offline' || r.status === 'timeout').length;

        if (this.debug) {
            console.log(`✓ Health check complete: ${online} online, ${offline} offline`);
        }

        return results;
    }

    /**
     * Periodische Checks starten
     */
    start() {
        console.log('🚀 Health Check System started');
        
        // Initial check sofort
        this.checkAllServices();

        // Dann alle 10 Sekunden
        this.intervalId = setInterval(() => {
            this.checkAllServices();
        }, this.checkInterval);
    }

    /**
     * Checks stoppen
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('⏹️ Health Check System stopped');
        }
    }

    /**
     * Debug-Modus umschalten
     */
    toggleDebug() {
        this.debug = !this.debug;
        console.log(`Debug mode: ${this.debug ? 'ON' : 'OFF'}`);
    }
}

// Auto-Start beim Laden der Seite
document.addEventListener('DOMContentLoaded', () => {
    // Health Checker initialisieren
    window.healthChecker = new ServiceHealthChecker();
    
    // Starten
    window.healthChecker.start();

    // Debug-Befehle für Console
    console.log('💡 Health Check Commands:');
    console.log('  healthChecker.checkAllServices() - Manual check');
    console.log('  healthChecker.toggleDebug()      - Toggle debug output');
    console.log('  healthChecker.stop()             - Stop checks');
    console.log('  healthChecker.start()            - Start checks');
});

// Cleanup beim Verlassen der Seite
window.addEventListener('beforeunload', () => {
    if (window.healthChecker) {
        window.healthChecker.stop();
    }
});
