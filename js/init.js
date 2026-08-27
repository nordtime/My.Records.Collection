/**
 * Application initialization
 * Binds UI event listeners for filters and search
 */
document.addEventListener('DOMContentLoaded', () => {
    // Toggle advanced filters panel
    const btnAdvancedFilters = document.getElementById('btnAdvancedFilters');
    const advancedFiltersPanel = document.getElementById('advancedFiltersPanel');
    
    if (btnAdvancedFilters && advancedFiltersPanel) {
        btnAdvancedFilters.addEventListener('click', () => {
            advancedFiltersPanel.classList.toggle('hidden');
            btnAdvancedFilters.classList.toggle('btn-filter-active');
        });
    }

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
});
