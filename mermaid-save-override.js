/**
 * Mermaid Live Editor - Save Button Override
 * Überschreibt den "Save Diagram" Button um lokale .mmd Datei zu speichern
 * statt zum Bezahldienst zu führen
 */

(function() {
    'use strict';

    console.log('Mermaid Save Override: Initializing...');

    // Warte bis DOM geladen ist
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        // Versuche mehrfach, den Button zu finden (da SvelteKit dynamisch lädt)
        let attempts = 0;
        const maxAttempts = 20;
        const interval = setInterval(() => {
            attempts++;
            
            if (findAndOverrideButton() || attempts >= maxAttempts) {
                clearInterval(interval);
                if (attempts >= maxAttempts) {
                    console.warn('Mermaid Save Override: Could not find save button after', maxAttempts, 'attempts');
                }
            }
        }, 500);
    }

    function findAndOverrideButton() {
        // Verschiedene Selektoren ausprobieren
        const selectors = [
            'button[aria-label*="save" i]',
            'button[title*="save" i]',
            'button:has(svg):has(*[class*="save" i])',
            '[data-test*="save" i]',
            'a[href*="mermaid.live/edit"]', // Falls es ein Link ist
            'button:contains("Save")', // jQuery-Style (funktioniert nicht nativ, aber als Fallback)
        ];

        let saveButton = null;

        // Durchsuche alle Buttons nach Text-Inhalt
        const allButtons = document.querySelectorAll('button, a[role="button"]');
        for (const btn of allButtons) {
            const text = btn.textContent.toLowerCase();
            const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
            const title = (btn.getAttribute('title') || '').toLowerCase();
            
            if (text.includes('save') || ariaLabel.includes('save') || title.includes('save')) {
                // Prüfe ob es der richtige Button ist (nicht "Save as PNG" o.ä.)
                if (!text.includes('png') && !text.includes('svg') && !text.includes('image')) {
                    saveButton = btn;
                    break;
                }
            }
        }

        if (!saveButton) {
            // Versuche Selector-basierte Suche
            for (const selector of selectors) {
                try {
                    saveButton = document.querySelector(selector);
                    if (saveButton) break;
                } catch (e) {
                    // Selector nicht unterstützt, weitermachen
                }
            }
        }

        if (saveButton) {
            console.log('Mermaid Save Override: Found save button', saveButton);
            overrideButton(saveButton);
            return true;
        }

        return false;
    }

    function overrideButton(button) {
        // Entferne alle bestehenden Event Listener durch Klonen
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        // Füge neuen Click Handler hinzu
        newButton.addEventListener('click', handleSaveClick);
        
        // Falls es ein Link ist, verhindere Navigation
        if (newButton.tagName === 'A') {
            newButton.href = '#';
        }

        console.log('Mermaid Save Override: Button successfully overridden');
    }

    async function handleSaveClick(event) {
        event.preventDefault();
        event.stopPropagation();

        console.log('Mermaid Save Override: Save button clicked');

        // Extrahiere Diagramm-Code
        const code = await extractDiagramCode();
        
        if (!code) {
            alert('Could not extract diagram code. Please copy the code manually.');
            return;
        }

        // Speichere als .mmd Datei
        saveDiagramToFile(code);
    }

    async function extractDiagramCode() {
        let code = null;
        
        // STRATEGIE 1: Suche im DOM nach dem Editor-Content
        // Mermaid Live hat eine versteckte View/State der den kompletten Code enthält
        console.log('Mermaid Save Override: Searching for code in DOM...');
        
        // Methode A: Suche nach .view-lines > .view-line (Monaco Editor DOM)
        // DEBUG: Finde ALLE .view-lines im DOM (Monaco hat oft mehrere für Minimap, etc.)
        const allViewLines = document.querySelectorAll('.view-lines');
        console.log('Mermaid Save Override: DEBUG - Found', allViewLines.length, '.view-lines elements');
        
        // Analysiere jede .view-lines
        allViewLines.forEach((vl, idx) => {
            const lineCount = vl.querySelectorAll('.view-line').length;
            const role = vl.getAttribute('role');
            const parent = vl.parentElement?.className || 'unknown';
            console.log(`  [${idx}] .view-lines: ${lineCount} lines, role="${role}", parent="${parent}"`);
            
            // Zeige ersten Text-Sample
            if (lineCount > 0) {
                const firstLine = vl.querySelector('.view-line');
                const sample = firstLine?.textContent?.substring(0, 50) || 'empty';
                console.log(`  [${idx}] Sample: "${sample}..."`);
            }
        });
        
        // WICHTIG: Nimm die .view-lines mit den MEISTEN Zeilen!
        // (Minimap und andere Views haben oft weniger Zeilen)
        const sortedByLines = Array.from(allViewLines).sort((a, b) => {
            return b.querySelectorAll('.view-line').length - a.querySelectorAll('.view-line').length;
        });
        const viewLines = sortedByLines[0];  // Die mit den MEISTEN Zeilen
        
        if (viewLines) {
            // Extrahiere Text aus allen DIREKTEN view-line Children
            const lines = Array.from(viewLines.children).filter(el => el.classList.contains('view-line'));
            console.log('Mermaid Save Override: Using .view-lines[0] with', lines.length, 'lines');
            if (lines.length > 0) {
                code = lines.map(line => {
                    // WICHTIG: Nutze NUR textContent direkt!
                    // Monaco kann versteckte Duplikate haben (Line Numbers, etc.)
                    let text = line.textContent || '';
                    
                    // DEDUPLIZIERUNG: Prüfe ob Text doppelt ist
                    // Wenn erste Hälfte == zweite Hälfte, nimm nur erste Hälfte
                    if (text.length > 2) {
                        const mid = Math.floor(text.length / 2);
                        const firstHalf = text.substring(0, mid);
                        const secondHalf = text.substring(mid);
                        
                        // Prüfe exakte Duplikation
                        if (firstHalf === secondHalf) {
                            console.log('  Line is duplicated, using first half only');
                            text = firstHalf;
                        }
                        // Prüfe mit Toleranz (Whitespace-Unterschiede)
                        else if (firstHalf.trim() === secondHalf.trim()) {
                            console.log('  Line is duplicated (whitespace diff), using first half');
                            text = firstHalf;
                        }
                    }
                    
                    return text;
                }).join('\n');
                
                // Entferne mögliche Monaco-Artefakte
                code = code.replace(/\u200B/g, ''); // Zero-Width Space
                code = code.replace(/\uFEFF/g, ''); // Zero-Width No-Break Space
                
                if (code && code.length > 20) {
                    // Debug: Zeige erste Zeilen
                    const preview = code.split('\n').slice(0, 3).join('\n');
                    console.log('Mermaid Save Override: Code preview (first 3 lines):\n' + preview);
                    console.log('Mermaid Save Override: ✓ Extracted code from DOM (.view-lines)', code.length, 'chars');
                    return code;
                }
            }
        }
        
        // Methode A2: Fallback - Suche direkt nach .lines-content (Monaco's Container)
        const linesContent = document.querySelector('.lines-content.monaco-editor-background');
        if (linesContent && linesContent.textContent) {
            const text = linesContent.textContent.trim();
            if (text.length > 20 && (text.includes('graph') || text.includes('flowchart'))) {
                code = text;
                console.log('Mermaid Save Override: ✓ Extracted from .lines-content', code.length, 'chars');
                return code;
            }
        }
        
        // Methode B: Suche nach contenteditable div
        const editableDivs = document.querySelectorAll('[contenteditable="true"]');
        for (const div of editableDivs) {
            const text = div.textContent || div.innerText;
            if (text && text.length > 20 && (text.includes('graph') || text.includes('flowchart'))) {
                code = text;
                console.log('Mermaid Save Override: ✓ Extracted code from contenteditable div', code.length, 'chars');
                return code;
            }
        }
        
        // Methode C: Suche nach .monaco-editor und extrahiere Text
        const monacoEditor = document.querySelector('.monaco-editor');
        if (monacoEditor) {
            // Versuche Text aus Monaco DOM zu extrahieren
            const editorContent = monacoEditor.querySelector('.monaco-editor-background')?.parentElement;
            if (editorContent) {
                const text = editorContent.textContent || editorContent.innerText;
                if (text && text.length > 20) {
                    code = text;
                    console.log('Mermaid Save Override: ✓ Extracted code from .monaco-editor DOM', code.length, 'chars');
                    return code;
                }
            }
        }
        
        // STRATEGIE 2: URL Hash dekomprimieren (falls möglich)
        if (window.location.hash && window.location.hash.startsWith('#pako:')) {
            try {
                console.log('Mermaid Save Override: Trying URL hash decompression...');
                
                // Lade pako falls nicht verfügbar
                if (typeof pako === 'undefined') {
                    console.log('Mermaid Save Override: Loading pako from CDN...');
                    await loadPako();
                }
                
                const base64 = window.location.hash.substring(6);
                
                // Versuche direkt zu dekodieren (ohne cleaning)
                try {
                    const compressed = atob(base64);
                    const bytes = new Uint8Array(compressed.length);
                    for (let i = 0; i < compressed.length; i++) {
                        bytes[i] = compressed.charCodeAt(i);
                    }
                    
                    const decompressed = pako.inflate(bytes, { to: 'string' });
                    const state = JSON.parse(decompressed);
                    
                    if (state && state.code) {
                        code = state.code;
                        console.log('Mermaid Save Override: ✓ Extracted from URL hash', code.length, 'chars');
                        return code;
                    }
                } catch (e) {
                    console.warn('Mermaid Save Override: Direct atob failed, trying with cleanup...');
                    
                    // Fallback: Cleanup und nochmal versuchen
                    let cleanBase64 = base64.replace(/ /g, '+').replace(/\s/g, '');
                    
                    const compressed = atob(cleanBase64);
                    const bytes = new Uint8Array(compressed.length);
                    for (let i = 0; i < compressed.length; i++) {
                        bytes[i] = compressed.charCodeAt(i);
                    }
                    
                    const decompressed = pako.inflate(bytes, { to: 'string' });
                    const state = JSON.parse(decompressed);
                    
                    if (state && state.code) {
                        code = state.code;
                        console.log('Mermaid Save Override: ✓ Extracted from URL hash (cleaned)', code.length, 'chars');
                        return code;
                    }
                }
            } catch (e) {
                console.error('Mermaid Save Override: URL hash extraction failed:', e.message);
            }
        }
        
        // STRATEGIE 3: Monaco Editor API (falls verfügbar)
        if (window.monaco && window.monaco.editor) {
            const editors = window.monaco.editor.getEditors();
            if (editors && editors.length > 0) {
                code = editors[0].getValue();
                console.log('Mermaid Save Override: ✓ Extracted from Monaco API', code.length, 'chars');
                return code;
            }
        }

        // STRATEGIE 4: CodeMirror
        if (window.CodeMirror) {
            const cmElements = document.querySelectorAll('.CodeMirror');
            if (cmElements.length > 0 && cmElements[0].CodeMirror) {
                code = cmElements[0].CodeMirror.getValue();
                console.log('Mermaid Save Override: ✓ Extracted from CodeMirror', code.length, 'chars');
                return code;
            }
        }

        // STRATEGIE 5: Textarea (LETZTER FALLBACK - kann unvollständig sein!)
        const textareas = document.querySelectorAll('textarea');
        for (const textarea of textareas) {
            if (textarea.value && (textarea.value.includes('graph') || textarea.value.includes('flowchart'))) {
                code = textarea.value;
                console.warn('Mermaid Save Override: ⚠️ Extracted from textarea (may be incomplete!)', code.length, 'chars');
                return code;
            }
        }

        // STRATEGIE 6: LocalStorage
        if (!code && localStorage) {
            try {
                const stored = localStorage.getItem('mermaid');
                if (stored) {
                    code = stored;
                    console.log('Mermaid Save Override: ✓ Extracted from localStorage', code.length, 'chars');
                }
            } catch (e) {
                console.warn('Mermaid Save Override: Could not access localStorage', e);
            }
        }

        if (!code) {
            console.error('Mermaid Save Override: ❌ Could not extract diagram code from any source');
        }

        return code;
    }

    function loadPako() {
        return new Promise((resolve, reject) => {
            if (typeof pako !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js';
            script.onload = () => {
                console.log('Mermaid Save Override: pako loaded from CDN');
                resolve();
            };
            script.onerror = () => {
                console.error('Mermaid Save Override: Failed to load pako from CDN');
                reject(new Error('Failed to load pako'));
            };
            document.head.appendChild(script);
        });
    }

    function saveDiagramToFile(code) {
        // Erzeuge Dateinamen mit Timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `mermaid-diagram-${timestamp}.mmd`;

        // Erstelle Blob
        const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });

        // Erstelle Download Link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        
        // Trigger Download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Cleanup
        setTimeout(() => URL.revokeObjectURL(url), 100);

        console.log('Mermaid Save Override: File saved as', filename);
    }

})();
