/**
 * Backup & Restore — export/import the whole collection as JSON.
 */
(function () {
    'use strict';

    const API = 'api/api.php';

    function toast(msg, type) {
        if (window.ToastNotifications) {
            if (type === 'error') window.ToastNotifications.error(msg);
            else window.ToastNotifications.success(msg);
        }
    }

    async function backup() {
        try {
            const res = await fetch(`${API}?backup=1`);
            const data = await res.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `records-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast('Backup downloaded');
        } catch (e) {
            toast('Backup failed', 'error');
        }
    }

    async function restore(file) {
        let json;
        try {
            json = JSON.parse(await file.text());
        } catch (e) {
            toast('Invalid JSON file', 'error');
            return;
        }
        if (!json || !Array.isArray(json.records)) {
            toast('Not a valid backup file', 'error');
            return;
        }
        if (!confirm(`Restore ${json.records.length} records from this backup? Existing duplicates will be skipped.`)) {
            return;
        }
        try {
            const res = await fetch(`${API}?restore=1`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(json),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Restore failed');
            toast(`Imported ${data.records_imported} records (${data.records_skipped} skipped)`);
            if (window.triggerRecordReload) window.triggerRecordReload();
            if (window.CollectionDashboard) window.CollectionDashboard.load();
        } catch (e) {
            toast('Restore failed', 'error');
        }
    }

    function init() {
        const btnBackup = document.getElementById('btnBackup');
        const btnRestore = document.getElementById('btnRestore');

        let input = document.getElementById('restoreFileInput');
        if (!input) {
            input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json,.json';
            input.id = 'restoreFileInput';
            input.style.display = 'none';
            document.body.appendChild(input);
        }
        input.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) restore(e.target.files[0]);
            e.target.value = '';
        });

        if (btnBackup) btnBackup.addEventListener('click', backup);
        if (btnRestore) btnRestore.addEventListener('click', () => input.click());
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
