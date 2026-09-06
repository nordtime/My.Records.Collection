/**
 * Admin panel — user management (admin only).
 */
(function () {
    'use strict';

    const AUTH = 'api/auth.php';
    let users = [];
    let currentUserId = 0;

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
            <div class="modal modal-wide admin-modal">
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
                    <div class="admin-summary" id="adminSummary" aria-label="User summary"></div>
                    <div class="admin-toolbar">
                        <input class="input" id="adminUserSearch" type="search" placeholder="Search users" aria-label="Search users">
                        <select class="input select" id="adminUserFilter" aria-label="Filter users">
                            <option value="all">All users</option>
                            <option value="pending">Pending approval</option>
                            <option value="unverified">Unverified email</option>
                            <option value="active">Active</option>
                            <option value="disabled">Disabled</option>
                            <option value="admin">Administrators</option>
                        </select>
                        <button class="btn btn-ghost" id="adminRefresh" type="button" title="Refresh users" aria-label="Refresh users">&#8635;</button>
                    </div>
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
            const enabled = e.target.checked;
            e.target.disabled = true;
            const result = await post({ action: 'set_open_registration', value: enabled ? 1 : 0 });
            e.target.disabled = false;
            if (result.success) toast('Registration setting updated');
            else e.target.checked = !enabled;
        });
        modal.querySelector('#adminUserSearch').addEventListener('input', renderUsers);
        modal.querySelector('#adminUserFilter').addEventListener('change', renderUsers);
        modal.querySelector('#adminRefresh').addEventListener('click', load);
        return modal;
    }

    async function post(body) {
        try {
            const res = await fetch(AUTH, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                toast(data.message || data.error || 'Action failed', 'error');
                return { success: false };
            }
            return data;
        } catch (e) {
            toast('Network error', 'error');
            return { success: false };
        }
    }

    async function load() {
        const body = document.getElementById('adminUsersBody');
        body.innerHTML = '<tr><td colspan="6">Loading…</td></tr>';
        try {
            const [usersRes, meRes] = await Promise.all([
                fetch(`${AUTH}?users`, { credentials: 'same-origin' }).then(r => r.json()),
                fetch(`${AUTH}?me`, { credentials: 'same-origin' }).then(r => r.json()),
            ]);
            if (!usersRes.success || !meRes.success) throw new Error('Could not load users');
            document.getElementById('openRegToggle').checked = !!meRes.open_registration;
            currentUserId = meRes.user ? Number(meRes.user.id) : 0;
            users = usersRes.users || [];
            renderSummary();
            renderUsers();
        } catch (e) {
            body.innerHTML = '<tr><td colspan="6">Failed to load users.</td></tr>';
        }
    }

    function renderSummary() {
        const count = predicate => users.filter(predicate).length;
        const items = [
            ['Total', users.length],
            ['Pending', count(u => u.status === 'pending')],
            ['Unverified', count(u => Number(u.email_verified) !== 1)],
            ['Disabled', count(u => u.status === 'disabled')],
        ];
        document.getElementById('adminSummary').innerHTML = items.map(([label, value]) =>
            `<div class="admin-summary-item"><strong>${value}</strong><span>${label}</span></div>`
        ).join('');
    }

    function renderUsers() {
        const body = document.getElementById('adminUsersBody');
        const query = document.getElementById('adminUserSearch').value.trim().toLowerCase();
        const filter = document.getElementById('adminUserFilter').value;
        const visible = users.filter(u => {
            const matchesQuery = !query || `${u.username} ${u.email}`.toLowerCase().includes(query);
            const matchesFilter = filter === 'all'
                || (filter === 'unverified' && Number(u.email_verified) !== 1)
                || (filter === 'admin' && u.role === 'admin')
                || u.status === filter;
            return matchesQuery && matchesFilter;
        });
        body.innerHTML = visible.length
            ? visible.map(u => row(u, currentUserId)).join('')
            : '<tr><td colspan="6" class="admin-empty">No users match this view.</td></tr>';
        bindRowActions();
    }

    function formatDate(value) {
        if (!value) return 'Never';
        const date = new Date(String(value).replace(' ', 'T'));
        return Number.isNaN(date.getTime()) ? esc(value) : date.toLocaleString();
    }

    function row(u, meId) {
        const isSelf = Number(u.id) === Number(meId);
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
                <td><span title="Joined ${formatDate(u.created_at)}">${formatDate(u.last_login)}</span></td>
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
                if (act === 'set_role' && !confirm(`Change this user's role to ${btn.dataset.role}?`)) return;
                const body = { action: act, user_id: id };
                if (act === 'set_role') body.role = btn.dataset.role;
                btn.disabled = true;
                const originalText = btn.textContent;
                btn.textContent = 'Working…';
                const result = await post(body);
                if (result.success) {
                    toast(result.message || (act === 'resend_verification_for' ? 'Verification email sent' : 'User updated'));
                    await load();
                } else {
                    btn.disabled = false;
                    btn.textContent = originalText;
                }
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
