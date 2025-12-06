/**
 * Global Navigation Menu for EKMP-C4 ARCHITEKTUR VISUALISIERUNGS STACK
 * Wiederverwendbar für alle Services
 * 
 * Verwendung:
 * 1. global-nav.css im <head> einbinden
 * 2. global-nav.js am Ende von <body> einbinden
 */

(function() {
    'use strict';
    
    // Warte bis DOM geladen ist
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGlobalNav);
    } else {
        initGlobalNav();
    }
    
    function initGlobalNav() {
        // Prüfe ob Menü bereits existiert
        if (document.querySelector('.empc4-nav-toggle')) {
            return;
        }
        
        // Create hamburger menu button
        const navToggle = document.createElement('button');
        navToggle.className = 'empc4-nav-toggle';
        navToggle.setAttribute('aria-label', 'Navigation öffnen');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.innerHTML = `
            <div class="empc4-hamburger">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        // Create dropdown menu
        const navMenu = document.createElement('nav');
        navMenu.className = 'empc4-nav-menu';
        navMenu.setAttribute('aria-label', 'Globale Navigation');
        
        // Get current path to mark active link
        const currentPath = window.location.pathname;
        
        const navItems = [
            { href: '/', icon: '🏠', text: 'Dashboard', id: 'dashboard' },
            { href: '/docs/index.html', icon: '📚', text: 'Dokumentation', id: 'docs' },
            { href: '/kroki', icon: '🎯', text: 'Kroki Service', id: 'kroki' },
            { href: '/plantuml', icon: '🎨', text: 'PlantUML Server', id: 'plantuml' },
            { href: '/mermaid', icon: '📊', text: 'Mermaid Editor', id: 'mermaid' },
            { href: '/whiteboard', icon: '✏️', text: 'Excalidraw Server', id: 'whiteboard' },
            { href: 'http://localhost:9090', icon: '⚙️', text: 'Traefik Dashboard', id: 'traefik', target: '_blank' },
            { href: 'https://github.com/JoZapf/EMPC4-containerized-visualization-environment', icon: '💻', text: 'GitHub Repository', id: 'github', target: '_blank' }
        ];
        
        navMenu.innerHTML = navItems.map(item => {
            const isActive = currentPath === item.href || 
                            (item.href !== '/' && currentPath.startsWith(item.href));
            const target = item.target || '_self';
            const activeClass = isActive ? ' active' : '';
            
            return `
                <a href="${item.href}" 
                   class="${activeClass}" 
                   data-nav-id="${item.id}"
                   ${target === '_blank' ? 'target="_blank" rel="noopener noreferrer"' : ''}>
                    <span class="nav-icon">${item.icon}</span>
                    <span>${item.text}</span>
                </a>
            `;
        }).join('');
        
        // Insert into page
        document.body.appendChild(navToggle);
        document.body.appendChild(navMenu);
        
        // Toggle menu
        navToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const isActive = navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            navToggle.setAttribute('aria-expanded', isActive.toString());
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                closeMenu();
            }
        });
        
        // Close menu when clicking on a link (except external links)
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function(e) {
                const target = this.getAttribute('target');
                if (target !== '_blank') {
                    closeMenu();
                }
            });
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                closeMenu();
                navToggle.focus(); // Return focus to button
            }
        });
        
        function closeMenu() {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
        }
        
        console.log('[EMPC4] Global navigation initialized');
    }
})();
