function setTryOnState(isOpen) {
    const modal = document.getElementById('virtual-tryon-modal');
    if (!modal) {
        return;
    }

    modal.classList.toggle('is-open', isOpen);
}

function openTryOn() {
    setTryOnState(true);

    window.setTimeout(() => {
        const placeholder = document.getElementById('camera-placeholder');
        if (!placeholder) {
            return;
        }

        placeholder.innerHTML = `
            <p class="tryon-status-active">AR Virtual Try-On Active</p>
            <small>Simulation Mode</small>
        `;
    }, 1500);
}

function closeTryOn() {
    setTryOnState(false);
}

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
