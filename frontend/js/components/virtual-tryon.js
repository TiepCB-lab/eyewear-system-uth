/**
 * Virtual Try-On Component Logic
 */

function setTryOnState(isOpen) {
    const modal = document.getElementById('virtual-tryon-modal');
    if (!modal) return;

    if (isOpen) {
        modal.style.display = 'flex';
        modal.classList.add('is-open');
    } else {
        modal.style.display = 'none';
        modal.classList.remove('is-open');
    }
}

function openTryOn() {
    setTryOnState(true);

    window.setTimeout(() => {
        const placeholder = document.getElementById('camera-placeholder');
        if (!placeholder) return;

        placeholder.innerHTML = `
            <p class="ar-active-msg">AR Virtual Try-On Active</p>
            <small>Simulation Mode</small>
        `;
    }, 1500);
}

function closeTryOn() {
    setTryOnState(false);
}

function snapshot() {
    if (window.Notification) window.Notification.show('Snapshot saved to your gallery!', 'success');
    else alert('Snapshot saved!');
}

// Global exposure for inline onclick (though we should avoid them, keeping for now to match HTML)
window.openTryOn = openTryOn;
window.closeTryOn = closeTryOn;
window.snapshot = snapshot;

document.addEventListener('click', (event) => {
    const tryOnTrigger = event.target.closest('.btn-tryon');
    if (tryOnTrigger) {
        event.preventDefault();
        openTryOn();
        return;
    }

    const closeTrigger = event.target.closest('[data-action="close-tryon"]');
    if (closeTrigger) {
        event.preventDefault();
        closeTryOn();
    }
});
