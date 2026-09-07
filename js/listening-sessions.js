/**
 * Listening Sessions - Priority 2.4
 * Track when you play records, view history, and stats
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

    const ListeningSessions = {
        currentSessions: [],
        currentStats: null,
        /**
         * Initialize listening sessions
         */
        init() {
            this.createSessionsView();
            this.bindEvents();
        },

        /**
         * Create listening sessions view (add to toolbar)
         */
        createSessionsView() {
            const toolbar = document.querySelector('.header-nav');
            if (!toolbar) return;

            const sessionsBtn = document.createElement('button');
            sessionsBtn.id = 'sessions-btn';
            sessionsBtn.className = 'btn btn-ghost';
            sessionsBtn.innerHTML = '<span style="margin-inline-end: 0.5rem;">📻</span> <span data-i18n="nav.history">History</span>';
            
            // Insert before wishlist button or before stats button
            const wishlistBtn = document.getElementById('wishlist-btn');
            const statsBtn = document.getElementById('btnStats');
            const anchor = wishlistBtn || statsBtn;
            if (anchor) {
                toolbar.insertBefore(sessionsBtn, anchor);
            } else {
                toolbar.appendChild(sessionsBtn);
            }

            // Create sessions modal (outer = modal-overlay hidden, matches static modal pattern)
            const modal = document.createElement('div');
            modal.id = 'sessions-modal';
            modal.className = 'modal-overlay hidden';
            modal.innerHTML = `
                <div class="modal modal-wide">
                    <div class="modal-header">
                        <h2>📻 <span data-i18n="sessions.title">Listening History</span></h2>
                        <button class="btn-close modal-close" aria-label="Close" data-i18n-aria-label="common.close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="sessions-stats">
                            <div class="session-stat-card">
                                <div class="session-stat-icon">🎵</div>
                                <div class="session-stat-content">
                                    <div class="session-stat-value" id="totalPlays">0</div>
                                    <div class="session-stat-label" data-i18n="sessions.totalPlays">Total Plays</div>
                                </div>
                            </div>
                            <div class="session-stat-card">
                                <div class="session-stat-icon">🔥</div>
                                <div class="session-stat-content">
                                    <div class="session-stat-value" id="currentStreak">0</div>
                                    <div class="session-stat-label" data-i18n="sessions.dayStreak">Day Streak</div>
                                </div>
                            </div>
                            <div class="session-stat-card">
                                <div class="session-stat-icon">⭐</div>
                                <div class="session-stat-content">
                                    <div class="session-stat-value" id="mostPlayedRecord">—</div>
                                    <div class="session-stat-label" data-i18n="sessions.mostPlayed">Most Played</div>
                                </div>
                            </div>
                            <div class="session-stat-card">
                                <div class="session-stat-icon">📅</div>
                                <div class="session-stat-content">
                                    <div class="session-stat-value" id="lastPlayed">—</div>
                                    <div class="session-stat-label" data-i18n="sessions.lastPlayed">Last Played</div>
                                </div>
                            </div>
                        </div>
                        <div class="sessions-tabs">
                            <button class="sessions-tab active" data-filter="all" data-i18n="sessions.allTime">All Time</button>
                            <button class="sessions-tab" data-filter="week" data-i18n="sessions.week">This Week</button>
                            <button class="sessions-tab" data-filter="month" data-i18n="sessions.month">This Month</button>
                            <button class="sessions-tab" data-filter="year" data-i18n="sessions.year">This Year</button>
                        </div>
                        <div class="sessions-timeline" id="sessionsTimeline"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        },

        /**
         * Bind events
         */
        bindEvents() {
            // Sessions button
            document.getElementById('sessions-btn')?.addEventListener('click', () => {
                this.openSessions();
            });

            // Tab filtering
            document.querySelectorAll('.sessions-tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    document.querySelectorAll('.sessions-tab').forEach(t => t.classList.remove('active'));
                    e.target.classList.add('active');
                    const filter = e.target.getAttribute('data-filter');
                    this.filterSessions(filter);
                });
            });

            // Modal close and backdrop click
            document.getElementById('sessions-modal')?.addEventListener('click', (e) => {
                if (e.target === document.getElementById('sessions-modal') || e.target.classList.contains('modal-close')) {
                    document.getElementById('sessions-modal').classList.add('hidden');
                }
            });
        },

        /**
         * Open sessions modal
         */
        async openSessions() {
            const modal = document.getElementById('sessions-modal');
            if (modal) {
                modal.classList.remove('hidden');
                await this.loadSessions();
            }
        },

        /**
         * Load all listening sessions
         */
        async loadSessions(filter = 'all') {
            try {
                const response = await fetch(`api/api.php?sessions=1&filter=${filter}`);
                const data = await response.json();

                if (data.success) {
                    this.currentStats = data.stats;
                    this.currentSessions = data.sessions || [];
                    this.renderStats(data.stats);
                    this.renderTimeline(this.currentSessions);
                }
            } catch (error) {
                console.error('Failed to load sessions:', error);
                if (window.ToastNotifications) {
                    window.ToastNotifications.error(tr('sessions.loadFailed', {}, 'Failed to load listening history'));
                }
            }
        },

        /**
         * Render stats cards
         */
        renderStats(stats) {
            if (!stats) return;

            // Total plays
            const totalPlaysEl = document.getElementById('totalPlays');
            if (totalPlaysEl) {
                totalPlaysEl.textContent = stats.total_plays || 0;
            }

            // Current streak
            const streakEl = document.getElementById('currentStreak');
            if (streakEl) {
                streakEl.textContent = stats.current_streak || 0;
            }

            // Most played record
            const mostPlayedEl = document.getElementById('mostPlayedRecord');
            if (mostPlayedEl) {
                mostPlayedEl.textContent = stats.most_played_record || '—';
                mostPlayedEl.style.fontSize = '0.875rem';
            }

            // Last played
            const lastPlayedEl = document.getElementById('lastPlayed');
            if (lastPlayedEl) {
                if (stats.last_played_date) {
                    lastPlayedEl.textContent = this.formatRelativeDate(stats.last_played_date);
                } else {
                    lastPlayedEl.textContent = tr('common.never', {}, 'Never');
                }
                lastPlayedEl.style.fontSize = '0.875rem';
            }
        },

        /**
         * Render timeline of sessions
         */
        renderTimeline(sessions) {
            const timeline = document.getElementById('sessionsTimeline');
            if (!timeline) return;

            if (sessions.length === 0) {
                timeline.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📻</div>
                        <h3>${escapeHtml(tr('sessions.emptyTitle', {}, 'No listening history yet'))}</h3>
                        <p>${escapeHtml(tr('sessions.emptyText', {}, 'Start tracking by clicking "Mark as Played" on any record'))}</p>
                    </div>
                `;
                return;
            }

            // Group by date
            const grouped = this.groupByDate(sessions);

            timeline.innerHTML = Object.entries(grouped).map(([date, daySessions]) => `
                <div class="timeline-date-group">
                    <div class="timeline-date-header">
                        <span class="timeline-date">${this.formatDate(date)}</span>
                        <span class="timeline-count">${escapeHtml(tr('sessions.plays', { count: daySessions.length }, `${daySessions.length} play${daySessions.length !== 1 ? 's' : ''}`))}</span>
                    </div>
                    <div class="timeline-items">
                        ${daySessions.map(session => `
                            <div class="timeline-item" data-record-id="${Number(session.record_id)}">
                                <div class="timeline-time">${this.formatTime(session.played_at)}</div>
                                <div class="timeline-record">
                                    <div class="timeline-album" dir="auto">${escapeHtml(session.album)}</div>
                                    <div class="timeline-artist" dir="auto">${escapeHtml(session.artist)}</div>
                                </div>
                                <div class="timeline-format">
                                    <span class="badge">${escapeHtml(session.format)}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');

            // Bind click events to open record detail
            timeline.querySelectorAll('.timeline-item').forEach(item => {
                item.addEventListener('click', () => {
                    const recordId = item.getAttribute('data-record-id');
                    const records = window.records || [];
                    const record = records.find(r => r.id == recordId);
                    
                    if (record && window.RecordDetail) {
                        document.getElementById('sessions-modal').classList.add('hidden');
                        window.RecordDetail.open(record);
                    }
                });
            });
        },

        /**
         * Filter sessions
         */
        filterSessions(filter) {
            this.loadSessions(filter);
        },

        /**
         * Group sessions by date
         */
        groupByDate(sessions) {
            const grouped = {};
            
            sessions.forEach(session => {
                const date = new Date(session.played_at);
                const dateKey = date.toISOString().split('T')[0];
                
                if (!grouped[dateKey]) {
                    grouped[dateKey] = [];
                }
                grouped[dateKey].push(session);
            });

            return grouped;
        },

        /**
         * Format date for timeline header
         */
        formatDate(dateString) {
            const date = new Date(dateString);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const isToday = date.toDateString() === today.toDateString();
            const isYesterday = date.toDateString() === yesterday.toDateString();

            if (isToday) return tr('common.today', {}, 'Today');
            if (isYesterday) return tr('common.yesterday', {}, 'Yesterday');

            return date.toLocaleDateString(window.I18n?.locale || 'en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        },

        /**
         * Format time
         */
        formatTime(dateTimeString) {
            const date = new Date(dateTimeString);
            return date.toLocaleTimeString(window.I18n?.locale || 'en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: window.I18n?.language !== 'he'
            });
        },

        /**
         * Format relative date
         */
        formatRelativeDate(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            const relative = new Intl.RelativeTimeFormat(window.I18n?.locale || 'en-US', { numeric: 'auto' });
            if (diffMins < 1) return relative.format(0, 'second');
            if (diffMins < 60) return relative.format(-diffMins, 'minute');
            if (diffHours < 24) return relative.format(-diffHours, 'hour');
            if (diffDays < 7) return relative.format(-diffDays, 'day');

            return date.toLocaleDateString(window.I18n?.locale || 'en-US', { month: 'short', day: 'numeric' });
        },

        /**
         * Log a play session (called from RecordDetail)
         */
        async logPlay(recordId) {
            try {
                const response = await fetch('api/api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        play: 1,
                        record_id: recordId
                    })
                });

                const data = await response.json();
                return data.success;
            } catch (error) {
                console.error('Failed to log play:', error);
                return false;
            }
        }
    };

    // Expose globally
    window.ListeningSessions = ListeningSessions;

    document.addEventListener('rc:languagechange', () => {
        ListeningSessions.renderStats(ListeningSessions.currentStats);
        ListeningSessions.renderTimeline(ListeningSessions.currentSessions);
    });

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ListeningSessions.init());
    } else {
        ListeningSessions.init();
    }

})();
