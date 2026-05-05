/**
 * Premium Notification System for EVELENS
 * Self-contained module that provides success, error, info, and confirm dialogs.
 */

const EvelensNotify = {
    async _createOverlay() {
        let overlay = document.getElementById('evelens-notify-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'evelens-notify-overlay';
            overlay.className = 'evelens-notify-overlay';
            
            // Minimal structure fallback if template fails to load
            overlay.innerHTML = `
                <div class="evelens-notify-card">
                    <button class="evelens-notify-close">&times;</button>
                    <div class="evelens-notify-image">
                        <img id="evelens-notify-img" src="/assets/images/ui/notification-brand.png" alt="Notification">
                    </div>
                    <div class="evelens-notify-content">
                        <div class="evelens-notify-brand">EVELENS SYSTEM</div>
                        <div class="evelens-notify-icon-box"></div>
                        <h3 class="evelens-notify-title" id="evelens-notify-title"></h3>
                        <p class="evelens-notify-desc" id="evelens-notify-desc"></p>
                        <div class="evelens-notify-actions"></div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            const closeBtn = overlay.querySelector('.evelens-notify-close');
            if (closeBtn) closeBtn.onclick = () => this.hide();
            overlay.onclick = (e) => { if (e.target === overlay) this.hide(); };
        }
        return overlay;
    },

    async show({ type = 'success', title = '', desc = '', btnText = 'Close', onConfirm = null, secondaryBtn = null, image = null }) {
        const overlay = await this._createOverlay();
        const iconBox = overlay.querySelector('.evelens-notify-icon-box');
        const titleEl = overlay.querySelector('#evelens-notify-title');
        const descEl = overlay.querySelector('#evelens-notify-desc');
        const actionsEl = overlay.querySelector('.evelens-notify-actions');
        const imgEl = overlay.querySelector('#evelens-notify-img');

        // Set type class
        overlay.className = `evelens-notify-overlay notify-${type}`;
        
        // Handle Icon
        if (iconBox) {
            const icons = {
                success: '<i class="fi fi-rs-check"></i>',
                error: '<i class="fi fi-rs-cross-circle"></i>',
                warning: '<i class="fi fi-rs-exclamation"></i>',
                info: '<i class="fi fi-rs-info"></i>',
                loading: '<i class="fi fi-rs-spinner"></i>'
            };
            iconBox.innerHTML = icons[type] || icons.info;
        }

        // Set content
        if (titleEl) titleEl.textContent = title;
        if (descEl) descEl.textContent = desc;
        if (imgEl && image) imgEl.src = image;

        // Set actions
        if (actionsEl) {
            actionsEl.innerHTML = '';
            if (type !== 'loading') {
                if (secondaryBtn) {
                    const sBtn = document.createElement('button');
                    sBtn.className = 'evelens-notify-btn secondary';
                    sBtn.textContent = secondaryBtn.text;
                    sBtn.onclick = () => { this.hide(); secondaryBtn.action?.(); };
                    actionsEl.appendChild(sBtn);
                }

                const pBtn = document.createElement('button');
                pBtn.className = 'evelens-notify-btn primary';
                pBtn.textContent = btnText;
                pBtn.onclick = () => {
                    this.hide();
                    if (onConfirm) onConfirm();
                };
                actionsEl.appendChild(pBtn);
            }
        }

        // Show with a tiny delay for transition
        setTimeout(() => overlay.classList.add('show'), 10);

        return {
            update: (newOpts) => this.show({ ...{ type, title, desc, btnText, onConfirm, secondaryBtn, image }, ...newOpts }),
            hide: () => this.hide()
        };
    },

    async loading(desc = 'Processing...') {
        return await this.show({ type: 'loading', title: '', desc });
    },

    async success(title, desc, btnText = 'Close') {
        return await this.show({ type: 'success', title, desc, btnText });
    },

    async error(title, desc, btnText = 'Try Again') {
        return await this.show({ type: 'error', title, desc, btnText });
    },

    async info(title, desc, btnText = 'Got it') {
        return await this.show({ type: 'info', title, desc, btnText });
    },

    async confirm(title, desc, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel') {
        return await this.show({ 
            type: 'warning', 
            title, 
            desc, 
            btnText: confirmText, 
            onConfirm,
            secondaryBtn: { text: cancelText }
        });
    },

    hide() {
        const overlay = document.getElementById('evelens-notify-overlay');
        if (overlay) overlay.classList.remove('show');
    }
};

// Legacy Wrapper to support old code
const Notification = {
    init: function() {
        window.EvelensNotify = EvelensNotify;
    },
    show: function(message, type = 'info') {
        const title = type.charAt(0).toUpperCase() + type.slice(1);
        if (type === 'success') EvelensNotify.success(title, message);
        else if (type === 'error') EvelensNotify.error(title, message);
        else EvelensNotify.info(title, message);
    }
};

export default Notification;
