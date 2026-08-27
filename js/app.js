/**
 * My Records Collection — Client App
 */
(() => {
    'use strict';

    const API = 'api/api.php';
    const COVER_API = 'api/cover.php';

    // ── DOM refs ────────────────────────────────────────────
    const $grid         = document.getElementById('recordsGrid');
    const $empty        = document.getElementById('emptyState');
    const $count        = document.getElementById('recordsCount');
    const $search       = document.getElementById('searchInput');
    const $genre        = document.getElementById('filterGenre');
    const $year         = document.getElementById('filterYear');
    const $format       = document.getElementById('filterFormat');
    const $sort         = document.getElementById('sortSelect');
    const $btnSetDefault = document.getElementById('btnSetDefault');

    const $modalOverlay = document.getElementById('modalOverlay');
    const $modalTitle   = document.getElementById('modalTitle');
    const $form         = document.getElementById('recordForm');
    const $recordId     = document.getElementById('recordId');

    const $statsOverlay = document.getElementById('statsOverlay');
    const $statsBody    = document.getElementById('statsBody');

    const $discogsOverlay = document.getElementById('discogsOverlay');
    const $discogsBody    = document.getElementById('discogsBody');
    const $discogsTitle   = document.getElementById('discogsTitle');

    const $deleteOverlay = document.getElementById('deleteOverlay');
    const $deleteName    = document.getElementById('deleteName');

    const $toast = document.getElementById('toast');

    let deleteTargetId = null;
    let deleteTargetIds = [];       // multi-select delete
    let selectedIds    = new Set(); // multi-select tracking
    let currentRecords = [];        // cache for current view
    let debounceTimer  = null;
    let csvParsedRows  = [];
    let activeTag      = null;       // active tag/shelf filter
    let allTags        = [];         // distinct tags across the collection (for the card tag picker)
    // Built-in shelf suggestions always offered in the card tag picker
    const DEFAULT_TAGS = ['Favorites', 'To Listen', 'On Rotation', 'Classics', 'Rare', 'Signed', 'Loaned Out', 'For Sale', 'Chill', 'Party'];

    const $importOverlay  = document.getElementById('importOverlay');
    const $importPreview  = document.getElementById('importPreview');
    const $previewTable   = document.getElementById('previewTable');
    const $previewTitle   = document.getElementById('previewTitle');
    const $csvFileInput   = document.getElementById('csvFileInput');
    const $dropZone       = document.getElementById('dropZone');
    const $btnConfirmImport = document.getElementById('btnConfirmImport');

    const DEFAULT_VIEW_KEY = 'recordsDefaultView';

    // ── Init ────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        loadDefaultView();
        loadFilterOptions().then(() => loadRecords());
        bindEvents();
    });

    // ── Events ──────────────────────────────────────────────
    function bindEvents() {
        // Toolbar
        $search.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(loadRecords, 300);
        });
        $genre.addEventListener('change', loadRecords);
        $year.addEventListener('change', loadRecords);
        $format.addEventListener('change', loadRecords);
        $sort.addEventListener('change', loadRecords);

        // Set Default view
        $btnSetDefault.addEventListener('click', saveDefaultView);

        // Surprise Me — random record picker
        const btnSpin = document.getElementById('btnSpin');
        if (btnSpin) btnSpin.addEventListener('click', spinRandom);

        // Add buttons
        document.getElementById('btnAdd').addEventListener('click', openAddModal);
        document.getElementById('btnAddEmpty').addEventListener('click', openAddModal);

        // Modal close
        document.getElementById('btnCloseModal').addEventListener('click', closeModal);
        document.getElementById('btnCancel').addEventListener('click', closeModal);
        $modalOverlay.addEventListener('click', e => { if (e.target === $modalOverlay) closeModal(); });

        // Form submit
        $form.addEventListener('submit', handleSave);

        // Lookup
        document.getElementById('btnLookup').addEventListener('click', handleLookup);

        // Stats
        document.getElementById('btnStats').addEventListener('click', openStats);
        document.getElementById('btnCloseStats').addEventListener('click', () => $statsOverlay.classList.add('hidden'));
        $statsOverlay.addEventListener('click', e => { if (e.target === $statsOverlay) $statsOverlay.classList.add('hidden'); });

        // Discogs value modal
        document.getElementById('btnCloseDiscogs').addEventListener('click', () => $discogsOverlay.classList.add('hidden'));
        $discogsOverlay.addEventListener('click', e => { if (e.target === $discogsOverlay) $discogsOverlay.classList.add('hidden'); });

        // Delete confirm
        document.getElementById('btnCloseDelete').addEventListener('click', closeDeleteModal);
        document.getElementById('btnCancelDelete').addEventListener('click', closeDeleteModal);
        document.getElementById('btnConfirmDelete').addEventListener('click', handleDelete);
        $deleteOverlay.addEventListener('click', e => { if (e.target === $deleteOverlay) closeDeleteModal(); });

        // Multi-select toolbar
        document.getElementById('btnDeleteSelected').addEventListener('click', openBulkDeleteModal);
        document.getElementById('btnClearSelection').addEventListener('click', clearSelection);

        // CSV Export
        document.getElementById('btnExportCsv').addEventListener('click', handleExportCsv);

        // CSV Import
        document.getElementById('btnImportCsv').addEventListener('click', openImportModal);
        document.getElementById('btnCloseImport').addEventListener('click', closeImportModal);
        document.getElementById('btnCancelImport').addEventListener('click', closeImportModal);
        $importOverlay.addEventListener('click', e => { if (e.target === $importOverlay) closeImportModal(); });
        $btnConfirmImport.addEventListener('click', handleCsvImport);
        $csvFileInput.addEventListener('change', e => { if (e.target.files[0]) parseCsvFile(e.target.files[0]); });
        $dropZone.addEventListener('click', () => $csvFileInput.click());
        $dropZone.addEventListener('dragover', e => { e.preventDefault(); $dropZone.classList.add('drop-active'); });
        $dropZone.addEventListener('dragleave', () => $dropZone.classList.remove('drop-active'));
        $dropZone.addEventListener('drop', e => {
            e.preventDefault();
            $dropZone.classList.remove('drop-active');
            const file = e.dataTransfer.files[0];
            if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) parseCsvFile(file);
            else showToast('Please drop a .csv file.', 'error');
        });
        document.getElementById('btnDownloadTemplate').addEventListener('click', e => {
            e.preventDefault();
            downloadCsvTemplate();
        });

        // Keyboard: Escape to close modals
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                const $tracklistOverlay = document.getElementById('tracklistOverlay');
                if (!$deleteOverlay.classList.contains('hidden'))  closeDeleteModal();
                else if (!$discogsOverlay.classList.contains('hidden')) $discogsOverlay.classList.add('hidden');
                else if (!$importOverlay.classList.contains('hidden')) closeImportModal();
                else if (!$tracklistOverlay.classList.contains('hidden')) $tracklistOverlay.classList.add('hidden');
                else if (!$modalOverlay.classList.contains('hidden')) closeModal();
                else if (!$statsOverlay.classList.contains('hidden')) $statsOverlay.classList.add('hidden');
            }
        });

        // Tracklist modal
        document.getElementById('btnCloseTracklist').addEventListener('click', () => document.getElementById('tracklistOverlay').classList.add('hidden'));

        // ── Enhanced Search & Filters ───────────────────────
        // Search scope selector
        const $searchScope = document.getElementById('searchScope');
        if ($searchScope) {
            $searchScope.addEventListener('change', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(loadRecords, 300);
            });
        }

        // Advanced filters toggle
        const $btnAdvFilters = document.getElementById('btnAdvancedFilters');
        const $advFiltersPanel = document.getElementById('advancedFiltersPanel');
        if ($btnAdvFilters && $advFiltersPanel) {
            $btnAdvFilters.addEventListener('click', () => {
                $advFiltersPanel.classList.toggle('hidden');
                $btnAdvFilters.classList.toggle('btn-filter-active');
            });
        }

        // Advanced filter inputs
        const advFilterIds = ['filterDateFrom', 'filterDateTo', 'filterCondition', 'filterHasCover'];
        advFilterIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const eventType = el.type === 'checkbox' ? 'change' : 'change';
                el.addEventListener(eventType, () => {
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(loadRecords, 300);
                });
            }
        });

        // Clear filters button
        const $btnClearFilters = document.getElementById('btnClearFilters');
        if ($btnClearFilters) {
            $btnClearFilters.addEventListener('click', () => {
                if (typeof clearAdvancedFilters === 'function') {
                    clearAdvancedFilters();
                }
                loadRecords();
            });
        }
        document.getElementById('tracklistOverlay').addEventListener('click', e => {
            if (e.target === document.getElementById('tracklistOverlay')) document.getElementById('tracklistOverlay').classList.add('hidden');
        });
    }

    // ── API helpers ─────────────────────────────────────────
    async function apiFetch(url, opts = {}) {
        try {
            const res = await fetch(url, opts);
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                const err = new Error('Server returned invalid response.');
                err.status = res.status;
                throw err;
            }
            if (!res.ok) {
                const err = new Error(data.error || data.errors?.join(', ') || 'Request failed.');
                err.status = res.status;
                err.duplicate = data.duplicate || null;
                throw err;
            }
            return data;
        } catch (err) {
            if (!err.status) {
                // Network / parse error — show toast
                showToast(err.message, 'error');
            } else if (err.status !== 409) {
                // Non-duplicate API error — show toast
                showToast(err.message, 'error');
            }
            throw err;
        }
    }

    // ── Load records with enhanced search & filters ────────
    async function loadRecords() {
        try {
            const params = new URLSearchParams();
            
            // Server-side filters for genre, year, format
            if ($genre.value) params.set('genre', $genre.value);
            if ($year.value) params.set('year', $year.value);
            if ($format.value) params.set('format', $format.value);
            if (activeTag) params.set('tag', activeTag);
            params.set('sort', $sort.value);

            // Fetch all records from API
            const records = await apiFetch(`${API}?${params}`);
            
            // Expose globally for Priority 2 modules
            window.records = records;

            // Refresh the distinct-tags list used by the per-card tag picker
            loadAllTags();
            
            // Initialize fuzzy search with fetched records
            if (typeof initEnhancedSearch === 'function') {
                initEnhancedSearch(records);
            }

            // Apply client-side fuzzy search
            let filteredRecords = records;
            
            const searchQuery = $search.value.trim();
            const $searchScope = document.getElementById('searchScope');
            const searchScope = $searchScope ? $searchScope.value : 'all';
            
            if (searchQuery && typeof performFuzzySearch === 'function') {
                filteredRecords = performFuzzySearch(searchQuery, searchScope);
            }

            // Apply advanced filters
            if (typeof applyAdvancedFilters === 'function') {
                filteredRecords = applyAdvancedFilters(filteredRecords);
            }

            // Update current records and render
            currentRecords = filteredRecords;
            currentRecords = filteredRecords;
            renderRecords(filteredRecords);

        } catch {
            // error already toasted
        }
    }

    // Expose for enhanced search module
    window.triggerRecordReload = loadRecords;

    function renderRecords(records) {
        if (!records.length) {
            $grid.innerHTML = '';
            $grid.classList.add('hidden');
            $empty.classList.remove('hidden');
            $count.textContent = '';
            return;
        }

        $empty.classList.add('hidden');
        $grid.classList.remove('hidden');
        $count.textContent = `${records.length} record${records.length !== 1 ? 's' : ''}`;

        $grid.innerHTML = records.map(r => {
            const coverSrc = r.cover_url
                ? escHtml(r.cover_url)
                : `${COVER_API}?artist=${encodeURIComponent(r.artist)}&album=${encodeURIComponent(r.album)}`;
            const isSelected = selectedIds.has(r.id);
            return `
            <div class="record-card${isSelected ? ' selected' : ''}" data-id="${r.id}">
                <div class="card-cover">
                    <input type="checkbox" class="card-select" data-id="${r.id}" ${isSelected ? 'checked' : ''} title="Select for bulk actions">
                    <img class="record-img" src="${coverSrc}" alt="${escHtml(r.album)}" loading="lazy" data-record-id="${r.id}" data-is-selected="${isSelected}">
                </div>
                <div class="card-body">
                    <div class="card-artist">${escHtml(r.artist)}</div>
                    <div class="card-album">${escHtml(r.album)}</div>
                    <div class="card-meta">
                        ${r.year ? `<span class="badge">${r.year}</span>` : ''}
                        ${r.genre ? `<span class="badge badge-genre">${escHtml(r.genre)}</span>` : ''}
                        <span class="badge">${escHtml(r.format)}</span>
                        ${r.condition_grade ? `<span class="badge badge-condition">${escHtml(r.condition_grade)}</span>` : ''}
                        ${r.rating > 0 ? `<span class="badge badge-rating" title="Your rating">★ ${r.rating}</span>` : ''}
                        ${r.play_count > 0 ? `<span class="badge badge-plays" title="Times played">📀 ${r.play_count}</span>` : ''}
                        ${r.discogs_value ? `<span class="badge badge-value" title="Discogs value">$${parseFloat(r.discogs_value).toFixed(0)}</span>` : ''}
                    </div>
                    <div class="card-tags" data-id="${r.id}">
                        <span class="card-tags-chips">${tagChipsHtml(r)}</span>
                        <div class="tag-dropdown">
                            <button class="tag-dropdown-btn" data-id="${r.id}" aria-haspopup="true" aria-expanded="false" title="Add or remove tags">🏷️<span class="tag-caret">▾</span></button>
                        </div>
                    </div>
                    ${r.notes ? `<div class="card-notes">${escHtml(r.notes)}</div>` : ''}
                </div>
                <div class="card-actions">
                    <a class="btn btn-ghost btn-sm btn-spotify" href="https://open.spotify.com/search/${encodeURIComponent(r.artist + ' ' + r.album)}" target="_blank" rel="noopener noreferrer" title="Find on Spotify"><svg class="spotify-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg></a>
                    <button class="btn btn-ghost btn-sm btn-played" data-id="${r.id}" title="Mark as played">&#128191;</button>
                    <button class="btn btn-ghost btn-sm btn-value" data-id="${r.id}" title="Discogs Value">&#128176; Value</button>
                    <button class="btn btn-ghost btn-sm btn-edit" data-id="${r.id}" title="Edit">&#9998; Edit</button>
                    <button class="btn btn-ghost btn-sm btn-delete" data-id="${r.id}" title="Delete">&#128465; Delete</button>
                </div>
            </div>
        `}).join('');

        // Bind card action buttons
        $grid.querySelectorAll('.btn-edit').forEach(btn =>
            btn.addEventListener('click', e => { e.stopPropagation(); openEditModal(parseInt(btn.dataset.id)); })
        );
        $grid.querySelectorAll('.btn-delete').forEach(btn =>
            btn.addEventListener('click', e => { e.stopPropagation(); openDeleteModal(parseInt(btn.dataset.id), records); })
        );
        $grid.querySelectorAll('.btn-value').forEach(btn =>
            btn.addEventListener('click', e => { e.stopPropagation(); openDiscogsValue(parseInt(btn.dataset.id), records); })
        );
        $grid.querySelectorAll('.btn-played').forEach(btn =>
            btn.addEventListener('click', e => { e.stopPropagation(); markPlayed(parseInt(btn.dataset.id), records); })
        );
        bindTagChips($grid);
        $grid.querySelectorAll('.tag-dropdown-btn').forEach(btn =>
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const record = records.find(r => r.id == btn.dataset.id);
                if (!record) return;
                openTagMenu(btn, record);
            })
        );

        // Bind image error handler (CSP-compliant)
        $grid.querySelectorAll('.record-img').forEach(img => {
            img.addEventListener('error', function() {
                const recordId = this.dataset.recordId;
                const isSelected = this.dataset.isSelected === 'true';
                this.parentElement.innerHTML = `<input type="checkbox" class="card-select" data-id="${recordId}" ${isSelected ? 'checked' : ''} title="Select for bulk actions"><span class="cover-placeholder">&#127926;</span>`;
            });
        });

        // Bind Spotify link click handler (CSP-compliant)
        $grid.querySelectorAll('.btn-spotify').forEach(link =>
            link.addEventListener('click', e => e.stopPropagation())
        );

        // Bind checkbox select
        $grid.querySelectorAll('.card-select').forEach(cb => {
            cb.addEventListener('click', e => e.stopPropagation());
            cb.addEventListener('change', e => {
                e.stopPropagation();
                const id = parseInt(cb.dataset.id);
                const card = cb.closest('.record-card');
                if (cb.checked) {
                    selectedIds.add(id);
                    card.classList.add('selected');
                } else {
                    selectedIds.delete(id);
                    card.classList.remove('selected');
                }
                updateSelectToolbar();
            });
        });

        // Bind card click → open detail view (Priority 2.1)
        $grid.querySelectorAll('.record-card').forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', (e) => {
                if (e.target.closest('a')) return;
                const r = records.find(rec => rec.id == card.dataset.id);
                if (r) {
                    // Use new detail view if available, fallback to tracklist
                    if (window.RecordDetail) {
                        window.RecordDetail.open(r);
                    } else {
                        openTracklist(r.artist, r.album);
                    }
                }
            });
        });
    }

    // ── Per-card tag picker ─────────────────────────────────
    function tagChipsHtml(r) {
        if (!r.tags) return '';
        return r.tags.split(',').filter(t => t.trim())
            .map(t => `<span class="tag-chip" data-tag="${escHtml(t.trim())}">${escHtml(t.trim())}</span>`)
            .join('');
    }

    function bindTagChips(scope) {
        (scope || $grid).querySelectorAll('.tag-chip').forEach(chip => {
            if (chip.dataset.bound) return;
            chip.dataset.bound = '1';
            chip.addEventListener('click', e => { e.stopPropagation(); setActiveTag(chip.dataset.tag); });
        });
    }

    async function loadAllTags() {
        try {
            const res = await fetch(`${API}?tags_list=1`, { credentials: 'same-origin' });
            const data = await res.json();
            if (data && data.success) allTags = (data.tags || []).map(t => t.tag);
        } catch { /* ignore — picker just shows the empty state */ }
    }

    // A single body-level popover so the menu is never clipped by the card's overflow
    let tagPopover = null;
    let tagPopoverBtn = null;

    function getTagPopover() {
        if (!tagPopover) {
            tagPopover = document.createElement('div');
            tagPopover.className = 'tag-dropdown-menu hidden';
            tagPopover.setAttribute('role', 'menu');
            tagPopover.setAttribute('aria-label', 'Assign tags');
            document.body.appendChild(tagPopover);
        }
        return tagPopover;
    }

    function positionTagPopover(btn) {
        const menu = getTagPopover();
        const r = btn.getBoundingClientRect();
        menu.style.visibility = 'hidden';
        menu.classList.remove('hidden');
        const mh = menu.offsetHeight;
        const mw = menu.offsetWidth;
        const spaceBelow = window.innerHeight - r.bottom;
        const top = (spaceBelow < mh + 8 && r.top > mh + 8) ? (r.top - mh - 4) : (r.bottom + 4);
        let left = r.left;
        if (left + mw > window.innerWidth - 8) left = Math.max(8, window.innerWidth - mw - 8);
        menu.style.top = `${Math.max(8, top)}px`;
        menu.style.left = `${left}px`;
        menu.style.visibility = '';
    }

    function openTagMenu(btn, record) {
        const menu = getTagPopover();
        const isOpenForThis = !menu.classList.contains('hidden') && tagPopoverBtn === btn;
        closeAllTagMenus();
        if (isOpenForThis) return;
        tagPopoverBtn = btn;
        buildTagMenu(record, menu);
        positionTagPopover(btn);
        btn.setAttribute('aria-expanded', 'true');
    }

    function closeAllTagMenus() {
        if (tagPopover) tagPopover.classList.add('hidden');
        if (tagPopoverBtn) { tagPopoverBtn.setAttribute('aria-expanded', 'false'); tagPopoverBtn = null; }
    }

    function buildTagMenu(record, menu) {
        const currentLower = (record.tags || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        // Merge collection tags with the built-in shelf suggestions
        const options = [...allTags];
        DEFAULT_TAGS.forEach(t => {
            if (!options.some(o => o.toLowerCase() === t.toLowerCase())) options.push(t);
        });
        options.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        const list = options.map(name => {
            const checked = currentLower.includes(name.toLowerCase()) ? 'checked' : '';
            return `<label class="tag-menu-item"><input type="checkbox" data-tag="${escHtml(name)}" ${checked}><span>${escHtml(name)}</span></label>`;
        }).join('');
        menu.innerHTML = `<div class="tag-menu-list">${list}</div>`
            + `<div class="tag-menu-add">`
            + `<input type="text" class="tag-new-input" placeholder="New tag…" maxlength="40" aria-label="New tag">`
            + `<button type="button" class="btn btn-sm btn-primary tag-new-btn">Add</button></div>`;
        menu.querySelectorAll('input[type="checkbox"]').forEach(cb =>
            cb.addEventListener('change', e => {
                e.stopPropagation();
                toggleRecordTag(record, cb.dataset.tag, cb.checked);
            })
        );
        const input = menu.querySelector('.tag-new-input');
        const addBtn = menu.querySelector('.tag-new-btn');
        const add = () => addNewTag(record, menu, input.value);
        addBtn.addEventListener('click', e => { e.stopPropagation(); add(); });
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); add(); }
        });
        menu.onclick = e => e.stopPropagation();
    }

    async function addNewTag(record, menu, raw) {
        const tag = (raw || '').trim();
        if (!tag) return;
        const exists = (record.tags || '').split(',').some(t => t.trim().toLowerCase() === tag.toLowerCase());
        if (!exists) await toggleRecordTag(record, tag, true);
        buildTagMenu(record, menu);
        if (tagPopoverBtn) positionTagPopover(tagPopoverBtn);
        const input = menu.querySelector('.tag-new-input');
        if (input) input.focus();
    }

    async function toggleRecordTag(record, tag, add) {
        let tags = (record.tags || '').split(',').map(t => t.trim()).filter(Boolean);
        const has = tags.some(t => t.toLowerCase() === tag.toLowerCase());
        if (add && !has) tags.push(tag);
        else if (!add && has) tags = tags.filter(t => t.toLowerCase() !== tag.toLowerCase());
        try {
            const res = await fetch(API, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ set_tags: 1, record_id: record.id, tags: tags.join(',') }),
            });
            const data = await res.json();
            if (data && data.success) {
                record.tags = (data.tags || []).join(',');
                // Keep the collection-wide tag list current so new tags appear everywhere
                (data.tags || []).forEach(name => {
                    if (!allTags.some(t => t.toLowerCase() === name.toLowerCase())) allTags.push(name);
                });
                allTags.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
                const card = $grid.querySelector(`.record-card[data-id="${record.id}"]`);
                const chipsEl = card && card.querySelector('.card-tags-chips');
                if (chipsEl) { chipsEl.innerHTML = tagChipsHtml(record); bindTagChips(card); }
            } else {
                showToast((data && data.message) || 'Could not update tags', 'error');
            }
        } catch { showToast('Network error while saving tags', 'error'); }
    }

    // Close any open tag menu when clicking elsewhere, scrolling the page, or resizing
    document.addEventListener('click', () => closeAllTagMenus());
    window.addEventListener('resize', () => closeAllTagMenus());
    window.addEventListener('scroll', (e) => {
        if (tagPopover && tagPopover.contains(e.target)) return; // ignore scrolling inside the menu
        closeAllTagMenus();
    }, true);

    // ── Tag / shelf filtering ───────────────────────────────
    function setActiveTag(tag) {
        activeTag = tag || null;
        updateActiveTagUI();
        loadRecords();
    }

    function clearActiveTag() {
        activeTag = null;
        updateActiveTagUI();
        loadRecords();
    }

    function updateActiveTagUI() {
        const el = document.getElementById('activeTagFilter');
        if (!el) return;
        if (activeTag) {
            el.innerHTML = `<span class="active-tag-pill">🏷️ ${escHtml(activeTag)} <button class="active-tag-clear" title="Clear tag filter" aria-label="Clear tag filter">✕</button></span>`;
            el.classList.remove('hidden');
            const clearBtn = el.querySelector('.active-tag-clear');
            if (clearBtn) clearBtn.addEventListener('click', clearActiveTag);
        } else {
            el.innerHTML = '';
            el.classList.add('hidden');
        }
    }

    // ── Surprise Me — pick a random record from the current view ──
    function spinRandom() {
        const pool = window.records || [];
        if (!pool.length) {
            showToast('No records to pick from', 'error');
            return;
        }
        const r = pool[Math.floor(Math.random() * pool.length)];
        if (r && window.RecordDetail) {
            window.RecordDetail.open(r);
        } else if (r) {
            openTracklist(r.artist, r.album);
        }
    }

    // ── Quick "Mark as Played" from a card ──────────────────
    async function markPlayed(id, records) {
        try {
            const res = await fetch(`${API}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ play: 1, record_id: id })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Failed');

            const r = records.find(rec => rec.id == id);
            if (r) {
                r.play_count = (parseInt(r.play_count) || 0) + 1;
                const card = $grid.querySelector(`.record-card[data-id="${id}"] .card-meta`);
                if (card) {
                    let badge = card.querySelector('.badge-plays');
                    if (badge) {
                        badge.textContent = `📀 ${r.play_count}`;
                    } else {
                        badge = document.createElement('span');
                        badge.className = 'badge badge-plays';
                        badge.title = 'Times played';
                        badge.textContent = `📀 ${r.play_count}`;
                        card.appendChild(badge);
                    }
                }
            }
            showToast('Marked as played', 'success');
        } catch (err) {
            showToast('Could not log play', 'error');
        }
    }

    // ── Default View ────────────────────────────────────────
    function saveDefaultView() {
        const state = {
            genre:  $genre.value,
            year:   $year.value,
            format: $format.value,
            sort:   $sort.value,
        };
        localStorage.setItem(DEFAULT_VIEW_KEY, JSON.stringify(state));
        showToast('Default view saved!', 'success');
        $btnSetDefault.classList.add('btn-default-saved');
    }

    function loadDefaultView() {
        try {
            const raw = localStorage.getItem(DEFAULT_VIEW_KEY);
            if (!raw) return;
            const state = JSON.parse(raw);
            // genre and year selects are populated later by loadFilterOptions;
            // store the desired values so loadFilterOptions can restore them
            if (state.format) $format.value = state.format;
            if (state.sort)   $sort.value   = state.sort;
            // stash genre/year so loadFilterOptions picks them up via $genre.value / $year.value
            if (state.genre) $genre.dataset.default = state.genre;
            if (state.year)  $year.dataset.default  = state.year;
            $btnSetDefault.classList.add('btn-default-saved');
        } catch { /* ignore corrupted data */ }
    }

    // ── Populate filter dropdowns from DB ─────────────────────
    async function loadFilterOptions() {
        try {
            const meta = await apiFetch(`${API}?meta=1`);

            const savedGenre = $genre.dataset.default || $genre.value;
            const genreOpts  = ['<option value="">All Genres</option>'];
            (meta.genres || []).forEach(g => {
                genreOpts.push(`<option value="${escHtml(g)}"${g === savedGenre ? ' selected' : ''}>${escHtml(g)}</option>`);
            });
            $genre.innerHTML = genreOpts.join('');

            const savedYear = $year.dataset.default || $year.value;
            const yearOpts  = ['<option value="">All Years</option>'];
            (meta.years || []).forEach(y => {
                yearOpts.push(`<option value="${escHtml(y)}"${String(y) === String(savedYear) ? ' selected' : ''}>${escHtml(y)}</option>`);
            });
            $year.innerHTML = yearOpts.join('');
        } catch {
            // silently ignore — dropdowns keep the placeholder option
        }
    }

    // ── Add Modal ───────────────────────────────────────────
    function openAddModal() {
        $modalTitle.textContent = 'Add Record';
        $form.reset();
        $recordId.value = '';
        $modalOverlay.classList.remove('hidden');
        document.getElementById('artist').focus();
    }

    // ── Edit Modal ──────────────────────────────────────────
    async function openEditModal(id) {
        try {
            const r = await apiFetch(`${API}?id=${id}`);
            $modalTitle.textContent = 'Edit Record';
            $recordId.value = r.id;
            document.getElementById('artist').value          = r.artist;
            document.getElementById('album').value           = r.album;
            document.getElementById('year').value            = r.year || '';
            document.getElementById('genre').value           = r.genre || '';
            document.getElementById('format').value          = r.format;
            document.getElementById('conditionGrade').value  = r.condition_grade || '';
            document.getElementById('coverUrl').value        = r.cover_url || '';
            document.getElementById('notes').value           = r.notes || '';
            document.getElementById('tags').value            = r.tags || '';
            $modalOverlay.classList.remove('hidden');
        } catch {
            // error toasted
        }
    }

    function closeModal() {
        $modalOverlay.classList.add('hidden');
        $form.reset();
        $recordId.value = '';
        document.getElementById('lookupResults').classList.add('hidden');
        document.getElementById('lookupResults').innerHTML = '';
        document.getElementById('lookupStatus').classList.add('hidden');
    }

    // ── MusicBrainz Lookup ──────────────────────────────────
    async function handleLookup() {
        const artist = document.getElementById('artist').value.trim();
        const album  = document.getElementById('album').value.trim();
        const source = document.getElementById('lookupSource').value;
        const $status  = document.getElementById('lookupStatus');
        const $results = document.getElementById('lookupResults');
        const $btn     = document.getElementById('btnLookup');

        if (!artist && !album) {
            showToast('Enter an artist and/or album name first.', 'error');
            return;
        }

        $btn.disabled = true;
        const sourceLabel = source === 'auto' ? 'all sources' : source;
        $status.textContent = `Searching ${sourceLabel}…`;
        $status.classList.remove('hidden');
        $results.classList.add('hidden');

        try {
            const params = new URLSearchParams();
            params.set('lookup', '1');
            if (artist) params.set('artist', artist);
            if (album)  params.set('album', album);
            if (source !== 'auto') params.set('source', source);

            const data = await apiFetch(`${API}?${params}`);
            const hits = data.results || [];

            if (!hits.length) {
                $status.textContent = 'No results found on any source.';
                $results.classList.add('hidden');
                return;
            }

            const sourceNames = { musicbrainz: 'MusicBrainz', itunes: 'iTunes', deezer: 'Deezer' };
            const srcLabel = sourceNames[data.source] || data.source;
            $status.textContent = `${hits.length} result${hits.length > 1 ? 's' : ''} from ${srcLabel} — click to fill form`;
            $results.innerHTML = hits.map((r, i) => `
                <div class="lookup-card" data-idx="${i}">
                    <div class="lookup-cover">
                        ${r.cover_url
                            ? `<img class="lookup-cover-img" src="${escHtml(r.cover_url)}" alt="cover" loading="lazy">`
                            : ''}
                        <span class="cover-placeholder" ${r.cover_url ? 'style="display:none"' : ''}>&#127926;</span>
                    </div>
                    <div class="lookup-info">
                        <div class="lookup-artist">${escHtml(r.artist)}</div>
                        <div class="lookup-album">${escHtml(r.album)}</div>
                        <div class="lookup-meta">
                            ${r.year ? `<span class="badge">${r.year}</span>` : ''}
                            ${r.genre ? `<span class="badge badge-genre">${escHtml(r.genre)}</span>` : ''}
                            ${r.country ? `<span class="badge">${escHtml(r.country)}</span>` : ''}
                            ${r.label ? `<span class="badge">${escHtml(r.label)}</span>` : ''}
                            ${r.source ? `<span class="badge badge-source">${escHtml(r.source)}</span>` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
            $results.classList.remove('hidden');

            // Bind click to fill form
            $results.querySelectorAll('.lookup-card').forEach(card => {
                card.addEventListener('click', () => {
                    const r = hits[parseInt(card.dataset.idx)];
                    if (r.artist) document.getElementById('artist').value = r.artist;
                    if (r.album)  document.getElementById('album').value  = r.album;
                    if (r.year)   document.getElementById('year').value   = r.year;
                    if (r.genre)  document.getElementById('genre').value  = r.genre;
                    // Use the cover art from this lookup result if available,
                    // otherwise clear so the cover proxy can resolve by artist+album
                    document.getElementById('coverUrl').value = r.cover_url || '';
                    $results.classList.add('hidden');
                    $status.textContent = 'Fields filled ✓';
                    showToast(`Record info filled from ${r.source || 'lookup'}!`, 'success');
                });
            });

            // Bind lookup cover image error handler (CSP-compliant)
            $results.querySelectorAll('.lookup-cover-img').forEach(img => {
                img.addEventListener('error', function() {
                    this.style.display = 'none';
                    if (this.nextElementSibling) {
                        this.nextElementSibling.style.display = 'block';
                    }
                });
            });

        } catch {
            $status.textContent = 'Lookup failed.';
        } finally {
            $btn.disabled = false;
        }
    }

    // ── Tracklist ───────────────────────────────────────────
    async function openTracklist(artist, album) {
        const $overlay = document.getElementById('tracklistOverlay');
        const $title   = document.getElementById('tracklistTitle');
        const $body    = document.getElementById('tracklistBody');

        $title.textContent = 'Track List';
        $body.innerHTML = '<p class="loading">Looking up tracks…</p>';
        $overlay.classList.remove('hidden');

        try {
            const params = new URLSearchParams({ tracks: '1', artist, album });
            const data = await apiFetch(`${API}?${params}`);

            if (!data.tracks || !data.tracks.length) {
                $body.innerHTML = '<p class="loading">No track information found for this release.</p>';
                return;
            }

            $title.textContent = `${escHtml(data.artist)} — ${escHtml(data.album)}`;

            const coverSrc = data.cover_url
                ? escHtml(data.cover_url)
                : `${COVER_API}?artist=${encodeURIComponent(data.artist)}&album=${encodeURIComponent(data.album)}`;

            let html = '<div class="tracklist-header">';
            html += `<img class="tracklist-cover-img" src="${coverSrc}" alt="cover">`;
            html += `<div class="tracklist-info">`;
            html += `<div class="tracklist-artist">${escHtml(data.artist)}</div>`;
            html += `<div class="tracklist-album">${escHtml(data.album)}</div>`;
            html += `<div class="tracklist-count">${data.tracks.length} track${data.tracks.length !== 1 ? 's' : ''}</div>`;
            html += '</div></div>';

            // Group by disc if multi-disc
            const hasMultiDisc = data.tracks.some(t => t.disc && t.disc > 1);
            let currentDisc = null;

            html += '<div class="tracklist-table-wrap"><table class="tracklist-table">';
            html += '<thead><tr><th class="tl-num">#</th><th>Title</th><th class="tl-dur">Duration</th><th class="tl-lyrics">Lyrics</th></tr></thead><tbody>';

            data.tracks.forEach(t => {
                if (hasMultiDisc && t.disc !== currentDisc) {
                    currentDisc = t.disc;
                    const discLabel = t.disc_title ? `Disc ${t.disc}: ${escHtml(t.disc_title)}` : `Disc ${t.disc}`;
                    html += `<tr class="disc-divider"><td colspan="4">${discLabel}</td></tr>`;
                }
                const lyricsUrl = `lyrics.html?artist=${encodeURIComponent(data.artist)}&album=${encodeURIComponent(data.album)}&title=${encodeURIComponent(t.title)}`;
                html += `<tr>`;
                html += `<td class="tl-num">${escHtml(String(t.position))}</td>`;
                html += `<td>${escHtml(t.title)}</td>`;
                html += `<td class="tl-dur">${t.duration || '—'}</td>`;
                html += `<td class="tl-lyrics"><a href="${lyricsUrl}" target="_blank" class="lyrics-link" title="View lyrics">&#127908;</a></td>`;
                html += `</tr>`;
            });

            html += '</tbody></table></div>';

            $body.innerHTML = html;

            // Bind tracklist cover image error handler (CSP-compliant)
            const tracklistCoverImg = $body.querySelector('.tracklist-cover-img');
            if (tracklistCoverImg) {
                tracklistCoverImg.addEventListener('error', function() {
                    this.style.display = 'none';
                });
            }
        } catch {
            $body.innerHTML = '<p class="loading">Failed to load track list.</p>';
        }
    }

    // ── Save (Create / Update) ──────────────────────────────
    async function handleSave(e, force = false) {
        e.preventDefault();

        const payload = {
            artist:          document.getElementById('artist').value,
            album:           document.getElementById('album').value,
            year:            document.getElementById('year').value || null,
            genre:           document.getElementById('genre').value,
            format:          document.getElementById('format').value,
            condition_grade: document.getElementById('conditionGrade').value,
            cover_url:       document.getElementById('coverUrl').value,
            notes:           document.getElementById('notes').value,
            tags:            document.getElementById('tags').value,
        };

        const id = $recordId.value;

        try {
            if (id) {
                await apiFetch(`${API}?id=${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                showToast('Record updated!', 'success');
            } else {
                const url = force ? `${API}?force=1` : API;
                await apiFetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                showToast('Record added!', 'success');
            }
            closeModal();
            loadFilterOptions();
            loadRecords();
        } catch (err) {
            // If duplicate detected, offer to force-add
            if (!force && err.status === 409) {
                const dup = err.duplicate;
                const msg = dup
                    ? `"${dup.artist} — ${dup.album}" (${dup.format}) already exists. Add anyway?`
                    : 'A record with the same artist, album, and format already exists. Add anyway?';
                if (confirm(msg)) {
                    handleSave(e, true);
                }
            }
            // other errors already toasted by apiFetch
        }
    }

    // ── Delete ──────────────────────────────────────────────
    function openDeleteModal(id, records) {
        deleteTargetId = id;
        deleteTargetIds = [];
        const r = records.find(rec => rec.id == id);
        $deleteName.textContent = r ? `${r.artist} — ${r.album}` : `#${id}`;
        $deleteOverlay.classList.remove('hidden');
    }

    function openBulkDeleteModal() {
        if (!selectedIds.size) return;
        deleteTargetId = null;
        deleteTargetIds = [...selectedIds];
        const count = deleteTargetIds.length;
        $deleteName.textContent = `${count} selected record${count !== 1 ? 's' : ''}`;
        $deleteOverlay.classList.remove('hidden');
    }

    function closeDeleteModal() {
        $deleteOverlay.classList.add('hidden');
        deleteTargetId = null;
        deleteTargetIds = [];
    }

    async function handleDelete() {
        // Bulk delete
        if (deleteTargetIds.length > 0) {
            const ids = [...deleteTargetIds];
            let deleted = 0;
            try {
                for (const id of ids) {
                    await apiFetch(`${API}?id=${id}`, { method: 'DELETE' });
                    deleted++;
                }
                showToast(`${deleted} record${deleted !== 1 ? 's' : ''} deleted.`, 'success');
                closeDeleteModal();
                clearSelection();
                loadFilterOptions();
                loadRecords();
            } catch {
                if (deleted > 0) {
                    showToast(`${deleted} of ${ids.length} deleted (some failed).`, 'error');
                    clearSelection();
                    loadRecords();
                }
            }
            return;
        }

        // Single delete
        if (!deleteTargetId) return;
        try {
            await apiFetch(`${API}?id=${deleteTargetId}`, { method: 'DELETE' });
            showToast('Record deleted.', 'success');
            closeDeleteModal();
            loadFilterOptions();
            loadRecords();
        } catch {
            // error toasted
        }
    }

    // ── Selection helpers ─────────────────────────────────────
    function updateSelectToolbar() {
        const $toolbar = document.getElementById('selectToolbar');
        const $count   = document.getElementById('selectCount');
        if (selectedIds.size > 0) {
            $toolbar.classList.remove('hidden');
            $count.textContent = `${selectedIds.size} selected`;
        } else {
            $toolbar.classList.add('hidden');
        }
    }

    function clearSelection() {
        selectedIds.clear();
        $grid.querySelectorAll('.record-card.selected').forEach(c => c.classList.remove('selected'));
        $grid.querySelectorAll('.card-select').forEach(cb => cb.checked = false);
        updateSelectToolbar();
    }

    // ── CSV Import ──────────────────────────────────────────
    function openImportModal() {
        csvParsedRows = [];
        $csvFileInput.value = '';
        $importPreview.classList.add('hidden');
        $btnConfirmImport.classList.add('hidden');
        $importOverlay.classList.remove('hidden');
    }

    function closeImportModal() {
        $importOverlay.classList.add('hidden');
        csvParsedRows = [];
    }

    function parseCsvFile(file) {
        const reader = new FileReader();
        reader.onload = e => {
            const text = e.target.result;
            const rows = parseCsv(text);
            if (!rows.length) {
                showToast('CSV file is empty or has no data rows.', 'error');
                return;
            }
            csvParsedRows = rows;
            renderCsvPreview(rows);
        };
        reader.readAsText(file);
    }

    function parseCsv(text) {
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) return [];

        const headerLine = lines[0];
        const headers = parseCsvLine(headerLine).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));

        // Map common header aliases
        const aliasMap = {
            'condition': 'condition_grade',
            'condition grade': 'condition_grade',
            'cover': 'cover_url',
            'cover url': 'cover_url',
            'cover_image': 'cover_url',
            'image': 'cover_url',
            'image_url': 'cover_url',
        };

        const mappedHeaders = headers.map(h => aliasMap[h] || h);
        const validFields = ['artist', 'album', 'year', 'genre', 'format', 'condition_grade', 'notes', 'cover_url'];

        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const values = parseCsvLine(lines[i]);
            const obj = {};
            mappedHeaders.forEach((h, idx) => {
                if (validFields.includes(h)) {
                    obj[h] = (values[idx] || '').trim();
                }
            });
            // Default condition_grade to Mint if not provided
            if (!obj.condition_grade) {
                obj.condition_grade = 'Mint (M)';
            }
            // Only include rows that have at least artist or album
            if (obj.artist || obj.album) {
                rows.push(obj);
            }
        }
        return rows;
    }

    function parseCsvLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQuotes) {
                if (ch === '"' && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else if (ch === '"') {
                    inQuotes = false;
                } else {
                    current += ch;
                }
            } else {
                if (ch === '"') {
                    inQuotes = true;
                } else if (ch === ',') {
                    result.push(current);
                    current = '';
                } else {
                    current += ch;
                }
            }
        }
        result.push(current);
        return result;
    }

    function renderCsvPreview(rows) {
        const maxPreview = 10;
        const cols = ['artist', 'album', 'year', 'genre', 'format'];
        let html = '<thead><tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
        rows.slice(0, maxPreview).forEach(r => {
            html += '<tr>' + cols.map(c => `<td>${escHtml(r[c] || '')}</td>`).join('') + '</tr>';
        });
        html += '</tbody>';
        $previewTable.innerHTML = html;
        $previewTitle.textContent = `Preview — ${rows.length} record${rows.length !== 1 ? 's' : ''} found${rows.length > maxPreview ? ` (showing first ${maxPreview})` : ''}`;
        $importPreview.classList.remove('hidden');
        $btnConfirmImport.classList.remove('hidden');
        $btnConfirmImport.textContent = `Import ${rows.length} Record${rows.length !== 1 ? 's' : ''}`;
    }

    async function handleCsvImport() {
        if (!csvParsedRows.length) return;
        $btnConfirmImport.disabled = true;
        $btnConfirmImport.textContent = 'Importing…';

        try {
            const res = await fetch(`${API}?import=csv`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rows: csvParsedRows }),
            });
            const data = await res.json();
            if (data.imported > 0) {
                showToast(`${data.imported} of ${data.total} records imported!`, 'success');
                closeImportModal();
                loadRecords();
            } else {
                showToast(data.message || 'No records imported.', 'error');
            }
        } catch (err) {
            showToast('Import failed: ' + err.message, 'error');
        } finally {
            $btnConfirmImport.disabled = false;
            $btnConfirmImport.textContent = 'Import Records';
        }
    }

    function downloadCsvTemplate() {
        const header = 'artist,album,year,genre,format,condition_grade,notes,cover_url';
        const example = 'Pink Floyd,The Dark Side of the Moon,1973,Rock,Vinyl,"Near Mint (NM)","Original UK pressing",""';
        const blob = new Blob([header + '\n' + example + '\n'], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'records-template.csv';
        a.click();
        URL.revokeObjectURL(a.href);
    }

    // ── CSV Export ──────────────────────────────────────────
    async function handleExportCsv() {
        try {
            const records = await apiFetch(API);
            if (!records.length) {
                showToast('No records to export.', 'error');
                return;
            }

            const cols = ['artist', 'album', 'year', 'genre', 'format', 'condition_grade', 'notes', 'cover_url'];
            const header = cols.join(',');

            const rows = records.map(r =>
                cols.map(c => {
                    const val = r[c] ?? '';
                    const str = String(val);
                    // Wrap in quotes if the value contains comma, quote, or newline
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        return '"' + str.replace(/"/g, '""') + '"';
                    }
                    return str;
                }).join(',')
            );

            const csv = [header, ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            const date = new Date().toISOString().slice(0, 10);
            a.download = `my-records-backup-${date}.csv`;
            a.click();
            URL.revokeObjectURL(a.href);
            showToast(`Exported ${records.length} record${records.length !== 1 ? 's' : ''} to CSV.`, 'success');
        } catch {
            // error already toasted by apiFetch
        }
    }

    // ── Stats ───────────────────────────────────────────────
    // ── Discogs Value ──────────────────────────────────────
    async function openDiscogsValue(id, records, forceRefresh = false) {
        const rec = records.find(r => r.id == id);
        $discogsTitle.textContent = rec ? `${rec.artist} — ${rec.album}` : 'Discogs Value';
        $discogsBody.innerHTML = `<p class="loading">${forceRefresh ? 'Refreshing' : 'Looking up'} marketplace value…</p>`;
        $discogsOverlay.classList.remove('hidden');

        try {
            const refreshParam = forceRefresh ? '&refresh=1' : '';
            const d = await apiFetch(`${API}?discogs=value&id=${id}${refreshParam}`);
            if (d.error && d.lowest_price == null && d.median_price == null) {
                $discogsBody.innerHTML = `<p class="loading">${escHtml(d.error)}</p>`;
                return;
            }

            const hasPrice = d.lowest_price != null || d.median_price != null || d.highest_price != null;
            let html = '';

            // Condition-based multipliers (fraction of highest price)
            const conditionMultipliers = {
                'Mint (M)': 1.0,
                'Near Mint (NM)': 0.90,
                'Very Good Plus (VG+)': 0.70,
                'Very Good (VG)': 0.50,
                'Good (G)': 0.25,
                'Fair (F)': 0.15,
                'Poor (P)': 0.05
            };

            // Estimate value based on condition using the price range
            const conditionGrade = rec ? rec.condition_grade : '';
            const multiplier = conditionMultipliers[conditionGrade] ?? null;
            let estimatedValue = null;
            if (hasPrice && multiplier != null) {
                const high = d.highest_price != null ? Number(d.highest_price) : (d.median_price != null ? Number(d.median_price) : Number(d.lowest_price));
                const low = d.lowest_price != null ? Number(d.lowest_price) : (d.median_price != null ? Number(d.median_price) : high);
                estimatedValue = low + (high - low) * multiplier;
            }

            if (hasPrice) {
                // Show estimated value prominently if available
                if (estimatedValue != null) {
                    html += '<div class="discogs-prices">';
                    html += `<div class="discogs-price-card discogs-estimated">
                        <div class="discogs-price-value">$${estimatedValue.toFixed(2)}</div>
                        <div class="discogs-price-label">Estimated Value</div>
                        <div class="discogs-price-hint">${escHtml(conditionGrade)}</div>
                    </div>`;
                    html += '</div>';
                }

                // Market range
                const onlyLowest = d.lowest_price != null && d.median_price == null && d.highest_price == null;
                html += '<div class="discogs-prices discogs-range">';
                if (d.lowest_price != null) {
                    html += `<div class="discogs-price-card discogs-median">
                        <div class="discogs-price-value">$${Number(d.lowest_price).toFixed(2)}</div>
                        <div class="discogs-price-label">${onlyLowest ? 'Market Price' : 'Lowest'}</div>
                    </div>`;
                }
                if (d.median_price != null) {
                    html += `<div class="discogs-price-card discogs-median">
                        <div class="discogs-price-value">$${Number(d.median_price).toFixed(2)}</div>
                        <div class="discogs-price-label">Median</div>
                    </div>`;
                }
                if (d.highest_price != null) {
                    html += `<div class="discogs-price-card">
                        <div class="discogs-price-value discogs-high">$${Number(d.highest_price).toFixed(2)}</div>
                        <div class="discogs-price-label">Highest</div>
                    </div>`;
                }
                html += '</div>';
            }

            // Details
            html += '<ul class="discogs-details">';
            if (rec && rec.condition_grade) html += `<li><strong>Condition:</strong> ${escHtml(rec.condition_grade)}</li>`;
            if (d.num_for_sale)   html += `<li><strong>For Sale:</strong> ${d.num_for_sale} listings</li>`;
            if (d.label)          html += `<li><strong>Label:</strong> ${escHtml(d.label)}</li>`;
            if (d.catalog_number) html += `<li><strong>Cat#:</strong> ${escHtml(d.catalog_number)}</li>`;
            if (d.country)        html += `<li><strong>Country:</strong> ${escHtml(d.country)}</li>`;
            if (d.format_detail)  html += `<li><strong>Format:</strong> ${escHtml(d.format_detail)}</li>`;
            html += '</ul>';

            // Action buttons
            html += '<div class="discogs-actions">';
            if (d.discogs_url) {
                html += `<a href="${escHtml(d.discogs_url)}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm discogs-link">View on Discogs &#8599;</a>`;
            }
            html += `<button class="btn btn-ghost btn-sm btn-refresh-discogs" title="Re-fetch from Discogs">&#8635; Refresh</button>`;
            html += '</div>';

            if (!hasPrice) {
                html = '<p class="loading">No marketplace pricing available for this release.</p>';
                html += '<div class="discogs-actions">';
                if (d.discogs_url) {
                    html += `<a href="${escHtml(d.discogs_url)}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm discogs-link">View on Discogs &#8599;</a>`;
                }
                html += `<button class="btn btn-ghost btn-sm btn-refresh-discogs" title="Re-fetch from Discogs">&#8635; Refresh</button>`;
                html += '</div>';
            }

            $discogsBody.innerHTML = html;

            // Bind refresh button
            const $refreshBtn = $discogsBody.querySelector('.btn-refresh-discogs');
            if ($refreshBtn) {
                $refreshBtn.addEventListener('click', () => openDiscogsValue(id, records, true));
            }
        } catch {
            $discogsBody.innerHTML = '<p class="loading">Failed to fetch Discogs data.</p>';
        }
    }

    // ── Stats ───────────────────────────────────────────────
    async function openStats() {
        $statsBody.innerHTML = '<p class="loading">Loading statistics…</p>';
        $statsOverlay.classList.remove('hidden');

        try {
            const s = await apiFetch(`${API}?stats=1`);
            let html = '';

            // Top cards
            html += '<div class="stats-grid">';
            html += statCard(s.total, 'Total Records');
            html += statCard(s.by_genre?.length || 0, 'Genres');
            html += statCard(s.by_format?.length || 0, 'Formats');
            html += '</div>';

            // Genre breakdown
            if (s.by_genre?.length) {
                const max = s.by_genre[0].count;
                html += '<div class="stats-section"><h3>By Genre</h3><ul class="stats-bar-list">';
                s.by_genre.forEach(g => {
                    const pct = Math.round((g.count / max) * 100);
                    html += `<li class="stats-bar-item">
                        <span class="stats-bar-label">${escHtml(g.genre || 'Unknown')}</span>
                        <span class="stats-bar-track"><span class="stats-bar-fill" style="width:${pct}%"></span></span>
                        <span class="stats-bar-count">${g.count}</span>
                    </li>`;
                });
                html += '</ul></div>';
            }

            // Format breakdown
            if (s.by_format?.length) {
                const max = s.by_format[0].count;
                html += '<div class="stats-section"><h3>By Format</h3><ul class="stats-bar-list">';
                s.by_format.forEach(f => {
                    const pct = Math.round((f.count / max) * 100);
                    html += `<li class="stats-bar-item">
                        <span class="stats-bar-label">${escHtml(f.format)}</span>
                        <span class="stats-bar-track"><span class="stats-bar-fill" style="width:${pct}%"></span></span>
                        <span class="stats-bar-count">${f.count}</span>
                    </li>`;
                });
                html += '</ul></div>';
            }

            // By decade
            if (s.by_decade?.length) {
                const max = s.by_decade.reduce((m, d) => Math.max(m, d.count), 0);
                html += '<div class="stats-section"><h3>By Decade</h3><ul class="stats-bar-list">';
                s.by_decade.forEach(d => {
                    const pct = Math.round((d.count / max) * 100);
                    html += `<li class="stats-bar-item">
                        <span class="stats-bar-label">${d.decade}s</span>
                        <span class="stats-bar-track"><span class="stats-bar-fill" style="width:${pct}%"></span></span>
                        <span class="stats-bar-count">${d.count}</span>
                    </li>`;
                });
                html += '</ul></div>';
            }

            // Latest additions
            if (s.latest?.length) {
                html += '<div class="stats-section"><h3>Latest Additions</h3><ul class="stats-latest">';
                s.latest.forEach(l => {
                    html += `<li><strong>${escHtml(l.artist)}</strong> — ${escHtml(l.album)}</li>`;
                });
                html += '</ul></div>';
            }

            // Discogs collection value
            if (s.valuation) {
                const v = s.valuation;
                html += '<div class="stats-section stats-valuation"><h3>&#128176; Collection Value (Discogs)</h3>';
                html += '<div class="stats-grid">';
                html += statCard('$' + v.total_value.toFixed(0), 'Est. Collection Value');
                html += statCard('$' + v.avg_price.toFixed(2), 'Avg per Record');
                html += statCard(v.priced + '/' + s.total, 'Records Priced');
                html += '</div></div>';
            } else {
                html += '<div class="stats-section stats-valuation"><h3>&#128176; Collection Value</h3>';
                html += '<p class="stats-valuation-hint">Click the <strong>&#128176; Value</strong> button on individual records to fetch Discogs pricing.</p>';
                html += '</div>';
            }

            $statsBody.innerHTML = html;
        } catch {
            $statsBody.innerHTML = '<p class="loading">Failed to load statistics.</p>';
        }
    }

    function statCard(value, label) {
        return `<div class="stat-card"><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div>`;
    }

    // ── Toast ───────────────────────────────────────────────
    function showToast(msg, type = '') {
        $toast.textContent = msg;
        $toast.className = 'toast';
        if (type) $toast.classList.add(`toast-${type}`);
        $toast.classList.remove('hidden');
        setTimeout(() => $toast.classList.add('hidden'), 3000);
    }

    // ── Utils ───────────────────────────────────────────────
    function escHtml(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    // ── Expose functions for Priority 2 modules ────────────
    window.openModal = openEditModal;
    window.deleteRecord = (id) => {
        const records = window.records || [];
        openDeleteModal(id, records);
    };

})();
