(function () {
    'use strict';

    const status = document.getElementById('verifyStatus');
    const token = new URLSearchParams(location.search).get('token') || '';
    history.replaceState(null, '', location.pathname);

    if (!token) {
        status.className = 'auth-alert auth-alert-error';
        status.textContent = 'No verification token found in the link.';
        return;
    }

    fetch('api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'verify_email', token }),
    }).then(response => response.json()).then(data => {
        status.className = 'auth-alert ' + (data.success ? 'auth-alert-success' : 'auth-alert-error');
        status.textContent = data.message || (data.success ? 'Email verified.' : 'Verification failed.');
    }).catch(() => {
        status.className = 'auth-alert auth-alert-error';
        status.textContent = 'Network error. Please try again.';
    });
})();
