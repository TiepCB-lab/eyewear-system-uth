/**
 * DialogManager - Handles custom premium alerts and UI modals
 */

const DialogManager = {
    /**
     * Shows a premium glassmorphism alert
     * @param {string} message 
     * @returns {Promise}
     */
    alert: function(message) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'eyewear-dialog-overlay';
            
            let iconClass = 'info', iconShape = 'fi-rs-info';
            let msgStr = String(message).toLowerCase();
            
            if (msgStr.includes('success') || msgStr.includes('đã') || msgStr.includes('thành công')) {
                iconClass = 'success'; iconShape = 'fi-rs-check-circle';
            } else if (msgStr.includes('error') || msgStr.includes('lỗi') || msgStr.includes('failed')) {
                iconClass = 'error'; iconShape = 'fi-rs-cross-circle';
            } else if (msgStr.includes('wait') || msgStr.includes('attention') || msgStr.includes('chú ý')) {
                iconClass = 'info'; iconShape = 'fi-rs-exclamation';
            }

            const safeMsg = String(message).replace(/</g, "&lt;").replace(/>/g, "&gt;");
            
            overlay.innerHTML = `
                <div class="eyewear-dialog">
                    <div class="eyewear-dialog-icon ${iconClass}">
                        <i class="fi ${iconShape}"></i>
                    </div>
                    <p class="eyewear-dialog-msg">${safeMsg}</p>
                    <button class="eyewear-dialog-btn">Understood</button>
                    <div class="eyewear-progress ${iconClass}">
                        <div class="eyewear-progress-bar" id="eyewear-pb"></div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            // Reflow
            overlay.offsetHeight;
            overlay.classList.add('show');
            
            const btn = overlay.querySelector('.eyewear-dialog-btn');
            const pb = overlay.querySelector('#eyewear-pb');
            const duration = 3000;
            
            pb.style.width = '100%';
            pb.style.transitionDuration = `${duration}ms`;
            
            const close = () => {
                overlay.classList.remove('show');
                setTimeout(() => {
                    overlay.remove();
                    resolve();
                }, 500);
            };

            btn.onclick = close;
            const autoClose = setTimeout(close, duration);
            
            // Pause auto-close on hover
            overlay.querySelector('.eyewear-dialog').onmouseenter = () => {
                clearTimeout(autoClose);
                pb.style.transition = 'none';
                pb.style.width = '100%';
            };
        });
    }
};

export default DialogManager;
