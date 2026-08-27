/**
 * Collection dashboard strip — at-a-glance stats above the grid.
 * Pulls from the existing stats and sessions endpoints.
 */
(function () {
    'use strict';

    const API = 'api/api.php';

    function fmtMoney(n) {
        const v = parseFloat(n) || 0;
        return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    function card(icon, value, label, sub) {
        return `
            <div class="dash-card">
                <div class="dash-icon">${icon}</div>
                <div class="dash-body">
                    <div class="dash-value">${value}</div>
                    <div class="dash-label">${label}</div>
                    ${sub ? `<div class="dash-sub">${sub}</div>` : ''}
                </div>
            </div>`;
    }

    async function load() {
        const strip = document.getElementById('dashboardStrip');
        if (!strip) return;

        try {
            const [stats, sessions] = await Promise.all([
                fetch(`${API}?stats=1`).then(r => r.json()).catch(() => null),
                fetch(`${API}?sessions=1&filter=all`).then(r => r.json()).catch(() => null),
            ]);
            if (!stats) return;

            const total = stats.total || 0;
            const val = stats.valuation;
            const topGenre = (stats.by_genre && stats.by_genre[0]) ? stats.by_genre[0].genre : '—';
            const plays = (sessions && sessions.stats) ? (sessions.stats.total_plays || 0) : 0;

            strip.innerHTML =
                card('📀', total, 'Records') +
                card('💰', val ? fmtMoney(val.total_value) : '—', 'Est. Value', val ? `${val.priced} priced` : 'run valuations') +
                card('▶️', plays, 'Total Plays') +
                card('🎸', topGenre, 'Top Genre');

            strip.classList.remove('hidden');
        } catch (e) {
            // Non-critical
        }
    }

    window.CollectionDashboard = { load };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', load);
    } else {
        load();
    }
})();
