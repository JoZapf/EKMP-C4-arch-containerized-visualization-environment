/**
 * PlantUML Collaboration Client
 * EMPC4 Architecture Visualization Stack
 *
 * Aktiviert sich nur wenn URL-Parameter ?collab=<room-id> vorhanden ist.
 * Verbindet sich über Socket.IO mit dem plantuml-sync Server.
 *
 * Ablauf:
 *  1. ?collab=<room> aus URL lesen
 *  2. Socket.IO verbinden via /uml/collab/
 *  3. Room joinen, aktuellen Diagram-Stand empfangen
 *  4. Änderungen im PlantUML-Textarea abfangen & broadcasten
 *  5. Eingehende Updates in den Editor schreiben
 *  6. Share-Button + Status-Anzeige ins DOM injizieren
 */

(function () {
    'use strict';

    // -------------------------------------------------------
    // Konfiguration
    // -------------------------------------------------------
    const CONFIG = {
        // Socket.IO Pfad - muss mit nginx proxy_pass /uml/collab/ übereinstimmen
        socketPath: '/uml/collab/socket.io',
        // Debounce: Wie lange nach letzter Eingabe warten bevor Update gesendet wird (ms)
        debounceMs: 300,
        // URL-Parameter Name für Room-ID
        roomParam: 'collab',
        // CSS-Klassen Prefix
        cssPrefix: 'empc4-collab',
    };

    // -------------------------------------------------------
    // Initialisierung - warte auf DOM
    // -------------------------------------------------------
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        const roomId = getRoomId();

        // Immer den Share-Button anzeigen (auch ohne aktive Session)
        injectUI(roomId);

        if (!roomId) {
            // Kein ?collab= Parameter - kein Collaboration-Modus
            console.log('[EMPC4 Collab] Kein Room-Parameter. Collaboration inaktiv.');
            return;
        }

        if (typeof io === 'undefined') {
            console.error('[EMPC4 Collab] Socket.IO nicht geladen. Collaboration nicht verfügbar.');
            setStatus('error', 'Socket.IO nicht verfügbar');
            return;
        }

        console.log('[EMPC4 Collab] Starte Collaboration in Room: ' + roomId);
        startCollaboration(roomId);
    }

    // -------------------------------------------------------
    // Room-ID aus URL lesen
    // -------------------------------------------------------
    function getRoomId() {
        const params = new URLSearchParams(window.location.search);
        return params.get(CONFIG.roomParam) || null;
    }

    // -------------------------------------------------------
    // PlantUML Editor-Textarea finden
    // PlantUML Jetty hat ein <textarea> mit dem Diagram-Quelltext
    // -------------------------------------------------------
    function findEditor() {
        // Verschiedene Selektoren - werden im Browser-Test verfeinert
        const selectors = [
            'textarea#content',
            'textarea[name="text"]',
            'textarea[name="content"]',
            'textarea.form-control',
            'form textarea',
            'textarea',
        ];

        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) {
                console.log('[EMPC4 Collab] Editor gefunden: ' + selector);
                return el;
            }
        }

        console.warn('[EMPC4 Collab] Kein Editor-Textarea gefunden. Verfügbare Textareas:');
        document.querySelectorAll('textarea').forEach(function(ta) {
            console.warn('  - id="' + ta.id + '" name="' + ta.name + '" class="' + ta.className + '"');
        });
        return null;
    }

    // -------------------------------------------------------
    // Collaboration starten
    // -------------------------------------------------------
    function startCollaboration(roomId) {
        const socket = io({
            path: CONFIG.socketPath,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
        });

        let isRemoteUpdate = false;  // Verhindert Echo-Loop
        let debounceTimer = null;
        let editor = null;

        // ------------------------------
        // Socket.IO Events
        // ------------------------------

        socket.on('connect', function () {
            console.log('[EMPC4 Collab] Verbunden. SID: ' + socket.id);
            setStatus('connected', 'Verbunden · Room: ' + roomId);

            // Room joinen
            socket.emit('join', { room: roomId });
        });

        socket.on('disconnect', function (reason) {
            console.log('[EMPC4 Collab] Verbindung getrennt: ' + reason);
            setStatus('disconnected', 'Verbindung getrennt');
        });

        socket.on('connect_error', function (err) {
            console.error('[EMPC4 Collab] Verbindungsfehler: ' + err.message);
            setStatus('error', 'Verbindungsfehler');
        });

        socket.on('connected', function (data) {
            console.log('[EMPC4 Collab] Server bestätigt Verbindung: ' + data.sid);
        });

        socket.on('user_joined', function (data) {
            console.log('[EMPC4 Collab] User beigetreten. Gesamt: ' + data.users_count);
            setUserCount(data.users_count);
        });

        socket.on('user_left', function (data) {
            console.log('[EMPC4 Collab] User verlassen. Gesamt: ' + data.users_count);
            setUserCount(data.users_count);
        });

        // Diagram-Update vom Server empfangen
        socket.on('diagram_update', function (data) {
            if (!editor) {
                editor = findEditor();
            }
            if (!editor) return;

            console.log('[EMPC4 Collab] Update empfangen: ' + data.text.length + ' Zeichen');

            // Setze Flag damit eigener input-Listener nicht reagiert
            isRemoteUpdate = true;
            editor.value = data.text;
            isRemoteUpdate = false;

            // PlantUML-interne Events auslösen damit Vorschau aktualisiert wird
            triggerEditorUpdate(editor);
        });

        // ------------------------------
        // Editor-Hook: Änderungen abfangen
        // ------------------------------

        // Editor suchen - ggf. auf DOM warten
        editor = findEditor();

        if (!editor) {
            // PlantUML lädt den Editor ggf. dynamisch - mit MutationObserver warten
            console.log('[EMPC4 Collab] Warte auf Editor...');
            const observer = new MutationObserver(function () {
                editor = findEditor();
                if (editor) {
                    observer.disconnect();
                    attachEditorListeners(editor);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        } else {
            attachEditorListeners(editor);
        }

        function attachEditorListeners(textarea) {
            console.log('[EMPC4 Collab] Editor-Listener aktiv');

            textarea.addEventListener('input', function () {
                if (isRemoteUpdate) return;

                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(function () {
                    socket.emit('diagram_update', {
                        room: roomId,
                        text: textarea.value,
                        cursor: textarea.selectionStart,
                    });
                    console.log('[EMPC4 Collab] Update gesendet: ' + textarea.value.length + ' Zeichen');
                }, CONFIG.debounceMs);
            });

            // Auch keyup für ältere Browser
            textarea.addEventListener('keyup', function () {
                if (isRemoteUpdate) return;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
            });
        }
    }

    // -------------------------------------------------------
    // PlantUML interne Vorschau aktualisieren
    // Jetty PlantUML hat einen Submit-Button oder Auto-Refresh
    // -------------------------------------------------------
    function triggerEditorUpdate(editor) {
        // Versuche verschiedene Wege die Vorschau zu aktualisieren

        // 1. Native input/change Event
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        editor.dispatchEvent(new Event('change', { bubbles: true }));

        // 2. Falls es einen Refresh-Button gibt
        const refreshBtn = document.querySelector(
            'button[type="submit"], input[type="submit"], #refresh, .refresh, button.btn-primary'
        );
        if (refreshBtn) {
            // Nicht direkt klicken - würde Seite neu laden
            // Stattdessen das Form-Submit-Event feuern
            const form = editor.closest('form');
            if (form) {
                // Manche PlantUML-Versionen reagieren auf form change
                form.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        // 3. Falls PlantUML einen globalen Update-Handler hat
        if (typeof window.plantumlUpdate === 'function') {
            window.plantumlUpdate();
        }
        if (typeof window.refresh === 'function') {
            window.refresh();
        }
    }

    // -------------------------------------------------------
    // UI: Status-Badge + Share-Button injizieren
    // -------------------------------------------------------
    function injectUI(roomId) {
        // Container
        const container = document.createElement('div');
        container.id = CONFIG.cssPrefix + '-container';
        container.innerHTML = buildUIHTML(roomId);

        // CSS einfügen
        const style = document.createElement('style');
        style.textContent = buildUICSS();
        document.head.appendChild(style);

        document.body.appendChild(container);

        // Event: Share-Button
        const shareBtn = document.getElementById(CONFIG.cssPrefix + '-share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', function () {
                const url = buildShareUrl();
                navigator.clipboard.writeText(url).then(function () {
                    shareBtn.textContent = '✓ Kopiert!';
                    setTimeout(function () {
                        shareBtn.textContent = '🔗 URL teilen';
                    }, 2000);
                }).catch(function () {
                    // Fallback für Browser ohne Clipboard API
                    prompt('URL zum Teilen:', url);
                });
            });
        }

        // Event: Neuer Room-Button (wenn kein Room aktiv)
        const newRoomBtn = document.getElementById(CONFIG.cssPrefix + '-new-room-btn');
        if (newRoomBtn) {
            newRoomBtn.addEventListener('click', function () {
                const newRoom = generateRoomId();
                const url = buildShareUrl(newRoom);
                window.location.href = url;
            });
        }
    }

    function buildShareUrl(roomId) {
        const id = roomId || getRoomId();
        const url = new URL(window.location.href);
        if (id) {
            url.searchParams.set(CONFIG.roomParam, id);
        }
        return url.toString();
    }

    function generateRoomId() {
        // Kurze lesbare Room-ID
        return Math.random().toString(36).substring(2, 8);
    }

    function buildUIHTML(roomId) {
        if (roomId) {
            return `
                <div id="${CONFIG.cssPrefix}-panel">
                    <div id="${CONFIG.cssPrefix}-status-dot" class="dot-connecting"></div>
                    <span id="${CONFIG.cssPrefix}-status-text">Verbinde...</span>
                    <span id="${CONFIG.cssPrefix}-users" title="Aktive Nutzer"></span>
                    <button id="${CONFIG.cssPrefix}-share-btn">🔗 URL teilen</button>
                </div>
            `;
        } else {
            return `
                <div id="${CONFIG.cssPrefix}-panel" class="inactive">
                    <span>👥 Collaboration</span>
                    <button id="${CONFIG.cssPrefix}-new-room-btn">Starten</button>
                </div>
            `;
        }
    }

    function buildUICSS() {
        const p = '#' + CONFIG.cssPrefix;
        return `
            ${p}-panel {
                position: fixed;
                bottom: 1rem;
                right: 1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                background: rgba(0,0,0,0.85);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 8px;
                padding: 0.5rem 0.8rem;
                font-size: 0.8rem;
                color: rgba(255,255,255,0.9);
                z-index: 9990;
                font-family: system-ui, sans-serif;
                box-shadow: 0 2px 12px rgba(0,0,0,0.3);
            }
            ${p}-panel.inactive {
                opacity: 0.7;
            }
            ${p}-panel button {
                background: rgba(74,158,255,0.2);
                border: 1px solid rgba(74,158,255,0.4);
                color: #4a9eff;
                border-radius: 5px;
                padding: 0.2rem 0.6rem;
                cursor: pointer;
                font-size: 0.78rem;
                transition: all 0.2s;
            }
            ${p}-panel button:hover {
                background: rgba(74,158,255,0.35);
            }
            ${p}-status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                flex-shrink: 0;
            }
            .dot-connecting { background: #f59e0b; animation: pulse 1s infinite; }
            .dot-connected   { background: #22c55e; }
            .dot-disconnected{ background: #ef4444; }
            .dot-error       { background: #ef4444; }
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50%       { opacity: 0.3; }
            }
            ${p}-users:not(:empty)::before { content: '👥 '; }
        `;
    }

    // -------------------------------------------------------
    // Status-Anzeige aktualisieren
    // -------------------------------------------------------
    function setStatus(state, text) {
        const dot = document.getElementById(CONFIG.cssPrefix + '-status-dot');
        const label = document.getElementById(CONFIG.cssPrefix + '-status-text');
        if (dot) {
            dot.className = 'dot-' + state;
        }
        if (label) {
            label.textContent = text;
        }
    }

    function setUserCount(count) {
        const el = document.getElementById(CONFIG.cssPrefix + '-users');
        if (el) {
            el.textContent = count > 0 ? count : '';
        }
    }

    console.log('[EMPC4 Collab] Client geladen. Room-Param: ' + (getRoomId() || 'keiner'));

})();
