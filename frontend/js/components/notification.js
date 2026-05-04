/**
 * Notification Component - Legacy Wrapper for EvelensNotify
 * Ensures old code calling window.Notification still works with the new Premium UI.
 */

const Notification = {
    init: function() {
        // EvelensNotify initializes itself on first call
    },

    /**
     * Legacy show method
     * @param {string} message 
     * @param {string} type 'success', 'error', 'warning', 'info'
     */
    show: function(message, type = 'info') {
        if (window.EvelensNotify) {
            const title = type.charAt(0).toUpperCase() + type.slice(1);
            if (type === 'success') window.EvelensNotify.success(title, message);
            else if (type === 'error') window.EvelensNotify.error(title, message);
            else if (type === 'warning') window.EvelensNotify.confirm(title, message, () => {});
            else window.EvelensNotify.info(title, message);
        } else {
            // Fallback to basic alert if EvelensNotify is not loaded
            alert(message);
        }
    }
};

export default Notification;
