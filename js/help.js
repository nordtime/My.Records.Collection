(function () {
    'use strict';

    const modal = document.getElementById('disclaimerModal');
    document.addEventListener('click', event => {
        if (event.target.closest('#helpDisclaimer')) {
            event.preventDefault();
            document.getElementById('disclaimerBody').innerHTML = window.RC_DISCLAIMER_HTML || '';
            modal.classList.remove('hidden');
        }
    });
    modal.addEventListener('click', event => {
        if (event.target === modal || event.target.classList.contains('modal-close')) {
            modal.classList.add('hidden');
        }
    });
})();
