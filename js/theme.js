// js/theme.js
// Nextour Day/Night Theme Toggle — persists to localStorage

(function () {
    const STORAGE_KEY = 'nextour_theme';

    // Apply saved theme BEFORE paint to prevent flash
    // Default to LIGHT theme when no preference is saved
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }

    // Toggle function exposed globally
    window.toggleTheme = function () {
        const isCurrentlyLight = document.documentElement.getAttribute('data-theme') === 'light';
        if (isCurrentlyLight) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem(STORAGE_KEY, 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem(STORAGE_KEY, 'light');
        }
        // Update all toggle icons on the page
        updateToggleIcons();
    };

    function updateToggleIcons() {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        document.querySelectorAll('.theme-toggle-thumb').forEach(function (thumb) {
            thumb.textContent = isLight ? '☀️' : '🌙';
        });
    }

    // Expose globally so dynamic re-renders can call it
    window.updateToggleIcons = updateToggleIcons;

    // Once DOM is ready, set initial icon state
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateToggleIcons);
    } else {
        updateToggleIcons();
    }
})();
