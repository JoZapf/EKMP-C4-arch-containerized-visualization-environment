/**
 * Global Navigation Menu for EKMP-C4 ARCHITEKTUR VISUALISIERUNGS STACK
 * SPEZIELLE VERSION FÜR TRAEFIK DASHBOARD
 * 
 * Diese Version verwendet absolute URLs zu http://arch.local/
 * da das Traefik Dashboard auf einem separaten Port (9090) läuft.
 */

(function() {
    'use strict';
    
    // Basis-URL für alle Services (Traefik Dashboard ist auf separatem Port!)
    const BASE_URL = 'http://arch.local';
    
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
        
        // Navigation items mit absoluten URLs
        const navItems = [
            { href: BASE_URL + '/', icon: '🏠', text: 'Dashboard', id: 'dashboard' },
            { href: BASE_URL + '/docs/index.html', icon: '📚', text: 'Dokumentation', id: 'docs' },
            { href: BASE_URL + '/kroki', icon: '🎯', text: 'Kroki Service', id: 'kroki' },
            { href: BASE_URL + '/plantuml', icon: '🎨', text: 'PlantUML Server', id: 'plantuml' },
            { href: BASE_URL + '/mermaid', icon: '📊', text: 'Mermaid Editor', id: 'mermaid' },
            { href: BASE_URL + '/whiteboard', icon: '✏️', text: 'Excalidraw Server', id: 'whiteboard' },
            { href: 'http://localhost:9090/dashboard/', icon: '⚙️', text: 'Traefik Dashboard', id: 'traefik', active: true },
            { href: 'https://github.com/JoZapf/EMPC4-containerized-visualization-environment', icon: '💻', text: 'GitHub Repository', id: 'github', target: '_blank' }
        ];
        
        navMenu.innerHTML = navItems.map(item => {
            const target = item.target || '_self';
            const activeClass = item.active ? ' active' : '';
            
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
        
        // Close menu when clicking on a link
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
                navToggle.focus();
            }
        });
        
        function closeMenu() {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
        }
        
        console.log('[EMPC4] Global navigation initialized (Traefik Dashboard version)');
    }
})();
