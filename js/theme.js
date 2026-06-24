(function () {
    const STORAGE_KEY = 'insper-grade-planner-theme';

    function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        const resolved = theme === 'system' ? getSystemTheme() : theme;
        document.documentElement.classList.toggle('dark', resolved === 'dark');
        document.documentElement.dataset.theme = resolved;
        updateToggleUI(resolved);
    }

    function updateToggleUI(resolved) {
        const sunIcon = document.getElementById('icon-sun');
        const moonIcon = document.getElementById('icon-moon');
        const label = document.getElementById('theme-label');
        if (!sunIcon || !moonIcon) return;

        const isDark = resolved === 'dark';
        sunIcon.classList.toggle('hidden', isDark);
        moonIcon.classList.toggle('hidden', !isDark);
        if (label) label.textContent = isDark ? 'Modo claro' : 'Modo escuro';
    }

    function getStoredTheme() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored === 'light' || stored === 'dark' ? stored : getSystemTheme();
    }

    function setTheme(theme) {
        localStorage.setItem(STORAGE_KEY, theme);
        applyTheme(theme);
    }

    function toggleTheme() {
        const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        setTheme(current === 'dark' ? 'light' : 'dark');
    }

    window.toggleTheme = toggleTheme;

    const savedTheme = getStoredTheme();
    applyTheme(savedTheme);

    document.addEventListener('DOMContentLoaded', () => {
        updateToggleUI(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) applyTheme(getSystemTheme());
    });
})();
