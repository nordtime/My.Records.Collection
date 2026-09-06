(function () {
    'use strict';

    const alertBox = document.getElementById('resetAlert');
    const form = document.getElementById('resetForm');
    const token = new URLSearchParams(location.search).get('token') || '';
    history.replaceState(null, '', location.pathname);

    function showAlert(message, success) {
        alertBox.textContent = message;
        alertBox.className = 'auth-alert ' + (success ? 'auth-alert-success' : 'auth-alert-error');
        alertBox.classList.remove('hidden');
    }

    if (!token) {
        showAlert('This reset link is missing its token.', false);
        form.querySelector('.auth-submit').disabled = true;
    }

    form.addEventListener('submit', event => {
        event.preventDefault();
        const password = document.getElementById('reset-password').value;
        const confirmation = document.getElementById('reset-confirm').value;
        if (password !== confirmation) {
            showAlert('Passwords do not match.', false);
            return;
        }

        const button = form.querySelector('.auth-submit');
        button.disabled = true;
        fetch('api/auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ action: 'reset_password', token, password }),
        }).then(response => response.json()).then(data => {
            if (data.success) {
                showAlert(data.message + ' Redirecting to sign in...', true);
                setTimeout(() => { location.href = 'login.html'; }, 1800);
            } else {
                showAlert(data.message || 'Could not reset password.', false);
                button.disabled = false;
            }
        }).catch(() => {
            showAlert('Network error. Please try again.', false);
            button.disabled = false;
        });
    });
})();
