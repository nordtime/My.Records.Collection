(function () {
    'use strict';

    const link = document.getElementById('helpDisclaimer');
    const modal = document.getElementById('disclaimerModal');
    if (link) {
        link.addEventListener('click', event => {
            event.preventDefault();
            document.getElementById('disclaimerBody').innerHTML = window.RC_DISCLAIMER_HTML || '';
            modal.classList.remove('hidden');
        });
    }
    modal.addEventListener('click', event => {
        if (event.target === modal || event.target.classList.contains('modal-close')) {
            modal.classList.add('hidden');
        }
    });
})();
