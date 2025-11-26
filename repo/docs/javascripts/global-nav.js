// Global Navigation Menu for EMPC4 VIS Stack

document.addEventListener('DOMContentLoaded', function() {
    // Create hamburger menu button
    const navToggle = document.createElement('div');
    navToggle.className = 'empc4-nav-toggle md-header__button';
    navToggle.innerHTML = `
        <div class="empc4-hamburger">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;

    // Create dropdown menu
    const navMenu = document.createElement('div');
    navMenu.className = 'empc4-nav-menu';
    navMenu.innerHTML = `
        <a href="/">
            <span class="nav-icon">🏠</span>
            <span>Dashboard</span>
        </a>
        <a href="/docs/index.html">
            <span class="nav-icon">📚</span>
            <span>Dokumentation</span>
        </a>
        <a href="/kroki">
            <span class="nav-icon">🎯</span>
            <span>Kroki Service</span>
        </a>
        <a href="/plantuml">
            <span class="nav-icon">🎨</span>
            <span>PlantUML Server</span>
        </a>
        <a href="/mermaid">
            <span class="nav-icon">📊</span>
            <span>Mermaid Editor</span>
        </a>
        <a href="/whiteboard">
            <span class="nav-icon">✏️</span>
            <span>Excalidraw Server</span>
        </a>
        <a href="http://localhost:8080" target="_blank">
            <span class="nav-icon">⚙️</span>
            <span>Traefik Dashboard</span>
        </a>
        <a href="https://github.com/JoZapf/EMPC4-containerized-visualization-environment" target="_blank">
            <span class="nav-icon">💻</span>
            <span>GitHub Repository</span>
        </a>
    `;

    // Insert menu button into header (after search)
    const header = document.querySelector('.md-header__inner');
    if (header) {
        header.appendChild(navToggle);
        document.body.appendChild(navMenu);

        // Toggle menu
        navToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });

        // Close menu when clicking on a link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });

        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }
});
