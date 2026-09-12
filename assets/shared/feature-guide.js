(function () {
    'use strict';

    var trigger = document.getElementById('feature-guide-btn');
    var dialog = document.getElementById('feature-guide-modal');
    if (!trigger || !dialog) return;

    trigger.addEventListener('click', function () {
        if (dialog.open) return;
        dialog.showModal();
        document.body.classList.add('feature-guide-open');
        dialog.querySelector('.feature-guide-close').focus({ preventScroll: true });
    });

    dialog.querySelector('.feature-guide-close').addEventListener('click', function () {
        dialog.close();
    });

    dialog.addEventListener('click', function (event) {
        if (event.target !== dialog) return;
        var bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });

    dialog.addEventListener('close', function () {
        document.body.classList.remove('feature-guide-open');
        trigger.focus({ preventScroll: true });
    });
}());
