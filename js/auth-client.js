/**
 * Auth client for the main app:
 *  - gates the page behind a session (redirects to login.html when signed out)
 *  - attaches the CSRF token to state-changing API requests
 *  - builds the account menu (sign out, delete account, admin, help)
 *  - shows the cookie-consent notice
 */
(function () {
    'use strict';

    const AUTH = 'api/auth.php';
    window.RC_CSRF = null;
    window.RC_USER = null;

    // ── CSRF: patch fetch to add the token on mutating same-origin API calls ──
    const origFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
        init = init || {};
        const url = typeof input === 'string' ? input : (input && input.url) || '';
        const method = (init.method || (typeof input !== 'string' && input.method) || 'GET').toUpperCase();
        const isApi = /(^|\/)api\/(api|auth)\.php/.test(url);
        if (isApi) {
            init.credentials = init.credentials || 'same-origin';
            if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && window.RC_CSRF) {
                const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined) || {});
                if (!headers.has('X-CSRF-Token')) headers.set('X-CSRF-Token', window.RC_CSRF);
                init.headers = headers;
            }
        }
        return origFetch(input, init);
    };

    // ── Gate overlay ────────────────────────────────────────
    function showGate() {
        if (document.getElementById('authGate')) return;
        const g = document.createElement('div');
        g.id = 'authGate';
        g.className = 'auth-gate';
        g.innerHTML = '<div class="auth-gate-spinner" role="status" aria-label="Loading"></div>';
        document.body.appendChild(g);
    }
    function hideGate() {
        const g = document.getElementById('authGate');
        if (g) g.remove();
    }

    function redirectToLogin() {
        window.location.replace('login.html');
    }

    // ── Account menu ────────────────────────────────────────
    function buildAccountMenu(user) {
        const nav = document.querySelector('.header-nav');
        if (!nav || document.getElementById('account-menu')) return;

        const wrap = document.createElement('div');
        wrap.className = 'menu-wrap';
        wrap.id = 'account-menu';
        const initial = (user.username || '?').charAt(0).toUpperCase();
        wrap.innerHTML = `
            <button class="btn btn-ghost" id="accountBtn" aria-haspopup="true" aria-expanded="false" title="Account">
                <span class="account-avatar" aria-hidden="true">${initial}</span>
                <span class="account-name">${escapeHtml(user.username)}</span> &#9662;
            </button>
            <div class="menu-popover hidden" role="menu" aria-label="Account">
                <div class="account-head">
                    <div class="account-head-name">${escapeHtml(user.username)}</div>
                    <div class="account-head-email">${escapeHtml(user.email || '')}</div>
                    ${user.role === 'admin' ? '<span class="account-role-badge">Admin</span>' : ''}
                </div>
                <div class="menu-popover-sep"></div>
                ${user.role === 'admin' ? '<button class="menu-popover-item" id="menuAdmin" role="menuitem">👥 User management</button>' : ''}
                <button class="menu-popover-item" id="menuSettings" role="menuitem">⚙️ Settings</button>
                <a class="menu-popover-item" href="help.html" role="menuitem">❓ Help &amp; how-to</a>
                <button class="menu-popover-item" id="menuDisclaimer" role="menuitem">📄 Disclaimer</button>
                <div class="menu-popover-sep"></div>
                <button class="menu-popover-item" id="menuDelete" role="menuitem">🗑️ Delete my account</button>
                <button class="menu-popover-item" id="menuLogout" role="menuitem">🚪 Sign out</button>
            </div>
        `;
        nav.appendChild(wrap);

        const btn = wrap.querySelector('#accountBtn');
        const pop = wrap.querySelector('.menu-popover');
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const open = pop.classList.toggle('hidden');
            btn.setAttribute('aria-expanded', String(!open));
        });
        document.addEventListener('click', (e) => {
            if (!wrap.contains(e.target)) { pop.classList.add('hidden'); btn.setAttribute('aria-expanded', 'false'); }
        });

        wrap.querySelector('#menuLogout').addEventListener('click', logout);
        wrap.querySelector('#menuDelete').addEventListener('click', openDeleteAccount);
        wrap.querySelector('#menuSettings').addEventListener('click', () => { pop.classList.add('hidden'); openSettings(); });
        const discBtn = wrap.querySelector('#menuDisclaimer');
        if (discBtn) discBtn.addEventListener('click', openDisclaimer);
        const adminBtn = wrap.querySelector('#menuAdmin');
        if (adminBtn) adminBtn.addEventListener('click', () => {
            pop.classList.add('hidden');
            if (window.AdminPanel) window.AdminPanel.open();
        });
    }

    async function logout() {
        try {
            await fetch(AUTH, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'logout' }),
            });
        } catch (e) { /* ignore */ }
        redirectToLogin();
    }

    // ── Delete account ──────────────────────────────────────
    function openDeleteAccount() {
        let modal = document.getElementById('deleteAccountModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'deleteAccountModal';
            modal.className = 'modal-overlay hidden';
            modal.innerHTML = `
                <div class="modal modal-sm">
                    <div class="modal-header">
                        <h2>Delete my account</h2>
                        <button class="btn-close modal-close" aria-label="Close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p class="danger-text">This permanently deletes your account and <strong>all</strong> of your
                        records, wishlist, ratings, tags, and listening history. This cannot be undone.</p>
                        <p>Consider using <strong>Data &#9662; → Backup</strong> first.</p>
                        <form id="deleteAccountForm">
                            <div class="form-group">
                                <label for="deleteConfirmPw">Confirm your password</label>
                                <input type="password" id="deleteConfirmPw" class="input" autocomplete="current-password" required>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-ghost modal-close">Cancel</button>
                                <button type="submit" class="btn btn-danger">Delete forever</button>
                            </div>
                        </form>
                    </div>
                </div>`;
            document.body.appendChild(modal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.classList.contains('modal-close')) modal.classList.add('hidden');
            });
            modal.querySelector('#deleteAccountForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const password = document.getElementById('deleteConfirmPw').value;
                try {
                    const res = await fetch(AUTH, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'delete_account', password }),
                    });
                    const data = await res.json();
                    if (data.success) { redirectToLogin(); return; }
                    if (window.ToastNotifications) window.ToastNotifications.error(data.message || 'Could not delete account.');
                } catch (err) {
                    if (window.ToastNotifications) window.ToastNotifications.error('Network error.');
                }
            });
        }
        const menu = document.querySelector('#account-menu .menu-popover');
        if (menu) menu.classList.add('hidden');
        modal.classList.remove('hidden');
        document.getElementById('deleteConfirmPw').value = '';
        document.getElementById('deleteConfirmPw').focus();
    }

    // ── Settings (personal Discogs API token) ───────────────
    function openSettings() {
        let modal = document.getElementById('settingsModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'settingsModal';
            modal.className = 'modal-overlay hidden';
            modal.innerHTML = `
                <div class="modal">
                    <div class="modal-header">
                        <h2>⚙️ Settings</h2>
                        <button class="btn-close modal-close" aria-label="Close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <h3 class="settings-section-title">Discogs API token</h3>
                        <p class="settings-help">Your personal token is used to look up marketplace
                        values for your records. It is stored on your account only.
                        <a href="https://www.discogs.com/settings/developers" target="_blank" rel="noopener">
                        How to get a Discogs token →</a></p>
                        <ol class="settings-steps">
                            <li>Sign in to Discogs and open <strong>Settings → Developers</strong>.</li>
                            <li>Click <strong>Generate new token</strong> under the personal access token section.</li>
                            <li>Copy the token and paste it below.</li>
                        </ol>
                        <form id="discogsTokenForm">
                            <div class="form-group">
                                <label for="discogsTokenInput">Personal access token</label>
                                <input type="password" id="discogsTokenInput" class="input" autocomplete="off"
                                    placeholder="Paste your Discogs token">
                                <small class="form-hint" id="discogsTokenStatus"></small>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-ghost" id="discogsTokenClear">Clear token</button>
                                <button type="submit" class="btn btn-primary">Save token</button>
                            </div>
                        </form>

                        <hr class="settings-divider">
                        <h3 class="settings-section-title">Change password</h3>
                        <form id="changePasswordForm">
                            <div class="form-group">
                                <label for="cp-current">Current password</label>
                                <input type="password" id="cp-current" class="input" autocomplete="current-password" required>
                            </div>
                            <div class="form-group">
                                <label for="cp-new">New password</label>
                                <input type="password" id="cp-new" class="input" autocomplete="new-password" minlength="8" required
                                    aria-describedby="cp-hint">
                                <small id="cp-hint" class="form-hint">At least 8 characters, including a letter and a number.</small>
                            </div>
                            <div class="form-group">
                                <label for="cp-confirm">Confirm new password</label>
                                <input type="password" id="cp-confirm" class="input" autocomplete="new-password" required>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">Change password</button>
                            </div>
                        </form>

                        <hr class="settings-divider">
                        <h3 class="settings-section-title">Change email</h3>
                        <p class="settings-help" id="currentEmailLine"></p>
                        <form id="changeEmailForm">
                            <div class="form-group">
                                <label for="ce-email">New email address</label>
                                <input type="email" id="ce-email" class="input" autocomplete="email" required>
                            </div>
                            <div class="form-group">
                                <label for="ce-password">Confirm your password</label>
                                <input type="password" id="ce-password" class="input" autocomplete="current-password" required>
                            </div>
                            <p class="form-hint">We'll email a link to the new address. Your current email stays active until you confirm.</p>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">Update email</button>
                            </div>
                        </form>
                    </div>
                </div>`;
            document.body.appendChild(modal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.classList.contains('modal-close')) modal.classList.add('hidden');
            });
            modal.querySelector('#discogsTokenForm').addEventListener('submit', (e) => {
                e.preventDefault();
                saveDiscogsToken(document.getElementById('discogsTokenInput').value.trim());
            });
            modal.querySelector('#discogsTokenClear').addEventListener('click', () => saveDiscogsToken(''));

            modal.querySelector('#changePasswordForm').addEventListener('submit', changePassword);
            modal.querySelector('#changeEmailForm').addEventListener('submit', changeEmail);
        }
        updateDiscogsStatus();
        document.getElementById('discogsTokenInput').value = '';
        const emailLine = document.getElementById('currentEmailLine');
        if (emailLine && window.RC_USER) emailLine.textContent = 'Current email: ' + window.RC_USER.email;
        modal.classList.remove('hidden');
    }

    async function changePassword(e) {
        e.preventDefault();
        const current = document.getElementById('cp-current').value;
        const nw = document.getElementById('cp-new').value;
        const confirm = document.getElementById('cp-confirm').value;
        if (nw !== confirm) { if (window.ToastNotifications) window.ToastNotifications.error('New passwords do not match.'); return; }
        try {
            const res = await fetch(AUTH, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'change_password', current_password: current, new_password: nw }),
            });
            const data = await res.json();
            if (data.success) {
                document.getElementById('changePasswordForm').reset();
                if (window.ToastNotifications) window.ToastNotifications.success(data.message || 'Password changed.');
            } else if (window.ToastNotifications) {
                window.ToastNotifications.error(data.message || 'Could not change password.');
            }
        } catch (err) {
            if (window.ToastNotifications) window.ToastNotifications.error('Network error.');
        }
    }

    async function changeEmail(e) {
        e.preventDefault();
        const newEmail = document.getElementById('ce-email').value.trim();
        const password = document.getElementById('ce-password').value;
        try {
            const res = await fetch(AUTH, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'change_email', new_email: newEmail, password }),
            });
            const data = await res.json();
            if (data.success) {
                document.getElementById('changeEmailForm').reset();
                if (window.ToastNotifications) window.ToastNotifications.success(data.message || 'Check your new inbox to confirm.');
            } else if (window.ToastNotifications) {
                window.ToastNotifications.error(data.message || 'Could not update email.');
            }
        } catch (err) {
            if (window.ToastNotifications) window.ToastNotifications.error('Network error.');
        }
    }

    function updateDiscogsStatus() {
        const el = document.getElementById('discogsTokenStatus');
        if (el) {
            el.textContent = window.RC_DISCOGS_SET
                ? '✓ A token is saved. Enter a new one to replace it, or clear it.'
                : 'No token saved yet.';
        }
    }

    async function saveDiscogsToken(token) {
        try {
            const res = await fetch(AUTH, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'set_discogs_token', token }),
            });
            const data = await res.json();
            if (data.success) {
                window.RC_DISCOGS_SET = data.discogs_token_set;
                updateDiscogsStatus();
                document.getElementById('discogsTokenInput').value = '';
                if (window.ToastNotifications) window.ToastNotifications.success(data.discogs_token_set ? 'Discogs token saved' : 'Discogs token cleared');
            } else if (window.ToastNotifications) {
                window.ToastNotifications.error(data.message || 'Could not save token.');
            }
        } catch (e) {
            if (window.ToastNotifications) window.ToastNotifications.error('Network error.');
        }
    }

    function openDisclaimer() {
        let modal = document.getElementById('appDisclaimerModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'appDisclaimerModal';
            modal.className = 'modal-overlay hidden';
            modal.innerHTML = `
                <div class="modal">
                    <div class="modal-header">
                        <h2>Data &amp; Usage Disclaimer</h2>
                        <button class="btn-close modal-close" aria-label="Close">&times;</button>
                    </div>
                    <div class="modal-body">${window.RC_DISCLAIMER_HTML || ''}</div>
                </div>`;
            document.body.appendChild(modal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.classList.contains('modal-close')) modal.classList.add('hidden');
            });
        }
        const menu = document.querySelector('#account-menu .menu-popover');
        if (menu) menu.classList.add('hidden');
        modal.classList.remove('hidden');
    }

    // ── Cookie consent ──────────────────────────────────────
    function showCookieConsent() {
        if (localStorage.getItem('rc-cookie-consent') === '1') return;
        const bar = document.createElement('div');
        bar.className = 'cookie-consent';
        bar.setAttribute('role', 'region');
        bar.setAttribute('aria-label', 'Cookie notice');
        bar.innerHTML = `
            <p>${window.RC_COOKIE_NOTICE || 'This site uses an essential cookie to keep you signed in.'}</p>
            <button class="btn btn-primary btn-sm" id="cookieAccept">Got it</button>`;
        document.body.appendChild(bar);
        bar.querySelector('#cookieAccept').addEventListener('click', () => {
            localStorage.setItem('rc-cookie-consent', '1');
            bar.remove();
        });
    }

    function escapeHtml(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    async function bootstrap() {
        showGate();
        try {
            const res = await origFetch(`${AUTH}?me`, { credentials: 'same-origin' });
            const data = await res.json();
            if (!data.authenticated) { redirectToLogin(); return; }
            window.RC_CSRF = data.csrf;
            window.RC_USER = data.user;
            window.RC_DISCOGS_SET = !!data.discogs_token_set;
            hideGate();
            buildAccountMenu(data.user);
            showCookieConsent();
            window.dispatchEvent(new CustomEvent('rc-authed', { detail: data.user }));
        } catch (e) {
            // If the auth check fails hard, send to login to be safe
            redirectToLogin();
        }
    }

    // Run as early as possible
    showGate();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }
})();
