/**
 * Collection dashboard strip — at-a-glance stats above the grid.
 * Pulls from the existing stats and sessions endpoints.
 */
(function () {
    'use strict';

    const API = 'api/api.php';
    const t = (key, values = {}, fallback = key) => window.I18n
        ? window.I18n.t(key, values, fallback)
        : fallback;

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, character => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[character]));
    }

    function fmtMoney(n) {
        const v = parseFloat(n) || 0;
        return '$' + v.toLocaleString(window.I18n?.locale || 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    function card(icon, value, label, sub) {
        return `
            <div class="dash-card">
                <div class="dash-icon">${escapeHtml(icon)}</div>
                <div class="dash-body">
                    <div class="dash-value">${escapeHtml(value)}</div>
                    <div class="dash-label">${escapeHtml(label)}</div>
                    ${sub ? `<div class="dash-sub">${escapeHtml(sub)}</div>` : ''}
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
                card('📀', total, t('dashboard.records', {}, 'Records')) +
                card('💰', val ? fmtMoney(val.total_value) : '—', t('dashboard.estimatedValue', {}, 'Est. Value'), val ? t('dashboard.priced', { count: val.priced }, `${val.priced} priced`) : t('dashboard.runValuations', {}, 'run valuations')) +
                card('▶️', plays, t('dashboard.totalPlays', {}, 'Total Plays')) +
                card('🎸', topGenre, t('dashboard.topGenre', {}, 'Top Genre'));

            strip.classList.remove('hidden');
        } catch (e) {
            // Non-critical
        }
    }

    window.CollectionDashboard = { load };

    document.addEventListener('rc:languagechange', load);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', load);
    } else {
        load();
    }
})();
