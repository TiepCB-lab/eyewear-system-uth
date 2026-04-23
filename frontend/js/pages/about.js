document.addEventListener('DOMContentLoaded', () => {
    if (window.AOS) {
        window.AOS.init({
            duration: 1000,
            once: true,
            offset: 100
        });
    }
});
