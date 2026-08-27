/**
 * Login / registration page logic.
 */
(function () {
    'use strict';

    const AUTH = 'api/auth.php';
    const $ = (id) => document.getElementById(id);

    const alertBox = $('authAlert');
    let requestMode = 'reset'; // 'reset' | 'resend'

    function showAlert(msg, type) {
        alertBox.textContent = msg;
        alertBox.className = 'auth-alert ' + (type === 'success' ? 'auth-alert-success' : 'auth-alert-error');
        alertBox.classList.remove('hidden');
    }
    function clearAlert() {
        alertBox.classList.add('hidden');
        alertBox.textContent = '';
    }

    async function loadCaptcha() {
        try {
            const res = await fetch(`${AUTH}?captcha=1`, { credentials: 'same-origin' });
            const data = await res.json();
            $('captchaQuestion').textContent = data.question || '?';
        } catch (e) {
            $('captchaQuestion').textContent = 'unavailable';
        }
    }

    function switchTab(which) {
        const isLogin = which === 'login';
        $('tab-login').classList.toggle('active', isLogin);
        $('tab-register').classList.toggle('active', !isLogin);
        $('tab-login').setAttribute('aria-selected', String(isLogin));
        $('tab-register').setAttribute('aria-selected', String(!isLogin));
        $('loginForm').classList.toggle('hidden', !isLogin);
        $('registerForm').classList.toggle('hidden', isLogin);
        $('resetRequestForm').classList.add('hidden');
        $('regNote').textContent = '';
        clearAlert();
        if (!isLogin) loadCaptcha();
        (isLogin ? $('login-identifier') : $('reg-username')).focus();
    }

    async function loadResetCaptcha() {
        try {
            const res = await fetch(`${AUTH}?captcha=1`, { credentials: 'same-origin' });
            const data = await res.json();
            $('resetCaptchaQuestion').textContent = data.question || '?';
        } catch (e) {
            $('resetCaptchaQuestion').textContent = 'unavailable';
        }
    }

    function showEmailRequest(mode, prefillEmail) {
        requestMode = mode;
        $('loginForm').classList.add('hidden');
        $('registerForm').classList.add('hidden');
        $('resetRequestForm').classList.remove('hidden');
        $('resetRequestForm').querySelector('.auth-submit').textContent =
            mode === 'resend' ? 'Resend verification email' : 'Send reset link';
        if (prefillEmail) $('reset-email').value = prefillEmail;
        loadResetCaptcha();
        $('reset-email').focus();
    }

    async function handleEmailRequest(e) {
        e.preventDefault();
        clearAlert();
        const email = $('reset-email').value.trim();
        const captcha = $('resetreq-captcha').value.trim();
        const action = requestMode === 'resend' ? 'resend_verification' : 'request_reset';
        const btn = e.target.querySelector('.auth-submit');
        btn.disabled = true;
        try {
            const res = await fetch(AUTH, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
                body: JSON.stringify({ action, email, captcha }),
            });
            const data = await res.json();
            if (data.success) {
                showAlert(data.message, 'success');
                $('resetRequestForm').reset();
                switchTab('login');
            } else {
                showAlert(data.message || 'Request failed.', 'error');
                loadResetCaptcha();
            }
        } catch (err) {
            showAlert('Network error. Please try again.', 'error');
        } finally {
            btn.disabled = false;
        }
    }

    async function handleLogin(e) {
        e.preventDefault();
        clearAlert();
        const identifier = $('login-identifier').value.trim();
        const password = $('login-password').value;
        const remember = $('login-remember') ? $('login-remember').checked : false;
        const btn = e.target.querySelector('.auth-submit');
        btn.disabled = true;
        try {
            const res = await fetch(AUTH, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ action: 'login', identifier, password, remember }),
            });
            const data = await res.json();
            if (data.success && data.authenticated) {
                window.location.href = 'index.html';
                return;
            }
            if (data.unverified) {
                showAlert(data.message + ' You can resend the link below.', 'error');
                const email = identifier.includes('@') ? identifier : '';
                showEmailRequest('resend', email);
                return;
            }
            showAlert(data.message || 'Sign in failed.', 'error');
        } catch (err) {
            showAlert('Network error. Please try again.', 'error');
        } finally {
            btn.disabled = false;
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        clearAlert();
        const username = $('reg-username').value.trim();
        const email = $('reg-email').value.trim();
        const password = $('reg-password').value;
        const confirm = $('reg-confirm').value;
        const captcha = $('reg-captcha').value.trim();

        if (password !== confirm) {
            showAlert('Passwords do not match.', 'error');
            return;
        }
        const btn = e.target.querySelector('.auth-submit');
        btn.disabled = true;
        try {
            const res = await fetch(AUTH, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ action: 'register', username, email, password, captcha }),
            });
            const data = await res.json();
            if (data.success && data.authenticated) {
                window.location.href = 'index.html';
                return;
            }
            if (data.success) {
                // Account created but must verify email (or await approval)
                $('registerForm').reset();
                switchTab('login');
                showAlert(data.message || 'Account created. Check your email to verify your account.', 'success');
                return;
            }
            showAlert(data.message || 'Could not create account.', 'error');
            loadCaptcha();
            $('reg-captcha').value = '';
        } catch (err) {
            showAlert('Network error. Please try again.', 'error');
        } finally {
            btn.disabled = false;
        }
    }

    function openDisclaimer(e) {
        if (e) e.preventDefault();
        $('disclaimerBody').innerHTML = window.RC_DISCLAIMER_HTML || '<p>Disclaimer unavailable.</p>';
        $('disclaimerModal').classList.remove('hidden');
    }

    async function init() {
        // If already signed in, go to the app
        try {
            const res = await fetch(`${AUTH}?me`, { credentials: 'same-origin' });
            const data = await res.json();
            if (data.authenticated) { window.location.href = 'index.html'; return; }
            if (!data.has_admin) {
                // No admin yet — nudge the first user to create the admin account
                switchTab('register');
                $('regNote').textContent = 'No account exists yet — the first account you create becomes the administrator.';
            }
        } catch (e) { /* offline — allow form use */ }

        $('tab-login').addEventListener('click', () => switchTab('login'));
        $('tab-register').addEventListener('click', () => switchTab('register'));
        $('loginForm').addEventListener('submit', handleLogin);
        $('registerForm').addEventListener('submit', handleRegister);
        $('captchaRefresh').addEventListener('click', loadCaptcha);

        $('forgotLink').addEventListener('click', (e) => { e.preventDefault(); showEmailRequest('reset'); });
        $('resendVerifyLink').addEventListener('click', (e) => { e.preventDefault(); showEmailRequest('resend'); });
        $('backToLogin').addEventListener('click', (e) => { e.preventDefault(); switchTab('login'); });
        $('resetRequestForm').addEventListener('submit', handleEmailRequest);
        $('resetCaptchaRefresh').addEventListener('click', loadResetCaptcha);

        [$('disclaimerLink'), $('disclaimerLink2')].forEach(el => el && el.addEventListener('click', openDisclaimer));
        $('disclaimerModal').addEventListener('click', (e) => {
            if (e.target.id === 'disclaimerModal' || e.target.classList.contains('modal-close')) {
                $('disclaimerModal').classList.add('hidden');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
