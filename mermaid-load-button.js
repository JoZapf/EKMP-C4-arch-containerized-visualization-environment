/**
 * Mermaid Live Editor - Load Button (v3 - URL Hash Strategy)
 * Fügt einen "Load Diagram" Button hinzu zum Laden von .mmd Dateien
 * FIX: Aktualisiert die URL Hash direkt (wie Mermaid Live es macht)
 */

(function() {
    'use strict';

    console.log('Mermaid Load Button: Initializing...');

    // Warte bis DOM geladen ist
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        // Versuche mehrfach, den Save-Button zu finden und Load-Button daneben zu platzieren
        let attempts = 0;
        const maxAttempts = 20;
        const interval = setInterval(() => {
            attempts++;
            
            if (addLoadButton() || attempts >= maxAttempts) {
                clearInterval(interval);
                if (attempts >= maxAttempts) {
                    console.warn('Mermaid Load Button: Could not find toolbar after', maxAttempts, 'attempts');
                    addFloatingLoadButton();
                }
            }
        }, 500);
    }

    function addLoadButton() {
        const saveButton = findSaveButton();
        
        if (!saveButton) {
            return false;
        }

        if (document.getElementById('empc4-load-diagram-btn')) {
            console.log('Mermaid Load Button: Button already exists');
            return true;
        }

        const loadButton = createLoadButton();
        
        if (saveButton.parentNode) {
            saveButton.parentNode.insertBefore(loadButton, saveButton.nextSibling);
            console.log('Mermaid Load Button: Button added next to Save button');
        } else {
            const toolbar = saveButton.closest('[role="toolbar"]') || 
                           saveButton.closest('.toolbar') || 
                           saveButton.closest('header') ||
                           saveButton.parentElement;
            
            if (toolbar) {
                toolbar.appendChild(loadButton);
                console.log('Mermaid Load Button: Button added to toolbar');
            }
        }

        return true;
    }

    function findSaveButton() {
        const allButtons = document.querySelectorAll('button, a[role="button"]');
        for (const btn of allButtons) {
            const text = btn.textContent.toLowerCase();
            const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
            const title = (btn.getAttribute('title') || '').toLowerCase();
            
            if ((text.includes('save') || ariaLabel.includes('save') || title.includes('save')) &&
                !text.includes('png') && !text.includes('svg') && !text.includes('image')) {
                return btn;
            }
        }
        return null;
    }

    function createLoadButton() {
        const button = document.createElement('button');
        button.id = 'empc4-load-diagram-btn';
        button.type = 'button';
        button.setAttribute('aria-label', 'Load Diagram from file');
        button.setAttribute('title', 'Load .mmd file');
        
        button.style.cssText = `
            margin-left: 8px;
            padding: 8px 16px;
            background: #1a73e8;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.background = '#1557b0';
        });
        button.addEventListener('mouseleave', () => {
            button.style.background = '#1a73e8';
        });

        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 10V14H2V10H0V14C0 15.1 0.9 16 2 16H14C15.1 16 16 15.1 16 14V10H14Z" fill="currentColor"/>
                <path d="M13 7L11.59 5.59L9 8.17V0H7V8.17L4.41 5.59L3 7L8 12L13 7Z" fill="currentColor"/>
            </svg>
            <span>Load Diagram</span>
        `;

        button.addEventListener('click', handleLoadClick);

        return button;
    }

    function addFloatingLoadButton() {
        const button = document.createElement('button');
        button.id = 'empc4-load-diagram-btn';
        button.type = 'button';
        button.setAttribute('aria-label', 'Load Diagram from file');
        button.setAttribute('title', 'Load .mmd file');
        
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 80px;
            z-index: 9999;
            padding: 12px 20px;
            background: #1a73e8;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.background = '#1557b0';
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.background = '#1a73e8';
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        });

        button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 10V14H2V10H0V14C0 15.1 0.9 16 2 16H14C15.1 16 16 15.1 16 14V10H14Z" fill="currentColor"/>
                <path d="M13 7L11.59 5.59L9 8.17V0H7V8.17L4.41 5.59L3 7L8 12L13 7Z" fill="currentColor"/>
            </svg>
            <span>Load Diagram</span>
        `;

        button.addEventListener('click', handleLoadClick);

        document.body.appendChild(button);
        console.log('Mermaid Load Button: Floating button added');
    }

    function handleLoadClick(event) {
        event.preventDefault();
        event.stopPropagation();

        console.log('Mermaid Load Button: Load button clicked');

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.mmd,.mermaid,.txt';
        fileInput.style.display = 'none';

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) {
                return;
            }

            console.log('Mermaid Load Button: File selected:', file.name);

            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target.result;
                console.log('Mermaid Load Button: File loaded, length:', content.length);
                
                // Lade in Editor via URL Hash
                if (loadIntoEditor(content)) {
                    console.log('Mermaid Load Button: ✓ Successfully loaded into editor');
                    showNotification('✓ Diagram loaded: ' + file.name, 'success');
                } else {
                    console.error('Mermaid Load Button: ✗ Failed to load diagram');
                    showNotification('✗ Failed to load diagram', 'error');
                }
            };
            reader.onerror = () => {
                console.error('Mermaid Load Button: Failed to read file');
                showNotification('✗ Failed to read file', 'error');
            };
            reader.readAsText(file);

            document.body.removeChild(fileInput);
        });

        document.body.appendChild(fileInput);
        fileInput.click();
    }

    async function loadIntoEditor(content) {
        console.log('Mermaid Load Button: Loading diagram via URL Hash...');
        
        try {
            // Mermaid Live speichert ein State-Objekt komprimiert in der URL Hash
            // Format: #pako:COMPRESSED_JSON
            
            // Prüfe ob pako verfügbar ist (wird von Mermaid Live geladen)
            if (typeof pako === 'undefined') {
                console.warn('Mermaid Load Button: pako not available, trying to load...');
                await loadPako();
            }
            
            // Erstelle das State-Objekt (wie Mermaid Live es macht)
            const state = {
                code: content,
                mermaid: {
                    theme: 'default'
                },
                updateEditor: true,
                autoSync: true,
                updateDiagram: true
            };
            
            // Konvertiere zu JSON
            const json = JSON.stringify(state);
            console.log('Mermaid Load Button: State JSON length:', json.length);
            
            // Komprimiere das JSON
            const compressed = pako.deflate(json, { to: 'string' });
            const base64 = btoa(String.fromCharCode.apply(null, compressed));
            
            // Setze neuen Hash (KEIN encodeURIComponent!)
            // Mermaid Live erwartet RAW Base64 im Hash
            const newHash = '#pako:' + base64;
            console.log('Mermaid Load Button: Setting URL hash (base64 length:', base64.length, ')');
            
            // Aktualisiere URL
            window.location.hash = newHash;
            
            console.log('Mermaid Load Button: ✓ URL hash updated');
            return true;
            
        } catch (e) {
            console.error('Mermaid Load Button: Failed to compress/update hash:', e);
            
            // Fallback: Versuche den Code direkt in textarea zu laden
            console.log('Mermaid Load Button: Trying fallback method...');
            return loadIntoTextareaFallback(content);
        }
    }

    function loadPako() {
        return new Promise((resolve, reject) => {
            if (typeof pako !== 'undefined') {
                resolve();
                return;
            }
            
            // Versuche pako vom CDN zu laden
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js';
            script.onload = () => {
                console.log('Mermaid Load Button: pako loaded from CDN');
                resolve();
            };
            script.onerror = () => {
                console.error('Mermaid Load Button: Failed to load pako');
                reject(new Error('Failed to load pako'));
            };
            document.head.appendChild(script);
        });
    }

    function loadIntoTextareaFallback(content) {
        console.log('Mermaid Load Button: Using textarea fallback...');
        
        const textarea = document.querySelector('textarea');
        if (!textarea) {
            console.error('Mermaid Load Button: No textarea found');
            return false;
        }
        
        // Setze Wert (überschreibe komplett!)
        textarea.value = content;
        textarea.focus();
        
        // Trigger Events
        const events = ['input', 'change', 'keyup', 'blur'];
        events.forEach(eventType => {
            textarea.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
        
        console.log('Mermaid Load Button: ✓ Loaded into textarea');
        return true;
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            padding: 12px 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
        `;

        notification.textContent = message;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

})();
