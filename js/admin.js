/**
 * Admin panel — user management (admin only).
 */
(function () {
    'use strict';

    const AUTH = 'api/auth.php';

    function esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    function toast(msg, type) {
        if (window.ToastNotifications) {
            type === 'error' ? window.ToastNotifications.error(msg) : window.ToastNotifications.success(msg);
        }
    }

    function ensureModal() {
        let modal = document.getElementById('adminModal');
        if (modal) return modal;
        modal = document.createElement('div');
        modal.id = 'adminModal';
        modal.className = 'modal-overlay hidden';
        modal.innerHTML = `
            <div class="modal modal-wide">
                <div class="modal-header">
                    <h2>👥 User Management</h2>
                    <button class="btn-close modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body">
                    <label class="admin-toggle">
                        <input type="checkbox" id="openRegToggle">
                        <span>Allow open self-registration (new sign-ups are active immediately)</span>
                    </label>
                    <p class="form-hint">When off, new accounts stay <em>pending</em> until you approve them here.</p>
                    <div class="admin-users-wrap">
                        <table class="admin-users">
                            <thead>
                                <tr>
                                    <th>User</th><th>Role</th><th>Status</th><th>Records</th><th>Last login</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="adminUsersBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('modal-close')) modal.classList.add('hidden');
        });
        modal.querySelector('#openRegToggle').addEventListener('change', async (e) => {
            const ok = await post({ action: 'set_open_registration', value: e.target.checked ? 1 : 0 });
            if (ok) toast('Registration setting updated');
        });
        return modal;
    }

    async function post(body) {
        try {
            const res = await fetch(AUTH, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!data.success) { toast(data.message || 'Action failed', 'error'); return false; }
            return true;
        } catch (e) { toast('Network error', 'error'); return false; }
    }

    async function load() {
        const body = document.getElementById('adminUsersBody');
        body.innerHTML = '<tr><td colspan="6">Loading…</td></tr>';
        try {
            const [usersRes, meRes] = await Promise.all([
                fetch(`${AUTH}?users`, { credentials: 'same-origin' }).then(r => r.json()),
                fetch(`${AUTH}?me`, { credentials: 'same-origin' }).then(r => r.json()),
            ]);
            document.getElementById('openRegToggle').checked = !!meRes.open_registration;
            const meId = meRes.user ? meRes.user.id : 0;
            const users = usersRes.users || [];
            body.innerHTML = users.map(u => row(u, meId)).join('');
            bindRowActions();
        } catch (e) {
            body.innerHTML = '<tr><td colspan="6">Failed to load users.</td></tr>';
        }
    }

    function row(u, meId) {
        const isSelf = u.id === meId;
        const statusClass = u.status === 'active' ? 'ok' : (u.status === 'pending' ? 'warn' : 'muted');
        const verified = Number(u.email_verified) === 1;
        const actions = [];
        if (u.status === 'pending') actions.push(`<button class="btn btn-sm btn-primary" data-act="approve" data-id="${u.id}">Approve</button>`);
        if (!verified) actions.push(`<button class="btn btn-sm btn-ghost" data-act="resend_verification_for" data-id="${u.id}">Resend verify</button>`);
        if (u.status !== 'disabled' && !isSelf) actions.push(`<button class="btn btn-sm btn-ghost" data-act="disable" data-id="${u.id}">Disable</button>`);
        if (u.status === 'disabled') actions.push(`<button class="btn btn-sm btn-ghost" data-act="approve" data-id="${u.id}">Enable</button>`);
        if (!isSelf) {
            const toRole = u.role === 'admin' ? 'user' : 'admin';
            actions.push(`<button class="btn btn-sm btn-ghost" data-act="set_role" data-id="${u.id}" data-role="${toRole}">Make ${toRole}</button>`);
            actions.push(`<button class="btn btn-sm btn-danger" data-act="delete_user" data-id="${u.id}" data-name="${esc(u.username)}">Delete</button>`);
        }
        const verifyBadge = verified
            ? '<span class="admin-status ok" title="Email verified">✓ verified</span>'
            : '<span class="admin-status warn" title="Email not verified">✉ unverified</span>';
        return `
            <tr>
                <td><div class="admin-user-name">${esc(u.username)}${isSelf ? ' <span class="you-tag">you</span>' : ''}</div>
                    <div class="admin-user-email">${esc(u.email)}</div></td>
                <td>${u.role === 'admin' ? '<span class="account-role-badge">Admin</span>' : 'User'}</td>
                <td><span class="admin-status ${statusClass}">${esc(u.status)}</span><br>${verifyBadge}</td>
                <td>${u.record_count ?? 0}</td>
                <td>${u.last_login ? esc(u.last_login) : '—'}</td>
                <td class="admin-actions">${actions.join(' ') || '—'}</td>
            </tr>`;
    }

    function bindRowActions() {
        document.querySelectorAll('#adminUsersBody [data-act]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const act = btn.dataset.act;
                const id = parseInt(btn.dataset.id);
                if (act === 'delete_user') {
                    if (!confirm(`Delete user "${btn.dataset.name}" and permanently purge all of their data? This cannot be undone.`)) return;
                }
                const body = { action: act, user_id: id };
                if (act === 'set_role') body.role = btn.dataset.role;
                const ok = await post(body);
                if (ok) { toast(act === 'resend_verification_for' ? 'Verification email sent' : 'Done'); load(); }
            });
        });
    }

    window.AdminPanel = {
        open() {
            ensureModal().classList.remove('hidden');
            load();
        }
    };
})();
