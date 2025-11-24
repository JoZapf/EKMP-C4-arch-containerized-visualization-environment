/**
 * Mermaid Live Editor - Debug Script
 * Analysiert verfügbare Editor-APIs im Browser
 */

(function() {
    'use strict';

    console.log('=== MERMAID DEBUG: Start Analysis ===');

    // 1. Monaco Editor Check
    console.log('\n--- Monaco Editor ---');
    console.log('window.monaco exists:', !!window.monaco);
    if (window.monaco) {
        console.log('window.monaco.editor exists:', !!window.monaco.editor);
        if (window.monaco.editor) {
            console.log('typeof getModels:', typeof window.monaco.editor.getModels);
            console.log('typeof getEditors:', typeof window.monaco.editor.getEditors);
            
            try {
                const models = window.monaco.editor.getModels();
                console.log('getModels() result:', models);
                console.log('Number of models:', models?.length);
                if (models && models.length > 0) {
                    console.log('Model[0] methods:', Object.keys(models[0]).filter(k => typeof models[0][k] === 'function'));
                    console.log('Current value length:', models[0].getValue().length);
                }
            } catch (e) {
                console.error('getModels() error:', e);
            }
        }
    }

    // 2. DOM Elements
    console.log('\n--- DOM Elements ---');
    const monacoElements = document.querySelectorAll('.monaco-editor');
    console.log('.monaco-editor elements:', monacoElements.length);
    if (monacoElements.length > 0) {
        console.log('First monaco-editor keys:', Object.keys(monacoElements[0]).filter(k => k.includes('monaco') || k.includes('editor')));
    }

    const textareas = document.querySelectorAll('textarea');
    console.log('textarea elements:', textareas.length);
    if (textareas.length > 0) {
        console.log('First textarea classes:', textareas[0].className);
        console.log('First textarea value length:', textareas[0].value.length);
    }

    // 3. Window Objects
    console.log('\n--- Window Objects (Svelte Stores?) ---');
    const storeKeys = Object.keys(window).filter(k => 
        k.toLowerCase().includes('store') || 
        k.toLowerCase().includes('code') || 
        k.toLowerCase().includes('state') ||
        k.toLowerCase().includes('svelte')
    );
    console.log('Potential store keys:', storeKeys);
    
    storeKeys.forEach(key => {
        const obj = window[key];
        if (obj && typeof obj === 'object') {
            console.log(`${key}:`, {
                hasSet: typeof obj.set === 'function',
                hasUpdate: typeof obj.update === 'function',
                hasSubscribe: typeof obj.subscribe === 'function'
            });
        }
    });

    // 4. Try to find Svelte Component
    console.log('\n--- Svelte Component ---');
    const allElements = document.querySelectorAll('*');
    let svelteFound = false;
    allElements.forEach(elem => {
        const keys = Object.keys(elem);
        const svelteKeys = keys.filter(k => k.includes('svelte') || k.includes('__'));
        if (svelteKeys.length > 0 && !svelteFound) {
            console.log('Element with Svelte properties:', elem.tagName, svelteKeys);
            svelteFound = true;
        }
    });

    console.log('=== MERMAID DEBUG: End Analysis ===\n');
})();
