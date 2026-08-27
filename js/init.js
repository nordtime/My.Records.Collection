/**
 * Application initialization
 * Binds UI event listeners for filters and search
 */
document.addEventListener('DOMContentLoaded', () => {
    // Note: the advanced-filters toggle is bound in app.js. Do not bind it here
    // as well — a second handler would toggle the panel twice per click (no-op).

    // Clear filters button
    const btnClearFilters = document.getElementById('btnClearFilters');
    if (btnClearFilters) {
        btnClearFilters.addEventListener('click', () => {
            clearAdvancedFilters();
            // Trigger reload if loadRecords is available
            if (typeof window.triggerRecordReload === 'function') {
                window.triggerRecordReload();
            }
        });
    }

    // Add change listeners to advanced filter inputs
    const advFilterInputs = [
        'filterDateFrom',
        'filterDateTo',
        'filterCondition',
        'filterHasCover'
    ];

    advFilterInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                if (typeof window.triggerRecordReload === 'function') {
                    window.triggerRecordReload();
                }
            });
        }
    });

    // Search scope selector
    const searchScope = document.getElementById('searchScope');
    if (searchScope) {
        searchScope.addEventListener('change', () => {
            if (typeof window.triggerRecordReload === 'function') {
                window.triggerRecordReload();
            }
        });
    }

    // Data dropdown menu (Export/Import/Backup/Restore)
    const dataMenu = document.getElementById('dataMenu');
    const btnDataMenu = document.getElementById('btnDataMenu');
    if (dataMenu && btnDataMenu) {
        const popover = dataMenu.querySelector('.menu-popover');
        btnDataMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            const open = popover.classList.toggle('hidden');
            btnDataMenu.setAttribute('aria-expanded', String(!open));
        });
        popover.querySelectorAll('.menu-popover-item').forEach(item =>
            item.addEventListener('click', () => {
                popover.classList.add('hidden');
                btnDataMenu.setAttribute('aria-expanded', 'false');
            })
        );
        document.addEventListener('click', (e) => {
            if (!dataMenu.contains(e.target)) {
                popover.classList.add('hidden');
                btnDataMenu.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Grid / List view toggle
    const grid = document.getElementById('recordsGrid');
    const viewGrid = document.getElementById('viewGrid');
    const viewList = document.getElementById('viewList');
    if (grid && viewGrid && viewList) {
        const VIEW_KEY = 'rc-view';
        const applyView = (mode) => {
            const isList = mode === 'list';
            grid.classList.toggle('list-view', isList);
            viewList.classList.toggle('active', isList);
            viewGrid.classList.toggle('active', !isList);
            viewList.setAttribute('aria-pressed', String(isList));
            viewGrid.setAttribute('aria-pressed', String(!isList));
            localStorage.setItem(VIEW_KEY, mode);
        };
        viewGrid.addEventListener('click', () => applyView('grid'));
        viewList.addEventListener('click', () => applyView('list'));
        applyView(localStorage.getItem(VIEW_KEY) || 'grid');
    }
});
