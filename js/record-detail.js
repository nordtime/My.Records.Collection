/**
 * Record Detail View - Priority 2.1
 * Full-screen modal with complete metadata, ratings, and extended features
 */

(function() {
    'use strict';

    const RecordDetail = {
        currentRecord: null,
        relatedRecords: [],

        /**
         * Initialize detail view
         */
        init() {
            this.createDetailModal();
            this.bindEvents();
        },

        /**
         * Create detail modal structure
         */
        createDetailModal() {
            if (document.getElementById('record-detail-modal')) return;

            const modal = document.createElement('div');
            modal.id = 'record-detail-modal';
            modal.className = 'modal-overlay hidden detail-modal';
            modal.innerHTML = `
                <div class="detail-modal-content">
                    <!-- Close button -->
                    <button class="detail-close" aria-label="Close detail view">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>

                    <!-- Main content area -->
                    <div class="detail-grid">
                        <!-- Left column: Cover art -->
                        <div class="detail-cover-section">
                            <div class="detail-cover-wrapper">
                                <img class="detail-cover-img" alt="Album cover" />
                                <button class="cover-zoom-btn" aria-label="Zoom cover art">
                                    🔍
                                </button>
                            </div>
                            <div class="detail-quick-actions">
                                <button class="btn btn-primary detail-play-btn">
                                    <span class="btn-icon">📀</span> Mark as Played
                                </button>
                                <button class="btn btn-ghost detail-edit-btn">
                                    <span class="btn-icon">✎</span> Edit
                                </button>
                                <button class="btn btn-danger detail-delete-btn">
                                    <span class="btn-icon">🗑</span> Delete
                                </button>
                            </div>
                        </div>

                        <!-- Right column: Metadata -->
                        <div class="detail-info-section">
                            <!-- Header -->
                            <div class="detail-header">
                                <h1 class="detail-album"></h1>
                                <h2 class="detail-artist"></h2>
                            </div>

                            <!-- Rating -->
                            <div class="detail-rating">
                                <div class="star-rating" data-rating="0">
                                    <span class="star" data-value="1">★</span>
                                    <span class="star" data-value="2">★</span>
                                    <span class="star" data-value="3">★</span>
                                    <span class="star" data-value="4">★</span>
                                    <span class="star" data-value="5">★</span>
                                </div>
                                <span class="rating-text">Not rated</span>
                            </div>

                            <!-- Metadata tabs -->
                            <div class="detail-tabs">
                                <button class="detail-tab active" data-tab="info">Information</button>
                                <button class="detail-tab" data-tab="tracks">Tracks</button>
                                <button class="detail-tab" data-tab="history">History</button>
                                <button class="detail-tab" data-tab="related">Related</button>
                            </div>

                            <!-- Tab content -->
                            <div class="detail-tab-content">
                                <!-- Info tab -->
                                <div class="tab-pane active" data-pane="info">
                                    <div class="detail-metadata">
                                        <div class="metadata-row">
                                            <span class="metadata-label">Format</span>
                                            <span class="metadata-value detail-format"></span>
                                        </div>
                                        <div class="metadata-row">
                                            <span class="metadata-label">Year</span>
                                            <span class="metadata-value detail-year"></span>
                                        </div>
                                        <div class="metadata-row">
                                            <span class="metadata-label">Genre</span>
                                            <span class="metadata-value detail-genre"></span>
                                        </div>
                                        <div class="metadata-row">
                                            <span class="metadata-label">Condition</span>
                                            <span class="metadata-value detail-condition"></span>
                                        </div>
                                        <div class="metadata-row">
                                            <span class="metadata-label">Date Added</span>
                                            <span class="metadata-value detail-date-added"></span>
                                        </div>
                                        <div class="metadata-row purchase-row">
                                            <span class="metadata-label">Purchase Info</span>
                                            <span class="metadata-value detail-purchase"></span>
                                        </div>
                                        <div class="metadata-row value-row">
                                            <span class="metadata-label">Discogs Value</span>
                                            <span class="metadata-value detail-discogs-value"></span>
                                        </div>
                                        <div class="metadata-row plays-row">
                                            <span class="metadata-label">Play Count</span>
                                            <span class="metadata-value detail-play-count"></span>
                                        </div>
                                        <div class="metadata-row notes-row">
                                            <span class="metadata-label">Notes</span>
                                            <div class="metadata-value detail-notes"></div>
                                        </div>
                                    </div>

                                    <!-- Tags / shelves editor -->
                                    <div class="detail-tags-section">
                                        <span class="metadata-label">Tags / Shelves</span>
                                        <div class="detail-tags"></div>
                                        <form class="tag-add-form" autocomplete="off">
                                            <input type="text" class="input tag-add-input" placeholder="Add a tag…" maxlength="40" aria-label="Add a tag">
                                            <button type="submit" class="btn btn-ghost btn-sm">+ Add</button>
                                        </form>
                                    </div>

                                    <!-- External links -->
                                    <div class="detail-links">
                                        <a class="detail-link discogs-link" target="_blank" rel="noopener">
                                            <span class="link-icon">🔗</span> View on Discogs
                                        </a>
                                        <a class="detail-link musicbrainz-link" target="_blank" rel="noopener">
                                            <span class="link-icon">🎵</span> View on MusicBrainz
                                        </a>
                                    </div>
                                </div>

                                <!-- Tracks tab -->
                                <div class="tab-pane" data-pane="tracks">
                                    <div class="detail-tracklist"></div>
                                </div>

                                <!-- History tab -->
                                <div class="tab-pane" data-pane="history">
                                    <div class="detail-history"></div>
                                </div>

                                <!-- Related tab -->
                                <div class="tab-pane" data-pane="related">
                                    <div class="detail-related"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
        },

        /**
         * Bind event listeners
         */
        bindEvents() {
            const modal = document.getElementById('record-detail-modal');
            if (!modal) return;

            // Close button
            modal.querySelector('.detail-close')?.addEventListener('click', () => {
                this.close();
            });

            // Backdrop click (clicking outside modal content)
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.close();
            });

            // Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                    this.close();
                }
            });

            // Tab switching
            modal.querySelectorAll('.detail-tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    const tabName = e.target.getAttribute('data-tab');
                    this.switchTab(tabName);
                });
            });

            // Star rating
            modal.querySelectorAll('.star').forEach(star => {
                star.addEventListener('click', (e) => {
                    const rating = parseInt(e.target.getAttribute('data-value'));
                    this.setRating(rating);
                });

                star.addEventListener('mouseenter', (e) => {
                    const rating = parseInt(e.target.getAttribute('data-value'));
                    this.highlightStars(rating);
                });
            });

            modal.querySelector('.star-rating')?.addEventListener('mouseleave', () => {
                const currentRating = parseInt(modal.querySelector('.star-rating').getAttribute('data-rating') || 0);
                this.highlightStars(currentRating);
            });

            // Cover zoom
            modal.querySelector('.cover-zoom-btn')?.addEventListener('click', () => {
                this.zoomCover();
            });

            // Quick actions
            modal.querySelector('.detail-play-btn')?.addEventListener('click', () => {
                this.playRecord();
            });

            modal.querySelector('.detail-edit-btn')?.addEventListener('click', () => {
                this.editRecord();
            });

            modal.querySelector('.detail-delete-btn')?.addEventListener('click', () => {
                this.deleteRecord();
            });

            // Add a tag from the tag editor
            modal.querySelector('.tag-add-form')?.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = modal.querySelector('.tag-add-input');
                const val = input.value.trim();
                if (val) {
                    this.addTag(val);
                    input.value = '';
                }
            });
        },

        /**
         * Open detail view for a record
         */
        open(record) {
            this.currentRecord = record;
            const modal = document.getElementById('record-detail-modal');
            if (!modal) return;

            // Populate data
            this.populateData(record);

            // Load additional data
            this.loadTracks(record);
            this.loadHistory(record);
            this.loadRelated(record);

            // Show modal
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        },

        /**
         * Close detail view
         */
        close() {
            const modal = document.getElementById('record-detail-modal');
            if (!modal) return;

            modal.classList.add('hidden');
            document.body.style.overflow = '';
            this.currentRecord = null;
        },

        /**
         * Populate modal with record data
         */
        populateData(record) {
            const modal = document.getElementById('record-detail-modal');

            // Header
            modal.querySelector('.detail-album').textContent = record.album || 'Unknown Album';
            modal.querySelector('.detail-artist').textContent = record.artist || 'Unknown Artist';

            // Cover art
            const coverImg = modal.querySelector('.detail-cover-img');
            if (record.cover_url) {
                coverImg.src = record.cover_url;
                coverImg.style.display = 'block';
            } else {
                coverImg.style.display = 'none';
            }

            // Rating
            const rating = record.rating || 0;
            modal.querySelector('.star-rating').setAttribute('data-rating', rating);
            this.highlightStars(rating);
            this.updateRatingText(rating);

            // Metadata
            modal.querySelector('.detail-format').innerHTML = this.formatBadge(record.format);
            modal.querySelector('.detail-year').textContent = record.year || 'Unknown';
            modal.querySelector('.detail-genre').textContent = record.genre || 'Not specified';
            modal.querySelector('.detail-condition').textContent = record.condition_grade || record.condition || 'Not specified';
            modal.querySelector('.detail-date-added').textContent = this.formatDate(record.date_added || record.created_at);

            // Purchase info
            const purchaseInfo = [];
            if (record.purchase_date) purchaseInfo.push(`Purchased: ${this.formatDate(record.purchase_date)}`);
            if (record.purchase_price) purchaseInfo.push(`Price: $${record.purchase_price}`);
            if (record.purchase_location) purchaseInfo.push(`Location: ${record.purchase_location}`);
            modal.querySelector('.detail-purchase').textContent = purchaseInfo.length > 0 
                ? purchaseInfo.join(' • ') 
                : 'No purchase info';

            // Discogs value
            const discogsValue = record.discogs_value 
                ? `$${parseFloat(record.discogs_value).toFixed(2)}` 
                : 'Not valued';
            modal.querySelector('.detail-discogs-value').textContent = discogsValue;

            // Play count
            modal.querySelector('.detail-play-count').textContent = record.play_count || 0;

            // Notes
            modal.querySelector('.detail-notes').textContent = record.notes || 'No notes';

            // Tags / shelves
            this.renderTags(record);

            // External links
            const discogsLink = modal.querySelector('.discogs-link');
            const mbLink = modal.querySelector('.musicbrainz-link');

            if (record.discogs_url) {
                discogsLink.href = record.discogs_url;
                discogsLink.style.display = 'flex';
            } else {
                discogsLink.style.display = 'none';
            }

            if (record.musicbrainz_url) {
                mbLink.href = record.musicbrainz_url;
                mbLink.style.display = 'flex';
            } else {
                mbLink.style.display = 'none';
            }
        },

        /**
         * Load track listing
         */
        async loadTracks(record) {
            const tracklistEl = document.querySelector('.detail-tracklist');
            tracklistEl.innerHTML = '<div class="loading-message">Loading tracks…</div>';

            const artist = record.artist || '';
            const album = record.album || '';

            if (!artist || !album) {
                tracklistEl.innerHTML = `
                    <p style="color: var(--text-muted); text-align: center; padding: 2rem;">
                        Track listing not available.
                    </p>
                `;
                return;
            }

            try {
                const params = new URLSearchParams({ tracks: '1', artist, album });
                const response = await fetch(`api/api.php?${params}`);
                const data = await response.json();

                if (!data.tracks || !data.tracks.length) {
                    tracklistEl.innerHTML = `
                        <p style="color: var(--text-muted); text-align: center; padding: 2rem;">
                            No track information found for this release.
                        </p>
                    `;
                    return;
                }

                const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({
                    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
                }[c]));

                const hasMultiDisc = data.tracks.some(t => t.disc && t.disc > 1);
                let lastDisc = null;
                let rows = '';

                data.tracks.forEach(t => {
                    if (hasMultiDisc && t.disc !== lastDisc) {
                        lastDisc = t.disc;
                        rows += `<div class="track-disc-header">Disc ${esc(t.disc)}</div>`;
                    }
                    rows += `
                        <div class="track-row">
                            <span class="track-position">${esc(t.position)}</span>
                            <span class="track-title">${esc(t.title)}</span>
                            <span class="track-duration">${t.duration ? esc(t.duration) : ''}</span>
                        </div>
                    `;
                });

                tracklistEl.innerHTML = `<div class="track-list">${rows}</div>`;
            } catch (error) {
                console.error('Failed to load tracks:', error);
                tracklistEl.innerHTML = `
                    <p style="color: var(--text-muted); text-align: center; padding: 2rem;">
                        Failed to load track listing.
                    </p>
                `;
            }
        },

        /**
         * Load listening history
         */
        async loadHistory(record) {
            const historyEl = document.querySelector('.detail-history');
            historyEl.innerHTML = '<div class="loading-message">Loading history...</div>';

            // Fetch listening sessions from backend
            try {
                const response = await fetch(`api/api.php?sessions=1&record_id=${record.id}`);
                const data = await response.json();

                if (data.success && data.sessions?.length > 0) {
                    historyEl.innerHTML = `
                        <div class="history-list">
                            ${data.sessions.map(session => `
                                <div class="history-item">
                                    <span class="history-icon">▶</span>
                                    <span class="history-date">${this.formatDateTime(session.played_at)}</span>
                                </div>
                            `).join('')}
                        </div>
                    `;
                } else {
                    historyEl.innerHTML = `
                        <p style="color: var(--text-muted); text-align: center; padding: 2rem;">
                            No listening history yet.<br>
                            <small>Click "Mark as Played" to start tracking</small>
                        </p>
                    `;
                }
            } catch (error) {
                historyEl.innerHTML = `
                    <p style="color: var(--text-muted); text-align: center; padding: 2rem;">
                        No listening history yet.<br>
                        <small>Click "Mark as Played" to start tracking</small>
                    </p>
                `;
            }
        },

        /**
         * Load related records (same artist or genre)
         */
        async loadRelated(record) {
            const relatedEl = document.querySelector('.detail-related');
            relatedEl.innerHTML = '<div class="loading-message">Loading related records...</div>';

            // This would fetch from window.records (from app.js)
            setTimeout(() => {
                const allRecords = window.records || [];
                const related = allRecords
                    .filter(r => r.id !== record.id && (r.artist === record.artist || r.genre === record.genre))
                    .slice(0, 6);

                if (related.length > 0) {
                    relatedEl.innerHTML = `
                        <div class="related-grid">
                            ${related.map(r => `
                                <div class="related-card" data-record-id="${r.id}">
                                    <div class="related-cover">
                                        ${r.cover_url 
                                            ? `<img src="${r.cover_url}" alt="${r.album}" />` 
                                            : '<span class="cover-placeholder">🎵</span>'
                                        }
                                    </div>
                                    <div class="related-info">
                                        <div class="related-album">${r.album}</div>
                                        <div class="related-artist">${r.artist}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;

                    // Bind click events
                    relatedEl.querySelectorAll('.related-card').forEach(card => {
                        card.addEventListener('click', () => {
                            const recordId = card.getAttribute('data-record-id');
                            const relatedRecord = allRecords.find(r => r.id == recordId);
                            if (relatedRecord) {
                                this.open(relatedRecord);
                            }
                        });
                    });
                } else {
                    relatedEl.innerHTML = `
                        <p style="color: var(--text-muted); text-align: center; padding: 2rem;">
                            No related records found
                        </p>
                    `;
                }
            }, 300);
        },

        /**
         * Switch tabs
         */
        switchTab(tabName) {
            const modal = document.getElementById('record-detail-modal');

            // Update tab buttons
            modal.querySelectorAll('.detail-tab').forEach(tab => {
                tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
            });

            // Update tab panes
            modal.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.toggle('active', pane.getAttribute('data-pane') === tabName);
            });
        },

        /**
         * Set rating
         */
        async setRating(rating) {
            if (!this.currentRecord) return;

            const modal = document.getElementById('record-detail-modal');
            modal.querySelector('.star-rating').setAttribute('data-rating', rating);
            this.highlightStars(rating);
            this.updateRatingText(rating);

            // Save to backend
            try {
                const response = await fetch('api/api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        rate: 1,
                        record_id: this.currentRecord.id,
                        rating: rating
                    })
                });

                const data = await response.json();
                if (data.success) {
                    if (window.ToastNotifications) {
                        window.ToastNotifications.success(`Rated ${rating} star${rating !== 1 ? 's' : ''}`);
                    }
                    // Update in window.records
                    if (window.records) {
                        const record = window.records.find(r => r.id === this.currentRecord.id);
                        if (record) record.rating = rating;
                    }
                    this.currentRecord.rating = rating;
                }
            } catch (error) {
                console.error('Failed to save rating:', error);
            }
        },

        /**
         * Parse a record's tags string into an array.
         */
        getTags(record) {
            if (!record || !record.tags) return [];
            return record.tags.split(',').map(t => t.trim()).filter(Boolean);
        },

        /**
         * Render the tag chips in the detail view.
         */
        renderTags(record) {
            const el = document.querySelector('.detail-tags');
            if (!el) return;
            const tags = this.getTags(record);
            if (!tags.length) {
                el.innerHTML = '<span class="detail-tags-empty">No tags yet</span>';
                return;
            }
            el.innerHTML = tags.map(t => `
                <span class="detail-tag-chip">
                    <span class="detail-tag-name">${this.escapeHtml(t)}</span>
                    <button class="detail-tag-remove" data-tag="${this.escapeHtml(t)}" title="Remove tag" aria-label="Remove ${this.escapeHtml(t)}">✕</button>
                </span>
            `).join('');

            el.querySelectorAll('.detail-tag-remove').forEach(btn =>
                btn.addEventListener('click', () => this.removeTag(btn.dataset.tag))
            );
        },

        addTag(tag) {
            const tags = this.getTags(this.currentRecord);
            const clean = tag.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
            if (!clean || tags.some(t => t.toLowerCase() === clean.toLowerCase())) return;
            tags.push(clean);
            this.saveTags(tags);
        },

        removeTag(tag) {
            const tags = this.getTags(this.currentRecord).filter(t => t.toLowerCase() !== tag.toLowerCase());
            this.saveTags(tags);
        },

        async saveTags(tags) {
            if (!this.currentRecord) return;
            const tagStr = tags.join(',');
            // Optimistic update
            this.currentRecord.tags = tagStr;
            this.renderTags(this.currentRecord);

            try {
                const response = await fetch('api/api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ set_tags: 1, record_id: this.currentRecord.id, tags: tagStr })
                });
                const data = await response.json();
                if (data.success) {
                    const normalized = (data.tags || []).join(',');
                    this.currentRecord.tags = normalized;
                    if (window.records) {
                        const rec = window.records.find(r => r.id === this.currentRecord.id);
                        if (rec) rec.tags = normalized;
                    }
                    this.renderTags(this.currentRecord);
                    // Refresh the grid card so its chips update
                    if (window.triggerRecordReload) window.triggerRecordReload();
                } else {
                    throw new Error(data.message || 'Failed');
                }
            } catch (error) {
                console.error('Failed to save tags:', error);
                if (window.ToastNotifications) window.ToastNotifications.error('Failed to save tags');
            }
        },

        escapeHtml(s) {
            return String(s ?? '').replace(/[&<>"']/g, c => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
            }[c]));
        },

        /**
         * Highlight stars
         */
        highlightStars(rating) {
            const modal = document.getElementById('record-detail-modal');
            modal.querySelectorAll('.star').forEach((star, idx) => {
                star.classList.toggle('active', idx < rating);
            });
        },

        /**
         * Update rating text
         */
        updateRatingText(rating) {
            const modal = document.getElementById('record-detail-modal');
            const text = rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Not rated';
            modal.querySelector('.rating-text').textContent = text;
        },

        /**
         * Zoom cover art
         */
        zoomCover() {
            if (!this.currentRecord?.cover_url) return;

            // Create lightbox
            const lightbox = document.createElement('div');
            lightbox.className = 'cover-lightbox';
            lightbox.innerHTML = `
                <div class="lightbox-overlay"></div>
                <div class="lightbox-content">
                    <img src="${this.currentRecord.cover_url}" alt="Cover art" />
                    <button class="lightbox-close">✕</button>
                </div>
            `;

            document.body.appendChild(lightbox);
            requestAnimationFrame(() => lightbox.classList.add('active'));

            // Close handlers
            const close = () => {
                lightbox.classList.remove('active');
                setTimeout(() => lightbox.remove(), 300);
            };

            lightbox.querySelector('.lightbox-close').addEventListener('click', close);
            lightbox.querySelector('.lightbox-overlay').addEventListener('click', close);
            document.addEventListener('keydown', function escHandler(e) {
                if (e.key === 'Escape') {
                    close();
                    document.removeEventListener('keydown', escHandler);
                }
            });
        },

        /**
         * Mark record as played (log listening session)
         */
        async playRecord() {
            if (!this.currentRecord) return;

            try {
                const response = await fetch('api/api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        play: 1,
                        record_id: this.currentRecord.id
                    })
                });

                const data = await response.json();
                if (data.success) {
                    if (window.ToastNotifications) {
                        window.ToastNotifications.success('Marked as played!');
                    }
                    // Update play count
                    this.currentRecord.play_count = (this.currentRecord.play_count || 0) + 1;
                    document.querySelector('.detail-play-count').textContent = this.currentRecord.play_count;

                    // Reload history
                    this.loadHistory(this.currentRecord);
                } else {
                    throw new Error(data.message || 'Failed to log play');
                }
            } catch (error) {
                console.error('Failed to log play:', error);
                if (window.ToastNotifications) {
                    window.ToastNotifications.error('Failed to log listening session');
                }
            }
        },

        /**
         * Edit record
         */
        editRecord() {
            const id = this.currentRecord?.id;
            this.close();
            if (id != null && window.openModal) {
                window.openModal(id);
            }
        },

        /**
         * Delete record
         */
        async deleteRecord() {
            const record = this.currentRecord;
            if (!record) return;
            if (!confirm(`Delete "${record.album}"?`)) return;

            this.close();

            if (window.deleteRecord) {
                window.deleteRecord(record.id);
            }
        },

        /**
         * Format date
         */
        formatDate(dateString) {
            if (!dateString) return 'Unknown';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        },

        /**
         * Format date and time
         */
        formatDateTime(dateString) {
            if (!dateString) return 'Unknown';
            const date = new Date(dateString);
            return date.toLocaleString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        /**
         * Format badge HTML
         */
        formatBadge(format) {
            const badges = {
                'Vinyl': '<span class="badge badge-vinyl">Vinyl</span>',
                'CD': '<span class="badge badge-cd">CD</span>',
                'Cassette': '<span class="badge badge-cassette">Cassette</span>',
                'Digital': '<span class="badge badge-digital">Digital</span>'
            };
            return badges[format] || `<span class="badge">${format}</span>`;
        }
    };

    // Expose globally
    window.RecordDetail = RecordDetail;

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => RecordDetail.init());
    } else {
        RecordDetail.init();
    }

})();
