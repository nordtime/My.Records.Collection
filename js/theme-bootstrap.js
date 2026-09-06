(function () {
    'use strict';

    try {
        const theme = localStorage.getItem('rc-theme');
        if (theme === 'light' || theme === 'dark') {
            document.documentElement.setAttribute('data-theme', theme);
        }
    } catch (error) {
        // Storage can be unavailable in restricted browser contexts.
    }
})();
