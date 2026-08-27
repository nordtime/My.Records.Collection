/**
 * Theme manager — Light / Dark / System with persisted preference.
 * Default is "system" (follows the OS setting via prefers-color-scheme).
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'rc-theme';
    const MODES = [
        { value: 'system', label: 'System', icon: '🖥️' },
        { value: 'light',  label: 'Light',  icon: '☀️' },
        { value: 'dark',   label: 'Dark',   icon: '🌙' },
    ];

    const ThemeManager = {
        getPreference() {
            return localStorage.getItem(STORAGE_KEY) || 'system';
        },

        /** Apply a preference to <html> and persist it. */
        apply(pref) {
            const root = document.documentElement;
            if (pref === 'light' || pref === 'dark') {
                root.setAttribute('data-theme', pref);
            } else {
                root.removeAttribute('data-theme'); // system → media query governs
            }
            localStorage.setItem(STORAGE_KEY, pref);
            this.updateUI(pref);
        },

        updateUI(pref) {
            const current = MODES.find(m => m.value === pref) || MODES[0];
            const btn = document.getElementById('theme-toggle');
            if (btn) btn.querySelector('.theme-icon').textContent = current.icon;
            document.querySelectorAll('.theme-menu-item').forEach(item => {
                item.classList.toggle('active', item.dataset.value === pref);
            });
        },

        init() {
            const nav = document.querySelector('.header-nav');
            if (!nav || document.getElementById('theme-picker')) return;

            const picker = document.createElement('div');
            picker.className = 'theme-picker';
            picker.id = 'theme-picker';
            picker.innerHTML = `
                <button class="btn btn-ghost" id="theme-toggle" title="Theme" aria-haspopup="true" aria-expanded="false">
                    <span class="theme-icon" style="margin-right:0.4rem;">🖥️</span> Theme
                </button>
                <div class="theme-menu hidden" role="menu">
                    ${MODES.map(m => `
                        <button class="theme-menu-item" data-value="${m.value}" role="menuitemradio">
                            <span>${m.icon}</span>
                            <span>${m.label}</span>
                            <span class="theme-check">✓</span>
                        </button>
                    `).join('')}
                </div>
            `;
            // Place theme picker first in the nav
            nav.insertBefore(picker, nav.firstChild);

            const toggle = picker.querySelector('#theme-toggle');
            const menu = picker.querySelector('.theme-menu');

            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = !menu.classList.contains('hidden');
                menu.classList.toggle('hidden');
                toggle.setAttribute('aria-expanded', String(!isOpen));
            });

            picker.querySelectorAll('.theme-menu-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.apply(item.dataset.value);
                    menu.classList.add('hidden');
                    toggle.setAttribute('aria-expanded', 'false');
                });
            });

            document.addEventListener('click', (e) => {
                if (!picker.contains(e.target)) {
                    menu.classList.add('hidden');
                    toggle.setAttribute('aria-expanded', 'false');
                }
            });

            this.updateUI(this.getPreference());
        },
    };

    window.ThemeManager = ThemeManager;

    // Apply saved preference immediately (an inline head script also does this to avoid flash)
    ThemeManager.apply(ThemeManager.getPreference());

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
    } else {
        ThemeManager.init();
    }
})();
