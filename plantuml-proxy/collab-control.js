/**
 * PlantUML Collaboration Opt-in Control
 * EMPC4 Architecture Visualization Stack
 * 
 * MUST be loaded in <head> AFTER socket.io.min.js but BEFORE sync.js (Jetty built-in)
 * 
 * Purpose:
 * - Intercept Socket.IO to block automatic join from sync.js
 * - Provide UI toggle for explicit opt-in to collaboration
 * - Three states: Unavailable (red), Off (yellow), On (green)
 */

(function() {
    'use strict';

    // =========================================================================
    // Configuration
    // =========================================================================
    
    const CONFIG = {
        namespace: '/plantuml-sync',
        cssPrefix: 'sync-control',
        debounceMs: 300,
    };

    // =========================================================================
    // State
    // =========================================================================
    
    let syncEnabled = false;
    let connectionState = 'connecting'; // 'unavailable' | 'off' | 'on'
    let socket = null;
    let pendingJoinData = null;
    let roomId = null;

    // =========================================================================
    // BroadcastChannel Interception
    // sync.js uses BroadcastChannel for same-origin tab sync - must block this too!
    // =========================================================================
    
    const originalBroadcastChannel = window.BroadcastChannel;
    
    if (originalBroadcastChannel) {
        window.BroadcastChannel = function(name) {
            console.log('[Collab Control] BroadcastChannel created:', name);
            
            const channel = new originalBroadcastChannel(name);
            const originalPostMessage = channel.postMessage.bind(channel);
            
            // Intercept postMessage
            channel.postMessage = function(message) {
                if (!syncEnabled) {
                    console.log('[Collab Control] BroadcastChannel blocked (Sync OFF):', name);
                    return; // Block the message
                }
                console.log('[Collab Control] BroadcastChannel allowed (Sync ON):', name);
                return originalPostMessage(message);
            };
            
            // Store reference for later enabling
            if (!window._empc4_channels) window._empc4_channels = [];
            window._empc4_channels.push(channel);
            
            return channel;
        };
        
        // Copy static properties
        Object.keys(originalBroadcastChannel).forEach(function(key) {
            window.BroadcastChannel[key] = originalBroadcastChannel[key];
        });
        
        console.log('[Collab Control] BroadcastChannel interceptor installed');
    }

    // =========================================================================
    // Socket.IO Interception
    // Patch io() to intercept the socket created by sync.js
    // =========================================================================
    
    if (typeof io === 'undefined') {
        console.error('[Collab Control] Socket.IO not loaded! Cannot intercept.');
        return;
    }

    const originalIO = io;
    
    // Override global io()
    window.io = function(uri, opts) {
        console.log('[Collab Control] io() called with:', uri);
        
        // Create the actual socket
        socket = originalIO.call(this, uri, opts);
        
        // Store reference to original emit
        const originalEmit = socket.emit.bind(socket);
        
        // Intercept emit
        socket.emit = function(event, ...args) {
            // Block 'join' event unless sync is enabled
            if (event === 'join') {
                pendingJoinData = args[0];
                roomId = pendingJoinData?.room || 'default';
                console.log('[Collab Control] Intercepted join for room:', roomId);
                
                if (!syncEnabled) {
                    console.log('[Collab Control] Sync OFF - join blocked. Click button to enable.');
                    updateUI('off');
                    return socket; // Don't emit, return socket for chaining
                } else {
                    console.log('[Collab Control] Sync ON - allowing join');
                }
            }
            
            // Block 'diagram_update' and 'cursor_update' if sync disabled
            if ((event === 'diagram_update' || event === 'cursor_update') && !syncEnabled) {
                // Silently drop - user is in solo mode
                return socket;
            }
            
            return originalEmit(event, ...args);
        };
        
        // Listen for connection events
        socket.on('connect', function() {
            console.log('[Collab Control] WebSocket connected');
            if (connectionState === 'unavailable') {
                updateUI('off');
            }
        });
        
        socket.on('connect_error', function(err) {
            console.error('[Collab Control] Connection error:', err.message);
            updateUI('unavailable');
        });
        
        socket.on('disconnect', function(reason) {
            console.log('[Collab Control] Disconnected:', reason);
            if (reason === 'io server disconnect' || reason === 'transport close') {
                updateUI('unavailable');
            }
        });
        
        // Expose method to actually send the join
        socket._empc4_doJoin = function() {
            if (pendingJoinData) {
                console.log('[Collab Control] Executing delayed join for room:', roomId);
                originalEmit('join', pendingJoinData);
            }
        };
        
        // Expose method to leave room
        socket._empc4_doLeave = function() {
            if (roomId) {
                console.log('[Collab Control] Leaving room:', roomId);
                originalEmit('leave', { room: roomId });
            }
        };
        
        return socket;
    };

    // Copy static properties from original io
    Object.keys(originalIO).forEach(function(key) {
        window.io[key] = originalIO[key];
    });

    console.log('[Collab Control] Socket.IO interceptor installed');

    // =========================================================================
    // Toggle Function
    // =========================================================================
    
    function toggleSync() {
        if (connectionState === 'unavailable') {
            console.log('[Collab Control] Cannot toggle - connection unavailable');
            return;
        }
        
        syncEnabled = !syncEnabled;
        
        if (syncEnabled) {
            // Join room now
            if (socket && socket._empc4_doJoin) {
                socket._empc4_doJoin();
            }
            updateUI('on');
            console.log('[Collab Control] Sync ENABLED');
        } else {
            // Leave room
            if (socket && socket._empc4_doLeave) {
                socket._empc4_doLeave();
            }
            updateUI('off');
            console.log('[Collab Control] Sync DISABLED');
        }
    }

    // Expose globally for button onclick
    window.EMPC4_toggleSync = toggleSync;

    // =========================================================================
    // UI Creation & Update
    // =========================================================================
    
    function createUI() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createUI);
            return;
        }

        // Find insertion point - look for "Collaboration Active (Monaco)" text
        // This is in the PlantUML Monaco editor header
        const insertionPoint = findInsertionPoint();
        
        // Create container
        const container = document.createElement('div');
        container.id = CONFIG.cssPrefix;
        container.className = CONFIG.cssPrefix;
        container.innerHTML = `
            <span class="${CONFIG.cssPrefix}-indicator ${CONFIG.cssPrefix}-connecting">●</span>
            <span class="${CONFIG.cssPrefix}-label">Sync: Connecting...</span>
            <button class="${CONFIG.cssPrefix}-toggle" onclick="EMPC4_toggleSync()" title="Enable collaboration sync" disabled>▶</button>
        `;
        
        if (insertionPoint) {
            insertionPoint.parentNode.insertBefore(container, insertionPoint.nextSibling);
            console.log('[Collab Control] UI inserted after collaboration indicator');
        } else {
            // Fallback: fixed position
            container.classList.add(CONFIG.cssPrefix + '-floating');
            document.body.appendChild(container);
            console.log('[Collab Control] UI inserted as floating element (fallback)');
        }
        
        // Initial state
        setTimeout(function() {
            if (socket && socket.connected) {
                updateUI('off');
            } else {
                updateUI('connecting');
            }
        }, 1000);
    }
    
    function findInsertionPoint() {
        // Try to find the "Collaboration Active (Monaco)" span
        const allSpans = document.querySelectorAll('span');
        for (let i = 0; i < allSpans.length; i++) {
            if (allSpans[i].textContent.includes('Collaboration Active')) {
                return allSpans[i];
            }
        }
        
        // Try common PlantUML header locations
        const headerSelectors = [
            '.editor-header',
            '.toolbar',
            '#header',
            '.navbar',
            'header',
        ];
        
        for (const selector of headerSelectors) {
            const el = document.querySelector(selector);
            if (el) return el;
        }
        
        return null;
    }
    
    function updateUI(state) {
        connectionState = state;
        
        const indicator = document.querySelector('.' + CONFIG.cssPrefix + '-indicator');
        const label = document.querySelector('.' + CONFIG.cssPrefix + '-label');
        const button = document.querySelector('.' + CONFIG.cssPrefix + '-toggle');
        
        if (!indicator || !label || !button) {
            // UI not yet created, retry
            setTimeout(function() { updateUI(state); }, 100);
            return;
        }
        
        // Remove all state classes
        indicator.className = CONFIG.cssPrefix + '-indicator';
        
        switch(state) {
            case 'unavailable':
                indicator.classList.add(CONFIG.cssPrefix + '-unavailable');
                indicator.textContent = '●';
                label.textContent = 'Sync: Unavailable';
                button.disabled = true;
                button.textContent = '▶';
                button.title = 'Sync service not available';
                break;
                
            case 'connecting':
                indicator.classList.add(CONFIG.cssPrefix + '-connecting');
                indicator.textContent = '●';
                label.textContent = 'Sync: Connecting...';
                button.disabled = true;
                button.textContent = '▶';
                button.title = 'Connecting to sync service...';
                break;
                
            case 'off':
                indicator.classList.add(CONFIG.cssPrefix + '-off');
                indicator.textContent = '●';
                label.textContent = 'Sync: Off';
                button.disabled = false;
                button.textContent = '▶';
                button.title = 'Click to enable collaboration sync';
                break;
                
            case 'on':
                indicator.classList.add(CONFIG.cssPrefix + '-on');
                indicator.textContent = '●';
                label.textContent = 'Sync: On';
                button.disabled = false;
                button.textContent = '⏹';
                button.title = 'Click to disable collaboration sync';
                break;
        }
    }

    // =========================================================================
    // Inject CSS
    // =========================================================================
    
    function injectCSS() {
        const style = document.createElement('style');
        style.textContent = `
            .${CONFIG.cssPrefix} {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 4px 12px;
                margin-left: 12px;
                background: rgba(0, 0, 0, 0.7);
                border-radius: 6px;
                font-family: 'Segoe UI', system-ui, sans-serif;
                font-size: 13px;
                vertical-align: middle;
            }
            
            .${CONFIG.cssPrefix}-floating {
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 9999;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            }
            
            .${CONFIG.cssPrefix}-indicator {
                font-size: 14px;
                line-height: 1;
            }
            
            .${CONFIG.cssPrefix}-unavailable {
                color: #f44336;
            }
            
            .${CONFIG.cssPrefix}-connecting {
                color: #ff9800;
                animation: sync-pulse 1s ease-in-out infinite;
            }
            
            .${CONFIG.cssPrefix}-off {
                color: #ffeb3b;
            }
            
            .${CONFIG.cssPrefix}-on {
                color: #4caf50;
            }
            
            .${CONFIG.cssPrefix}-label {
                color: #ffffff;
                min-width: 100px;
            }
            
            .${CONFIG.cssPrefix}-toggle {
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: #ffffff;
                padding: 3px 10px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            }
            
            .${CONFIG.cssPrefix}-toggle:hover:not(:disabled) {
                background: rgba(255, 255, 255, 0.15);
                border-color: rgba(255, 255, 255, 0.5);
            }
            
            .${CONFIG.cssPrefix}-toggle:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            @keyframes sync-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.4; }
            }
        `;
        
        if (document.head) {
            document.head.appendChild(style);
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                document.head.appendChild(style);
            });
        }
    }

    // =========================================================================
    // Initialize
    // =========================================================================
    
    injectCSS();
    
    // Create UI when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createUI);
    } else {
        createUI();
    }

    console.log('[Collab Control] Initialized - Sync disabled by default');

})();
