/**
 * Enhanced Search & Filter Module
 * Adds fuzzy search, advanced filtering, and search scope
 */

// Initialize Fuse.js instance for fuzzy search
let fuseInstance = null;
let allRecords = [];

// Enhanced search configuration
const FUSE_OPTIONS = {
    threshold: 0.3,
    keys: [
        { name: 'artist', weight: 0.4 },
        { name: 'album', weight: 0.4 },
        { name: 'notes', weight: 0.2 }
    ],
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true
};

/**
 * Initialize enhanced search after records are loaded
 */
function initEnhancedSearch(records) {
    allRecords = records;
    
    if (typeof Fuse !== 'undefined') {
        fuseInstance = new Fuse(allRecords, FUSE_OPTIONS);
    } else {
        console.warn('Fuse.js not loaded, falling back to basic search');
    }
}

/**
 * Perform fuzzy search based on scope
 */
function performFuzzySearch(query, scope = 'all') {
    if (!query || !query.trim()) {
        return allRecords;
    }

    // If Fuse.js not available, fall back to basic search
    if (!fuseInstance) {
        return basicSearch(allRecords, query, scope);
    }

    // Adjust Fuse.js keys based on scope
    const scopeKeys = getScopeKeys(scope);
    fuseInstance.setCollection(allRecords);
    fuseInstance.options.keys = scopeKeys;

    const results = fuseInstance.search(query);
    return results.map(result => result.item);
}

/**
 * Get Fuse.js keys based on search scope
 */
function getScopeKeys(scope) {
    switch (scope) {
        case 'artist':
            return [{ name: 'artist', weight: 1.0 }];
        case 'album':
            return [{ name: 'album', weight: 1.0 }];
        case 'notes':
            return [{ name: 'notes', weight: 1.0 }];
        default: // 'all'
            return [
                { name: 'artist', weight: 0.4 },
                { name: 'album', weight: 0.4 },
                { name: 'notes', weight: 0.2 }
            ];
    }
}

/**
 * Basic search fallback (no fuzzy matching)
 */
function basicSearch(records, query, scope) {
    const lowerQuery = query.toLowerCase();
    
    return records.filter(record => {
        switch (scope) {
            case 'artist':
                return record.artist.toLowerCase().includes(lowerQuery);
            case 'album':
                return record.album.toLowerCase().includes(lowerQuery);
            case 'notes':
                return (record.notes || '').toLowerCase().includes(lowerQuery);
            default: // 'all'
                return record.artist.toLowerCase().includes(lowerQuery) ||
                       record.album.toLowerCase().includes(lowerQuery) ||
                       (record.notes || '').toLowerCase().includes(lowerQuery);
        }
    });
}

/**
 * Apply advanced filters
 */
function applyAdvancedFilters(records) {
    let filtered = [...records];

    // Date range filter
    const dateFrom = document.getElementById('filterDateFrom')?.value;
    const dateTo = document.getElementById('filterDateTo')?.value;
    
    if (dateFrom) {
        filtered = filtered.filter(r => {
            const addedDate = r.date_added ? new Date(r.date_added).toISOString().split('T')[0] : '';
            return addedDate >= dateFrom;
        });
    }
    
    if (dateTo) {
        filtered = filtered.filter(r => {
            const addedDate = r.date_added ? new Date(r.date_added).toISOString().split('T')[0] : '';
            return addedDate <= dateTo;
        });
    }

    // Condition filter
    const condition = document.getElementById('filterCondition')?.value;
    if (condition) {
        filtered = filtered.filter(r => r.condition_grade === condition);
    }

    // Has cover art filter
    const hasCover = document.getElementById('filterHasCover')?.checked;
    if (hasCover) {
        filtered = filtered.filter(r => r.cover_url && r.cover_url.trim() !== '');
    }

    return filtered;
}

/**
 * Check if any advanced filters are active
 */
function hasActiveAdvancedFilters() {
    const dateFrom = document.getElementById('filterDateFrom')?.value;
    const dateTo = document.getElementById('filterDateTo')?.value;
    const condition = document.getElementById('filterCondition')?.value;
    const hasCover = document.getElementById('filterHasCover')?.checked;
    
    return !!(dateFrom || dateTo || condition || hasCover);
}

/**
 * Clear all advanced filters
 */
function clearAdvancedFilters() {
    const dateFromEl = document.getElementById('filterDateFrom');
    const dateToEl = document.getElementById('filterDateTo');
    const conditionEl = document.getElementById('filterCondition');
    const hasCoverEl = document.getElementById('filterHasCover');
    
    if (dateFromEl) dateFromEl.value = '';
    if (dateToEl) dateToEl.value = '';
    if (conditionEl) conditionEl.value = '';
    if (hasCoverEl) hasCoverEl.checked = false;
}

// Export functions for use in main app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initEnhancedSearch,
        performFuzzySearch,
        applyAdvancedFilters,
        hasActiveAdvancedFilters,
        clearAdvancedFilters
    };
}
