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

    // Mobile Main Navigation Toggle
    window.toggleMobileMenu = function () {
        const navLinks = document.querySelector('.nav-links');
        const navToggle = document.querySelector('.nav-toggle');
        if (navLinks && navToggle) {
            navLinks.classList.toggle('active');
            navToggle.classList.toggle('active');
        }
    };

    // Close Mobile Menu when clicking a link
    document.addEventListener('click', function (e) {
        const navLinks = document.querySelector('.nav-links');
        const navToggle = document.querySelector('.nav-toggle');
        if (navLinks && navLinks.classList.contains('active')) {
            // If click is outside the nav and toggle, close it
            if (!navLinks.contains(e.target) && !navToggle.contains(e.target)) {
                navLinks.classList.remove('active');
                navToggle.classList.remove('active');
            }
        }
        
        // Close Dashboard Sidebar on click outside or when clicking a menu item
        const sidebar = document.querySelector('.sidebar');
        const sidebarToggle = document.querySelector('.sidebar-toggle-btn');
        if (sidebar && sidebar.classList.contains('active')) {
            const clickedMenuItem = e.target.closest('.sidebar-menu button, .sidebar-menu a');
            if (clickedMenuItem || (!sidebar.contains(e.target) && (!sidebarToggle || !sidebarToggle.contains(e.target)))) {
                sidebar.classList.remove('active');
            }
        }
    });

    // Close mobile nav links when clicking individual nav links
    document.addEventListener('DOMContentLoaded', function () {
        const navLinksList = document.querySelectorAll('.nav-links a');
        navLinksList.forEach(link => {
            link.addEventListener('click', () => {
                const navLinks = document.querySelector('.nav-links');
                const navToggle = document.querySelector('.nav-toggle');
                if (navLinks) navLinks.classList.remove('active');
                if (navToggle) navToggle.classList.remove('active');
            });
        });
    });

    // Mobile Dashboard Sidebar Toggle
    window.toggleSidebar = function () {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('active');
        }
    };

    // Once DOM is ready, set initial icon state
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateToggleIcons);
    } else {
        updateToggleIcons();
    }
})();
