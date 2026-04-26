import api from '../services/api.js';

(async function() {
    if (api.auth.isAuthenticated()) {
        window.location.href = api.auth.isStaff() ? '/pages/dashboard/index.html' : '/index.html';
        return;
    }

    const container = document.getElementById('auth-container');
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
        try {
            const result = await api.auth.verifyEmail(token);
            alert('Email verified successfully! You can now log in.');
            if (result.email) {
                const emailInput = document.getElementById('email-signin');
                if (emailInput) emailInput.value = decodeURIComponent(result.email);
            }
        } catch (error) {
            alert('Verification failed: ' + error.message);
        }
    }

    // Toggle forms
    document.getElementById('signUp')?.addEventListener('click', () => container.classList.add("active"));
    document.getElementById('signIn')?.addEventListener('click', () => container.classList.remove("active"));
    document.getElementById('toSignUpMobile')?.addEventListener('click', () => container.classList.add("active"));
    document.getElementById('toSignInMobile')?.addEventListener('click', () => container.classList.remove("active"));

    // Forgot Password
    document.getElementById('forgot-password-link')?.addEventListener('click', async (e) => {
        e.preventDefault();
        const emailInput = document.querySelector('.sign-in-container input[name="email"]');
        const email = prompt('Enter email for password reset:', emailInput?.value || '');
        if (!email) return;

        try {
            const response = await api.auth.forgotPassword(email.trim());
            alert(response.message || 'Reset link sent if email exists.');
        } catch (error) {
            alert('Request failed: ' + (error.response?.data?.message || error.message));
        }
    });

    // Premium Dialog Utility
    const showEyewearDialog = (options = {}) => {
        const { title, type = 'info', message, buttonText = 'Close', showLoading = false } = options;
        
        // Remove existing dialog if any
        const existing = document.querySelector('.eyewear-dialog-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'eyewear-dialog-overlay modal-overlay';
        
        let iconHtml = '';
        if (showLoading) {
            iconHtml = '<div class="eyewear-dialog-icon info"><i class="fi fi-rs-spinner rotate"></i></div>';
        } else {
            const iconClass = type === 'success' ? 'fi-rs-check-circle' : (type === 'error' ? 'fi-rs-cross-circle' : 'fi-rs-info');
            iconHtml = `<div class="eyewear-dialog-icon ${type}"><i class="fi ${iconClass}"></i></div>`;
        }

        overlay.innerHTML = `
            <div class="eyewear-dialog modal-content">
                ${iconHtml}
                <p class="eyewear-dialog-msg">${message || 'Please wait...'}</p>
                ${!showLoading ? `<button type="button" class="eyewear-dialog-btn">${buttonText}</button>` : ''}
            </div>
        `;

        document.body.appendChild(overlay);
        
        // Trigger animation
        setTimeout(() => overlay.classList.add('show'), 10);

        if (!showLoading) {
            overlay.querySelector('.eyewear-dialog-btn').addEventListener('click', () => {
                overlay.classList.remove('show');
                setTimeout(() => overlay.remove(), 500);
            });
        }

        return {
            update: (newOptions) => {
                const msgEl = overlay.querySelector('.eyewear-dialog-msg');
                const iconSide = overlay.querySelector('.eyewear-dialog-icon');
                
                if (newOptions.message) msgEl.textContent = newOptions.message;
                
                if (newOptions.type) {
                    iconSide.className = `eyewear-dialog-icon ${newOptions.type}`;
                    const iconClass = newOptions.type === 'success' ? 'fi-rs-check-circle' : (newOptions.type === 'error' ? 'fi-rs-cross-circle' : 'fi-rs-info');
                    iconSide.innerHTML = `<i class="fi ${iconClass}"></i>`;
                }

                if (!newOptions.showLoading && !overlay.querySelector('.eyewear-dialog-btn')) {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'eyewear-dialog-btn';
                    btn.textContent = newOptions.buttonText || 'Close';
                    btn.addEventListener('click', () => {
                        overlay.classList.remove('show');
                        setTimeout(() => overlay.remove(), 500);
                    });
                    overlay.querySelector('.eyewear-dialog').appendChild(btn);
                }
            },
            close: () => {
                overlay.classList.remove('show');
                setTimeout(() => overlay.remove(), 500);
            }
        };
    };

    // Handle Registration
    const signUpForm = document.querySelector('.sign-up-container form');
    signUpForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(signUpForm);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');

        // Show immediate loading dialog
        const dialog = showEyewearDialog({
            message: 'Processing your registration...',
            showLoading: true
        });

        const btn = signUpForm.querySelector('.btn');
        if (btn) btn.disabled = true;

        try {
            const response = await api.auth.register({ name, email, password });
            dialog.update({
                type: 'success',
                message: response.message || 'Registration successful! Please check your email to verify your account.',
                showLoading: false,
                buttonText: 'Got it!'
            });
            container.classList.remove("active");
            signUpForm.reset();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Registration failed';
            dialog.update({
                type: 'error',
                message: 'Error: ' + errorMsg,
                showLoading: false,
                buttonText: 'Try Again'
            });
        } finally {
            if (btn) btn.disabled = false;
        }
    });

    // Handle Login
    const signInForm = document.querySelector('.sign-in-container form');
    signInForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(signInForm);
        const email = formData.get('email');
        const password = formData.get('password');

        const dialog = showEyewearDialog({
            message: 'Signing you in...',
            showLoading: true
        });

        const btn = signInForm.querySelector('.btn');
        if (btn) btn.disabled = true;

        try {
            await api.auth.login({ email, password });
            dialog.close(); // Close immediately on successful login to redirect
            window.location.href = api.auth.isStaff() ? '/pages/dashboard/index.html' : '/index.html';
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Login failed';
            dialog.update({
                type: 'error',
                message: 'Login failed: ' + errorMsg,
                showLoading: false,
                buttonText: 'Try Again'
            });
        } finally {
            if (btn) btn.disabled = false;
        }
    });
})();

