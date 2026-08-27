/**
 * Advanced Analytics Dashboard - Priority 2.2
 * Collection insights, charts, trends, and statistics
 */

(function() {
    'use strict';

    const Analytics = {
        charts: {},
        
        /**
         * Initialize analytics dashboard
         */
        init() {
            this.enhanceStatsModal();
            this.bindEvents();
        },

        /**
         * Enhance the existing stats modal with charts
         */
        enhanceStatsModal() {
            const statsModal = document.getElementById('stats-modal');
            if (!statsModal) return;

            // Add chart containers after existing stats
            const statsGrid = statsModal.querySelector('.stats-grid');
            if (!statsGrid) return;

            const chartsSection = document.createElement('div');
            chartsSection.className = 'analytics-section';
            chartsSection.innerHTML = `
                <h3 class="analytics-title">📊 Collection Analytics</h3>
                
                <!-- Charts grid -->
                <div class="analytics-charts-grid">
                    <!-- Format distribution -->
                    <div class="chart-card">
                        <h4 class="chart-title">Format Distribution</h4>
                        <canvas id="formatChart"></canvas>
                    </div>

                    <!-- Genre distribution -->
                    <div class="chart-card">
                        <h4 class="chart-title">Top 10 Genres</h4>
                        <canvas id="genreChart"></canvas>
                    </div>

                    <!-- Acquisition timeline -->
                    <div class="chart-card chart-card-wide">
                        <h4 class="chart-title">Acquisition Timeline</h4>
                        <canvas id="timelineChart"></canvas>
                    </div>

                    <!-- Top artists -->
                    <div class="chart-card chart-card-wide">
                        <h4 class="chart-title">Top 15 Artists</h4>
                        <canvas id="artistChart"></canvas>
                    </div>
                </div>

                <!-- Additional stats -->
                <div class="analytics-stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">💰</div>
                        <div class="stat-content">
                            <div class="stat-value" id="totalValue">$0.00</div>
                            <div class="stat-label">Total Discogs Value</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">💎</div>
                        <div class="stat-content">
                            <div class="stat-value" id="mostValuable">—</div>
                            <div class="stat-label">Most Valuable</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">📅</div>
                        <div class="stat-content">
                            <div class="stat-value" id="avgPerMonth">0</div>
                            <div class="stat-label">Avg per Month</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">⭐</div>
                        <div class="stat-content">
                            <div class="stat-value" id="avgRating">—</div>
                            <div class="stat-label">Avg Rating</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">🎵</div>
                        <div class="stat-content">
                            <div class="stat-value" id="mostPlayed">—</div>
                            <div class="stat-label">Most Played</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">🆕</div>
                        <div class="stat-content">
                            <div class="stat-value" id="recentAddition">—</div>
                            <div class="stat-label">Latest Addition</div>
                        </div>
                    </div>
                </div>

                <!-- Most valuable records table -->
                <div class="analytics-table-section">
                    <h4 class="analytics-subtitle">💎 Top 10 Most Valuable Records</h4>
                    <div class="valuable-records-table" id="valuableRecordsTable"></div>
                </div>
            `;

            statsGrid.parentElement.appendChild(chartsSection);
        },

        /**
         * Bind events
         */
        bindEvents() {
            // When stats modal opens, generate analytics
            const statsBtn = document.getElementById('stats-btn');
            if (statsBtn) {
                statsBtn.addEventListener('click', () => {
                    setTimeout(() => this.generateAnalytics(), 100);
                });
            }
        },

        /**
         * Generate all analytics
         */
        async generateAnalytics() {
            const records = window.records || [];
            if (records.length === 0) return;

            this.generateFormatChart(records);
            this.generateGenreChart(records);
            this.generateTimelineChart(records);
            this.generateArtistChart(records);
            this.generateAdditionalStats(records);
            this.generateValuableRecordsTable(records);
        },

        /**
         * Format distribution donut chart
         */
        generateFormatChart(records) {
            const formatCounts = {};
            records.forEach(r => {
                const format = r.format || 'Unknown';
                formatCounts[format] = (formatCounts[format] || 0) + 1;
            });

            const ctx = document.getElementById('formatChart');
            if (!ctx) return;

            // Destroy existing chart
            if (this.charts.format) {
                this.charts.format.destroy();
            }

            this.charts.format = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(formatCounts),
                    datasets: [{
                        data: Object.values(formatCounts),
                        backgroundColor: [
                            '#e3b341', // Vinyl gold
                            '#58a6ff', // CD blue
                            '#d29922', // Cassette orange
                            '#3fb950'  // Digital green
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#e6edf3', font: { size: 12 } }
                        }
                    }
                }
            });
        },

        /**
         * Genre distribution bar chart
         */
        generateGenreChart(records) {
            const genreCounts = {};
            records.forEach(r => {
                const genre = r.genre || 'Unknown';
                genreCounts[genre] = (genreCounts[genre] || 0) + 1;
            });

            // Top 10 genres
            const sorted = Object.entries(genreCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);

            const ctx = document.getElementById('genreChart');
            if (!ctx) return;

            if (this.charts.genre) {
                this.charts.genre.destroy();
            }

            this.charts.genre = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: sorted.map(([genre]) => genre),
                    datasets: [{
                        label: 'Records',
                        data: sorted.map(([, count]) => count),
                        backgroundColor: '#58a6ff',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    indexAxis: 'y',
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            ticks: { color: '#8b949e' },
                            grid: { color: '#30363d' }
                        },
                        y: {
                            ticks: { color: '#8b949e' },
                            grid: { display: false }
                        }
                    }
                }
            });
        },

        /**
         * Acquisition timeline chart
         */
        generateTimelineChart(records) {
            // Group by month
            const monthCounts = {};
            records.forEach(r => {
                if (!r.created_at) return;
                const date = new Date(r.created_at);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
            });

            // Sort by date
            const sorted = Object.entries(monthCounts).sort();
            
            // Last 12 months
            const last12 = sorted.slice(-12);

            const ctx = document.getElementById('timelineChart');
            if (!ctx) return;

            if (this.charts.timeline) {
                this.charts.timeline.destroy();
            }

            this.charts.timeline = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: last12.map(([month]) => {
                        const [year, m] = month.split('-');
                        const date = new Date(year, parseInt(m) - 1);
                        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                    }),
                    datasets: [{
                        label: 'Records Added',
                        data: last12.map(([, count]) => count),
                        borderColor: '#58a6ff',
                        backgroundColor: 'rgba(88, 166, 255, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            ticks: { color: '#8b949e' },
                            grid: { color: '#30363d' }
                        },
                        y: {
                            ticks: { color: '#8b949e', precision: 0 },
                            grid: { color: '#30363d' }
                        }
                    }
                }
            });
        },

        /**
         * Top artists bar chart
         */
        generateArtistChart(records) {
            const artistCounts = {};
            records.forEach(r => {
                const artist = r.artist || 'Unknown';
                artistCounts[artist] = (artistCounts[artist] || 0) + 1;
            });

            // Top 15 artists
            const sorted = Object.entries(artistCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 15);

            const ctx = document.getElementById('artistChart');
            if (!ctx) return;

            if (this.charts.artist) {
                this.charts.artist.destroy();
            }

            this.charts.artist = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: sorted.map(([artist]) => artist),
                    datasets: [{
                        label: 'Records',
                        data: sorted.map(([, count]) => count),
                        backgroundColor: '#e3b341',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            ticks: { 
                                color: '#8b949e',
                                maxRotation: 45,
                                minRotation: 45
                            },
                            grid: { display: false }
                        },
                        y: {
                            ticks: { color: '#8b949e', precision: 0 },
                            grid: { color: '#30363d' }
                        }
                    }
                }
            });
        },

        /**
         * Generate additional stats
         */
        generateAdditionalStats(records) {
            // Total Discogs value
            const totalValue = records.reduce((sum, r) => {
                return sum + (parseFloat(r.discogs_value) || 0);
            }, 0);
            const totalValueEl = document.getElementById('totalValue');
            if (totalValueEl) {
                totalValueEl.textContent = `$${totalValue.toFixed(2)}`;
            }

            // Most valuable
            const mostValuable = records
                .filter(r => r.discogs_value > 0)
                .sort((a, b) => parseFloat(b.discogs_value) - parseFloat(a.discogs_value))[0];
            const mostValuableEl = document.getElementById('mostValuable');
            if (mostValuableEl) {
                mostValuableEl.textContent = mostValuable 
                    ? `${mostValuable.album} - $${parseFloat(mostValuable.discogs_value).toFixed(2)}`
                    : 'No valued records';
                mostValuableEl.style.fontSize = '0.8rem';
            }

            // Avg per month
            const dates = records.map(r => new Date(r.created_at)).filter(d => !isNaN(d));
            if (dates.length > 1) {
                const oldest = new Date(Math.min(...dates));
                const newest = new Date(Math.max(...dates));
                const months = (newest - oldest) / (1000 * 60 * 60 * 24 * 30) || 1;
                const avgPerMonth = Math.round(records.length / months);
                const avgPerMonthEl = document.getElementById('avgPerMonth');
                if (avgPerMonthEl) {
                    avgPerMonthEl.textContent = avgPerMonth;
                }
            }

            // Avg rating
            const rated = records.filter(r => r.rating > 0);
            if (rated.length > 0) {
                const avgRating = rated.reduce((sum, r) => sum + (r.rating || 0), 0) / rated.length;
                const avgRatingEl = document.getElementById('avgRating');
                if (avgRatingEl) {
                    avgRatingEl.textContent = `${avgRating.toFixed(1)} ★`;
                }
            }

            // Most played
            const mostPlayed = records
                .filter(r => r.play_count > 0)
                .sort((a, b) => b.play_count - a.play_count)[0];
            const mostPlayedEl = document.getElementById('mostPlayed');
            if (mostPlayedEl) {
                mostPlayedEl.textContent = mostPlayed 
                    ? `${mostPlayed.album} (${mostPlayed.play_count}x)`
                    : 'No plays yet';
                mostPlayedEl.style.fontSize = '0.8rem';
            }

            // Recent addition
            const recent = records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
            const recentEl = document.getElementById('recentAddition');
            if (recentEl) {
                recentEl.textContent = recent ? recent.album : '—';
                recentEl.style.fontSize = '0.8rem';
            }
        },

        /**
         * Generate valuable records table
         */
        generateValuableRecordsTable(records) {
            const valuable = records
                .filter(r => r.discogs_value > 0)
                .sort((a, b) => parseFloat(b.discogs_value) - parseFloat(a.discogs_value))
                .slice(0, 10);

            const tableEl = document.getElementById('valuableRecordsTable');
            if (!tableEl) return;

            if (valuable.length === 0) {
                tableEl.innerHTML = `
                    <p style="color: var(--text-muted); text-align: center; padding: 2rem;">
                        No valued records found
                    </p>
                `;
                return;
            }

            tableEl.innerHTML = `
                <table class="valuable-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Album</th>
                            <th>Artist</th>
                            <th>Format</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${valuable.map((r, idx) => `
                            <tr class="valuable-row" data-record-id="${r.id}">
                                <td class="rank-cell">${idx + 1}</td>
                                <td class="album-cell">${r.album}</td>
                                <td class="artist-cell">${r.artist}</td>
                                <td class="format-cell">
                                    <span class="badge">${r.format}</span>
                                </td>
                                <td class="value-cell">$${parseFloat(r.discogs_value).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            // Bind click events
            tableEl.querySelectorAll('.valuable-row').forEach(row => {
                row.addEventListener('click', () => {
                    const recordId = row.getAttribute('data-record-id');
                    const record = records.find(r => r.id == recordId);
                    if (record && window.RecordDetail) {
                        // Close stats modal first
                        const statsModal = document.getElementById('stats-modal');
                        if (statsModal) {
                            statsModal.classList.remove('active');
                        }
                        window.RecordDetail.open(record);
                    }
                });
            });
        },

        /**
         * Destroy all charts
         */
        destroy() {
            Object.values(this.charts).forEach(chart => {
                if (chart) chart.destroy();
            });
            this.charts = {};
        }
    };

    // Expose globally
    window.Analytics = Analytics;

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Analytics.init());
    } else {
        Analytics.init();
    }

})();
