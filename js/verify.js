(function () {
    'use strict';

    const status = document.getElementById('verifyStatus');
    const t = (key, fallback) => window.I18n ? window.I18n.t(key, {}, fallback) : fallback;
    const token = new URLSearchParams(location.search).get('token') || '';
    history.replaceState(null, '', location.pathname);

    if (!token) {
        status.className = 'auth-alert auth-alert-error';
        status.textContent = t('verify.missingToken', 'No verification token found in the link.');
        return;
    }

    fetch('api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'verify_email', token }),
    }).then(response => response.json()).then(data => {
        status.className = 'auth-alert ' + (data.success ? 'auth-alert-success' : 'auth-alert-error');
        status.textContent = data.message || (data.success
            ? t('verify.success', 'Email verified.')
            : t('verify.failed', 'Verification failed.'));
    }).catch(() => {
        status.className = 'auth-alert auth-alert-error';
        status.textContent = t('auth.networkError', 'Network error. Please try again.');
    });
})();
