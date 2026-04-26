/**
 * Notification Component - Handles toast notifications
 */

const Notification = {
    container: null,

    init: function() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            document.body.appendChild(this.container);
        }
    },

    show: function(message, type = 'info', duration = 3000) {
        this.init();

        const toast = document.createElement('div');
        toast.className = `notification-toast notification--${type}`;
        
        let icon = 'fi-rs-info';
        if (type === 'success') icon = 'fi-rs-check-circle';
        if (type === 'error') icon = 'fi-rs-cross-circle';
        if (type === 'warning') icon = 'fi-rs-exclamation';

        toast.innerHTML = `
            <div class="notification__content">
                <i class="fi ${icon} notification__icon"></i>
                <span class="notification__message">${message}</span>
            </div>
            <div class="notification__progress"></div>
        `;

        toast.querySelector('.notification__progress').style.animationDuration = `${duration}ms`;
        
        this.container.appendChild(toast);
        
        // Trigger reflow
        toast.offsetHeight;
        toast.classList.add('show');

        const removeToast = () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        };

        const timeout = setTimeout(removeToast, duration);
        
        toast.onclick = () => {
            clearTimeout(timeout);
            removeToast();
        };
    }
};


export default Notification;
