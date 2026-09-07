/**
 * Wishlist & Want List - Priority 2.3
 * Track records you want to buy with price tracking
 */

(function() {
    'use strict';
    const tr = (key, values = {}, fallback = key) => window.I18n
        ? window.I18n.t(key, values, fallback)
        : fallback;

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, character => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[character]));
    }

    function safeExternalUrl(value) {
        try {
            const url = new URL(String(value));
            return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
        } catch {
            return '';
        }
    }

    const Wishlist = {
        wishlistItems: [],

        /**
         * Initialize wishlist
         */
        init() {
            this.createWishlistView();
            this.bindEvents();
            this.loadWishlist();
        },

        /**
         * Create wishlist view (add tab to main interface)
         */
        createWishlistView() {
            // Add wishlist button to header nav
            const nav = document.querySelector('.header-nav');
            if (!nav) return;

            const wishlistBtn = document.createElement('button');
            wishlistBtn.id = 'wishlist-btn';
            wishlistBtn.className = 'btn btn-ghost';
            wishlistBtn.innerHTML = '<span style="margin-inline-end: 0.5rem;">💝</span> <span data-i18n="nav.wishlist">Wishlist</span>';
            
            // Insert before stats button
            const statsBtn = document.getElementById('btnStats');
            if (statsBtn) {
                nav.insertBefore(wishlistBtn, statsBtn);
            } else {
                nav.appendChild(wishlistBtn);
            }

            // Create wishlist modal (outer = modal-overlay hidden, matches static modal pattern)
            const modal = document.createElement('div');
            modal.id = 'wishlist-modal';
            modal.className = 'modal-overlay hidden';
            modal.innerHTML = `
                <div class="modal modal-wide">
                    <div class="modal-header">
                        <h2>💝 <span data-i18n="wishlist.title">Wishlist & Want List</span></h2>
                        <button class="btn-close modal-close" aria-label="Close" data-i18n-aria-label="common.close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="wishlist-toolbar">
                            <button class="btn btn-primary" id="add-wish-btn" data-i18n="wishlist.add">+ Add to Wishlist</button>
                            <div class="wishlist-stats">
                                <span id="wishlistCount">0 items</span>
                                <span class="stat-divider">•</span>
                                <span id="wishlistTotal">$0.00 total</span>
                            </div>
                        </div>
                        <div class="wishlist-grid" id="wishlistGrid"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Create add/edit wish modal
            const wishFormModal = document.createElement('div');
            wishFormModal.id = 'wish-form-modal';
            wishFormModal.className = 'modal-overlay hidden';
            wishFormModal.innerHTML = `
                <div class="modal">
                    <div class="modal-header">
                        <h2 id="wishFormTitle" data-i18n="wishlist.addTitle">Add to Wishlist</h2>
                        <button class="btn-close modal-close" aria-label="Close" data-i18n-aria-label="common.close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="wishForm">
                            <input type="hidden" id="wish-id" />
                            <div class="form-group">
                                <label for="wish-artist"><span data-i18n="record.artist">Artist</span> *</label>
                                <input type="text" id="wish-artist" class="input" required />
                            </div>
                            <div class="form-group">
                                <label for="wish-album"><span data-i18n="record.album">Album</span> *</label>
                                <input type="text" id="wish-album" class="input" required />
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="wish-format" data-i18n="record.format">Format</label>
                                    <select id="wish-format" class="input select">
                                        <option value="Vinyl">Vinyl</option>
                                        <option value="CD">CD</option>
                                        <option value="Cassette">Cassette</option>
                                        <option value="Digital">Digital</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="wish-target-price" data-i18n="wishlist.targetPrice">Target Price ($)</label>
                                    <input type="number" id="wish-target-price" class="input" step="0.01" min="0" />
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="wish-discogs-url" data-i18n="wishlist.discogsUrl">Discogs URL</label>
                                <input type="url" id="wish-discogs-url" class="input" placeholder="https://www.discogs.com/..." />
                            </div>
                            <div class="form-group">
                                <label for="wish-notes" data-i18n="record.notes">Notes</label>
                                <textarea id="wish-notes" class="input" rows="3"></textarea>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-ghost" id="cancelWishBtn" data-i18n="common.cancel">Cancel</button>
                                <button type="submit" class="btn btn-primary" data-i18n="wishlist.save">Save to Wishlist</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            document.body.appendChild(wishFormModal);
        },

        /**
         * Bind events
         */
        bindEvents() {
            // Wishlist button
            document.getElementById('wishlist-btn')?.addEventListener('click', () => {
                this.openWishlist();
            });

            // Add wish button
            document.getElementById('add-wish-btn')?.addEventListener('click', () => {
                this.openWishForm();
            });

            // Wish form submit
            document.getElementById('wishForm')?.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveWish();
            });

            // Cancel button
            document.getElementById('cancelWishBtn')?.addEventListener('click', () => {
                this.closeWishForm();
            });

            // Modal close buttons and backdrop click
            document.getElementById('wishlist-modal')?.addEventListener('click', (e) => {
                if (e.target === document.getElementById('wishlist-modal') || e.target.classList.contains('modal-close')) {
                    document.getElementById('wishlist-modal').classList.add('hidden');
                }
            });

            document.getElementById('wish-form-modal')?.addEventListener('click', (e) => {
                if (e.target === document.getElementById('wish-form-modal') || e.target.classList.contains('modal-close')) {
                    this.closeWishForm();
                }
            });
        },

        /**
         * Load wishlist from backend
         */
        async loadWishlist() {
            try {
                const response = await fetch('api/api.php?wishlist=1');
                const data = await response.json();

                if (data.success) {
                    this.wishlistItems = data.wishlist || [];
                    this.renderWishlist();
                }
            } catch (error) {
                console.error('Failed to load wishlist:', error);
                this.wishlistItems = [];
            }
        },

        /**
         * Open wishlist modal
         */
        openWishlist() {
            const modal = document.getElementById('wishlist-modal');
            if (modal) {
                modal.classList.remove('hidden');
                this.renderWishlist();
            }
        },

        /**
         * Render wishlist items
         */
        renderWishlist() {
            const grid = document.getElementById('wishlistGrid');
            if (!grid) return;

            // Update stats
            const countEl = document.getElementById('wishlistCount');
            const totalEl = document.getElementById('wishlistTotal');
            
            const count = this.wishlistItems.length;
            const total = this.wishlistItems.reduce((sum, item) => {
                return sum + (parseFloat(item.target_price) || 0);
            }, 0);

            if (countEl) countEl.textContent = tr('wishlist.items', { count }, `${count} item${count !== 1 ? 's' : ''}`);
            if (totalEl) totalEl.textContent = tr('wishlist.total', { amount: `$${total.toFixed(2)}` }, `$${total.toFixed(2)} total`);

            // Render items
            if (this.wishlistItems.length === 0) {
                grid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">💝</div>
                        <h3>${escapeHtml(tr('wishlist.emptyTitle', {}, 'Your wishlist is empty'))}</h3>
                        <p>${escapeHtml(tr('wishlist.emptyText', {}, 'Add records you want to buy to track prices and availability'))}</p>
                        <button class="btn btn-primary" id="addFirstWishItem">
                            ${escapeHtml(tr('wishlist.addFirst', {}, '+ Add First Item'))}
                        </button>
                    </div>
                `;
                // Bind button handler (CSP-compliant)
                const addFirstBtn = document.getElementById('addFirstWishItem');
                if (addFirstBtn) {
                    addFirstBtn.addEventListener('click', () => window.Wishlist.openWishForm());
                }
                return;
            }

            grid.innerHTML = this.wishlistItems.map(item => {
                const discogsUrl = safeExternalUrl(item.discogs_url);
                return `
                <div class="wish-card" data-wish-id="${Number(item.id)}">
                    <div class="wish-header">
                        <div class="wish-format-badge">
                            <span class="badge">${escapeHtml(item.format || 'Vinyl')}</span>
                        </div>
                        <div class="wish-actions">
                            <button class="icon-btn wish-edit-btn" data-wish-id="${Number(item.id)}" title="${escapeHtml(tr('common.edit', {}, 'Edit'))}">
                                ✎
                            </button>
                            <button class="icon-btn wish-mark-btn" data-wish-id="${Number(item.id)}" title="${escapeHtml(tr('wishlist.markPurchased', {}, 'Mark as Purchased'))}">
                                ✓
                            </button>
                            <button class="icon-btn danger wish-delete-btn" data-wish-id="${Number(item.id)}" title="${escapeHtml(tr('common.delete', {}, 'Delete'))}">
                                🗑
                            </button>
                        </div>
                    </div>

                    <div class="wish-info">
                        <h4 class="wish-album" dir="auto">${escapeHtml(item.album)}</h4>
                        <p class="wish-artist" dir="auto">${escapeHtml(item.artist)}</p>
                    </div>

                    ${item.target_price ? `
                        <div class="wish-price">
                            <span class="price-label">${escapeHtml(tr('wishlist.target', {}, 'Target:'))}</span>
                            <span class="price-value">$${parseFloat(item.target_price).toFixed(2)}</span>
                        </div>
                    ` : ''}

                    ${item.notes ? `
                        <div class="wish-notes" dir="auto">${escapeHtml(item.notes)}</div>
                    ` : ''}

                    ${discogsUrl ? `
                        <a href="${escapeHtml(discogsUrl)}" target="_blank" rel="noopener noreferrer" class="wish-link">
                            ${escapeHtml(tr('wishlist.viewDiscogs', {}, 'View on Discogs'))} →
                        </a>
                    ` : ''}

                    <div class="wish-footer">
                        <span class="wish-date">${escapeHtml(tr('wishlist.added', { date: this.formatDate(item.added_at) }, `Added ${this.formatDate(item.added_at)}`))}</span>
                    </div>
                </div>
            `;
            }).join('');

            // Bind wish card action buttons (CSP-compliant)
            grid.querySelectorAll('.wish-edit-btn').forEach(btn =>
                btn.addEventListener('click', () => window.Wishlist.editWish(parseInt(btn.dataset.wishId)))
            );
            grid.querySelectorAll('.wish-mark-btn').forEach(btn =>
                btn.addEventListener('click', () => window.Wishlist.markPurchased(parseInt(btn.dataset.wishId)))
            );
            grid.querySelectorAll('.wish-delete-btn').forEach(btn =>
                btn.addEventListener('click', () => window.Wishlist.deleteWish(parseInt(btn.dataset.wishId)))
            );
        },

        /**
         * Open wish form (add or edit)
         */
        openWishForm(wish = null) {
            const modal = document.getElementById('wish-form-modal');
            const form = document.getElementById('wishForm');
            const title = document.getElementById('wishFormTitle');

            if (wish) {
                // Edit mode
                title.textContent = tr('wishlist.editTitle', {}, 'Edit Wishlist Item');
                document.getElementById('wish-id').value = wish.id;
                document.getElementById('wish-artist').value = wish.artist;
                document.getElementById('wish-album').value = wish.album;
                document.getElementById('wish-format').value = wish.format || 'Vinyl';
                document.getElementById('wish-target-price').value = wish.target_price || '';
                document.getElementById('wish-discogs-url').value = wish.discogs_url || '';
                document.getElementById('wish-notes').value = wish.notes || '';
            } else {
                // Add mode
                title.textContent = tr('wishlist.addTitle', {}, 'Add to Wishlist');
                form.reset();
                document.getElementById('wish-id').value = '';
            }

            modal.classList.remove('hidden');
        },

        closeWishForm() {
            const modal = document.getElementById('wish-form-modal');
            modal.classList.add('hidden');
        },

        /**
         * Save wish (add or update)
         */
        async saveWish() {
            const id = document.getElementById('wish-id').value;
            const artist = document.getElementById('wish-artist').value.trim();
            const album = document.getElementById('wish-album').value.trim();
            const format = document.getElementById('wish-format').value;
            const targetPrice = document.getElementById('wish-target-price').value;
            const discogsUrl = document.getElementById('wish-discogs-url').value.trim();
            const notes = document.getElementById('wish-notes').value.trim();

            if (!artist || !album) {
                if (window.ToastNotifications) {
                    window.ToastNotifications.warning(tr('wishlist.required', {}, 'Artist and Album are required'));
                }
                return;
            }

            try {
                const response = await fetch('api/api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        wish: id ? 'update' : 'add',
                        wish_id: id || undefined,
                        artist,
                        album,
                        format,
                        target_price: targetPrice || null,
                        discogs_url: discogsUrl || null,
                        notes: notes || null
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    if (window.ToastNotifications) {
                        window.ToastNotifications.success(
                            id ? tr('wishlist.updated', {}, 'Wishlist item updated!') : tr('wishlist.addedSuccess', {}, 'Added to wishlist!')
                        );
                    }
                    this.closeWishForm();
                    await this.loadWishlist();
                } else {
                    throw new Error(data.message || 'Failed to save');
                }
            } catch (error) {
                console.error('Failed to save wish:', error);
                if (window.ToastNotifications) {
                    window.ToastNotifications.error(tr('wishlist.saveFailed', {}, 'Failed to save wishlist item'));
                }
            }
        },

        /**
         * Edit wish
         */
        editWish(wishId) {
            const wish = this.wishlistItems.find(w => w.id == wishId);
            if (wish) {
                this.openWishForm(wish);
            }
        },

        /**
         * Mark as purchased (move to collection)
         */
        async markPurchased(wishId) {
            const wish = this.wishlistItems.find(w => w.id == wishId);
            if (!wish) return;

            if (!confirm(tr('wishlist.purchaseConfirm', { album: wish.album }, `Mark "${wish.album}" as purchased and add to collection?`))) return;

            try {
                const response = await fetch('api/api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        wish: 'purchase',
                        wish_id: wishId
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    if (window.ToastNotifications) {
                        window.ToastNotifications.success(tr('wishlist.moved', {}, 'Moved to collection!'));
                    }
                    await this.loadWishlist();
                    
                    // Reload main records if available
                    if (window.triggerRecordReload) {
                        window.triggerRecordReload();
                    }
                } else {
                    throw new Error(data.message || 'Failed to purchase');
                }
            } catch (error) {
                console.error('Failed to mark as purchased:', error);
                if (window.ToastNotifications) {
                    window.ToastNotifications.error(tr('wishlist.purchaseFailed', {}, 'Failed to mark as purchased'));
                }
            }
        },

        /**
         * Delete wish
         */
        async deleteWish(wishId) {
            const wish = this.wishlistItems.find(w => w.id == wishId);
            if (!wish) return;

            if (!confirm(tr('wishlist.deleteConfirm', { album: wish.album }, `Delete "${wish.album}" from wishlist?`))) return;

            try {
                const response = await fetch(`api/api.php?wish_id=${wishId}`, {
                    method: 'DELETE'
                });

                const data = await response.json();
                
                if (data.success) {
                    if (window.ToastNotifications) {
                        window.ToastNotifications.success(tr('wishlist.removed', {}, 'Removed from wishlist'));
                    }
                    await this.loadWishlist();
                } else {
                    throw new Error(data.message || 'Failed to delete');
                }
            } catch (error) {
                console.error('Failed to delete wish:', error);
                if (window.ToastNotifications) {
                    window.ToastNotifications.error(tr('wishlist.deleteFailed', {}, 'Failed to delete wishlist item'));
                }
            }
        },

        /**
         * Format date
         */
        formatDate(dateString) {
            if (!dateString) return tr('common.recently', {}, 'Recently');
            const date = new Date(dateString);
            const now = new Date();
            const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

            const relative = new Intl.RelativeTimeFormat(window.I18n?.locale || 'en-US', { numeric: 'auto' });
            if (diffDays < 7) return relative.format(-diffDays, 'day');
            if (diffDays < 30) return relative.format(-Math.floor(diffDays / 7), 'week');
            if (diffDays < 365) return relative.format(-Math.floor(diffDays / 30), 'month');
            return date.toLocaleDateString(window.I18n?.locale || 'en-US', { month: 'short', year: 'numeric' });
        }
    };

    // Expose globally
    window.Wishlist = Wishlist;

    document.addEventListener('rc:languagechange', () => Wishlist.renderWishlist());

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Wishlist.init());
    } else {
        Wishlist.init();
    }

})();
