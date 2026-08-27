/**
 * Keyboard Navigation & Shortcuts Module
 * Provides comprehensive keyboard controls for the application
 */

// Track currently focused card
let focusedCardIndex = -1;
let cardElements = [];

// Keyboard shortcuts configuration
const SHORTCUTS = {
    'FOCUS_SEARCH': { keys: ['k'], ctrl: true, description: 'Focus search input' },
    'NEW_RECORD': { keys: ['n'], ctrl: false, description: 'Add new record' },
    'STATS': { keys: ['s'], ctrl: false, description: 'Open statistics' },
    'EXPORT': { keys: ['e'], ctrl: false, description: 'Export to CSV' },
    'IMPORT': { keys: ['i'], ctrl: false, description: 'Import from CSV' },
    'HELP': { keys: ['?'], ctrl: false, description: 'Show keyboard shortcuts' },
    'ESCAPE': { keys: ['Escape'], ctrl: false, description: 'Close modals' },
    'SELECT_ALL': { keys: ['a'], ctrl: true, description: 'Select all records' },
    'DESELECT_ALL': { keys: ['d'], ctrl: true, description: 'Deselect all records' }
};

/**
 * Initialize keyboard navigation
 */
function initKeyboardNavigation() {
    // Global keyboard event listener
    document.addEventListener('keydown', handleGlobalKeyboard);
    
    // Update card elements when grid changes
    const observer = new MutationObserver(() => {
        updateCardElements();
    });
    
    const grid = document.getElementById('recordsGrid');
    if (grid) {
        observer.observe(grid, { childList: true });
    }
    
    console.log('✅ Keyboard navigation initialized');
}

/**
 * Handle global keyboard shortcuts
 */
function handleGlobalKeyboard(e) {
    // Don't trigger shortcuts when typing in inputs (except Ctrl+K)
    const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
    
    // Ctrl/Cmd + K - Focus search (works anywhere)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        focusSearch();
        return;
    }
    
    // Ctrl/Cmd + A - Select all (when not in input)
    if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !isInputFocused) {
        e.preventDefault();
        selectAllRecords();
        return;
    }
    
    // Ctrl/Cmd + D - Deselect all
    if ((e.ctrlKey || e.metaKey) && e.key === 'd' && !isInputFocused) {
        e.preventDefault();
        deselectAllRecords();
        return;
    }
    
    // Don't trigger other shortcuts when typing
    if (isInputFocused) {
        return;
    }
    
    // Check if any modal is open
    const isModalOpen = !document.getElementById('modalOverlay')?.classList.contains('hidden') ||
                       !document.getElementById('statsOverlay')?.classList.contains('hidden') ||
                       !document.getElementById('deleteOverlay')?.classList.contains('hidden') ||
                       !document.getElementById('importOverlay')?.classList.contains('hidden') ||
                       !document.getElementById('tracklistOverlay')?.classList.contains('hidden');
    
    // Modal-specific shortcuts
    if (isModalOpen) {
        if (e.key === 'Escape') {
            closeTopModal();
        }
        return; // Don't process other shortcuts when modal is open
    }
    
    // Grid navigation shortcuts (only when grid is visible)
    const grid = document.getElementById('recordsGrid');
    if (grid && !grid.classList.contains('hidden')) {
        switch(e.key) {
            case 'ArrowRight':
                e.preventDefault();
                navigateCard('right');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                navigateCard('left');
                break;
            case 'ArrowDown':
                e.preventDefault();
                navigateCard('down');
                break;
            case 'ArrowUp':
                e.preventDefault();
                navigateCard('up');
                break;
            case 'Enter':
                e.preventDefault();
                openFocusedCard();
                break;
            case ' ': // Spacebar
                e.preventDefault();
                toggleCardSelection();
                break;
            case 'Delete':
            case 'Backspace':
                e.preventDefault();
                deleteSelectedOrFocused();
                break;
        }
    }
    
    // Global shortcuts (when no modal open)
    switch(e.key.toLowerCase()) {
        case 'n':
            e.preventDefault();
            openAddRecordModal();
            break;
        case 's':
            e.preventDefault();
            openStatsModal();
            break;
        case 'e':
            e.preventDefault();
            triggerExport();
            break;
        case 'i':
            e.preventDefault();
            openImportModal();
            break;
        case '?':
            e.preventDefault();
            showShortcutsHelp();
            break;
    }
}

/**
 * Focus search input
 */
function focusSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.focus();
        searchInput.select();
    }
}

/**
 * Update card elements array
 */
function updateCardElements() {
    const grid = document.getElementById('recordsGrid');
    if (grid) {
        cardElements = Array.from(grid.querySelectorAll('.record-card'));
    }
}

/**
 * Navigate between cards using arrow keys
 */
function navigateCard(direction) {
    updateCardElements();
    
    if (cardElements.length === 0) return;
    
    // Get grid columns count
    const grid = document.getElementById('recordsGrid');
    const gridStyle = window.getComputedStyle(grid);
    const columns = gridStyle.gridTemplateColumns.split(' ').length;
    
    // Initialize focus if not set
    if (focusedCardIndex === -1) {
        focusedCardIndex = 0;
    } else {
        // Remove previous focus
        cardElements[focusedCardIndex]?.classList.remove('keyboard-focused');
        
        // Calculate new index
        switch(direction) {
            case 'right':
                focusedCardIndex = Math.min(focusedCardIndex + 1, cardElements.length - 1);
                break;
            case 'left':
                focusedCardIndex = Math.max(focusedCardIndex - 1, 0);
                break;
            case 'down':
                focusedCardIndex = Math.min(focusedCardIndex + columns, cardElements.length - 1);
                break;
            case 'up':
                focusedCardIndex = Math.max(focusedCardIndex - columns, 0);
                break;
        }
    }
    
    // Apply focus
    const focusedCard = cardElements[focusedCardIndex];
    if (focusedCard) {
        focusedCard.classList.add('keyboard-focused');
        focusedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/**
 * Open focused card details
 */
function openFocusedCard() {
    if (focusedCardIndex >= 0 && cardElements[focusedCardIndex]) {
        const card = cardElements[focusedCardIndex];
        card.click(); // Trigger existing click handler
    }
}

/**
 * Toggle selection of focused card
 */
function toggleCardSelection() {
    if (focusedCardIndex >= 0 && cardElements[focusedCardIndex]) {
        const card = cardElements[focusedCardIndex];
        const checkbox = card.querySelector('.card-select');
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
}

/**
 * Delete selected records or focused record
 */
function deleteSelectedOrFocused() {
    // Check if there are selected records
    const selectedCheckboxes = document.querySelectorAll('.card-select:checked');
    
    if (selectedCheckboxes.length > 0) {
        // Delete selected records
        const deleteBtn = document.getElementById('btnDeleteSelected');
        if (deleteBtn) {
            deleteBtn.click();
        }
    } else if (focusedCardIndex >= 0 && cardElements[focusedCardIndex]) {
        // Delete focused record
        const card = cardElements[focusedCardIndex];
        const deleteBtn = card.querySelector('.btn-delete');
        if (deleteBtn) {
            deleteBtn.click();
        }
    }
}

/**
 * Select all records
 */
function selectAllRecords() {
    const checkboxes = document.querySelectorAll('.card-select');
    checkboxes.forEach(cb => {
        if (!cb.checked) {
            cb.checked = true;
            cb.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
}

/**
 * Deselect all records
 */
function deselectAllRecords() {
    const clearBtn = document.getElementById('btnClearSelection');
    if (clearBtn && !clearBtn.closest('.select-toolbar')?.classList.contains('hidden')) {
        clearBtn.click();
    } else {
        // Manual deselect if button not visible
        const checkboxes = document.querySelectorAll('.card-select:checked');
        checkboxes.forEach(cb => {
            cb.checked = false;
            cb.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }
}

/**
 * Close top-most open modal
 */
function closeTopModal() {
    const modals = [
        'tracklistOverlay',
        'discogsOverlay',
        'deleteOverlay',
        'importOverlay',
        'statsOverlay',
        'modalOverlay'
    ];
    
    for (const modalId of modals) {
        const modal = document.getElementById(modalId);
        if (modal && !modal.classList.contains('hidden')) {
            const closeBtn = modal.querySelector('.btn-close');
            if (closeBtn) {
                closeBtn.click();
            } else {
                modal.classList.add('hidden');
            }
            return;
        }
    }
}

/**
 * Trigger add record modal
 */
function openAddRecordModal() {
    const addBtn = document.getElementById('btnAdd');
    if (addBtn) {
        addBtn.click();
    }
}

/**
 * Open stats modal
 */
function openStatsModal() {
    const statsBtn = document.getElementById('btnStats');
    if (statsBtn) {
        statsBtn.click();
    }
}

/**
 * Trigger export
 */
function triggerExport() {
    const exportBtn = document.getElementById('btnExportCsv');
    if (exportBtn) {
        exportBtn.click();
    }
}

/**
 * Open import modal
 */
function openImportModal() {
    const importBtn = document.getElementById('btnImportCsv');
    if (importBtn) {
        importBtn.click();
    }
}

/**
 * Show keyboard shortcuts help modal
 */
function showShortcutsHelp() {
    // Create help modal if it doesn't exist
    let helpModal = document.getElementById('shortcutsHelpOverlay');
    
    if (!helpModal) {
        helpModal = createShortcutsHelpModal();
        document.body.appendChild(helpModal);
    }
    
    helpModal.classList.remove('hidden');
}

/**
 * Create shortcuts help modal
 */
function createShortcutsHelpModal() {
    const overlay = document.createElement('div');
    overlay.id = 'shortcutsHelpOverlay';
    overlay.className = 'modal-overlay hidden';
    
    overlay.innerHTML = `
        <div class="modal modal-wide">
            <div class="modal-header">
                <h2>⌨️ Keyboard Shortcuts</h2>
                <button class="btn-close" id="btnCloseShortcuts">&times;</button>
            </div>
            <div style="padding: 1.25rem;">
                <div class="shortcuts-grid">
                    <div class="shortcuts-section">
                        <h3>Global Shortcuts</h3>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>K</kbd>
                            <span>Focus search</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>N</kbd>
                            <span>Add new record</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>S</kbd>
                            <span>Open statistics</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>E</kbd>
                            <span>Export to CSV</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>I</kbd>
                            <span>Import from CSV</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>?</kbd>
                            <span>Show this help</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Esc</kbd>
                            <span>Close modals</span>
                        </div>
                    </div>
                    
                    <div class="shortcuts-section">
                        <h3>Grid Navigation</h3>
                        <div class="shortcut-item">
                            <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>
                            <span>Navigate cards</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Enter</kbd>
                            <span>Open focused card</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Space</kbd>
                            <span>Select/deselect card</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Delete</kbd>
                            <span>Delete selected/focused</span>
                        </div>
                    </div>
                    
                    <div class="shortcuts-section">
                        <h3>Selection</h3>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>A</kbd>
                            <span>Select all records</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>D</kbd>
                            <span>Deselect all</span>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-sm); font-size: 0.85rem; color: var(--text-secondary);">
                    <strong style="color: var(--accent);">💡 Pro Tip:</strong> Most shortcuts work when you're not typing in an input field. Press <kbd>Ctrl</kbd>+<kbd>K</kbd> from anywhere to quickly search!
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.add('hidden');
        }
    });
    
    setTimeout(() => {
        const closeBtn = overlay.querySelector('#btnCloseShortcuts');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                overlay.classList.add('hidden');
            });
        }
    }, 0);
    
    return overlay;
}

/**
 * Enhance tab navigation for better accessibility
 */
function enhanceTabNavigation() {
    // Add skip to content link
    const skipLink = document.createElement('a');
    skipLink.href = '#recordsGrid';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to records';
    skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        const grid = document.getElementById('recordsGrid');
        if (grid) {
            grid.focus();
            grid.scrollIntoView({ behavior: 'smooth' });
        }
    });
    document.body.insertBefore(skipLink, document.body.firstChild);
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initKeyboardNavigation();
        enhanceTabNavigation();
    });
} else {
    initKeyboardNavigation();
    enhanceTabNavigation();
}
