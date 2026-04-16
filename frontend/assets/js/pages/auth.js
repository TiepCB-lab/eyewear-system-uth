import authService from '../services/authService.js';

document.addEventListener('DOMContentLoaded', () => {
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const mobileToRegister = document.getElementById('mobileToRegister');
    const mobileToLogin = document.getElementById('mobileToLogin');
    const container = document.getElementById('auth-container');

    // 1. Handle URL Params for Verification
    const params = new URLSearchParams(window.location.search);
    const verified = params.get('verified');
    const verifiedEmail = params.get('email');
    const verifyError = params.get('error');

    if (verified === '1') {
        container.classList.remove('active');
        if (verifiedEmail) {
            const emailInput = document.getElementById('email-signin');
            if (emailInput) {
                emailInput.value = decodeURIComponent(verifiedEmail);
            }
        }
        alert('Xác thực email thành công! Bạn có thể đăng nhập.');
    } else if (verified === '0') {
        container.classList.remove('active');
        alert('Xác thực thất bại: ' + (verifyError ? decodeURIComponent(verifyError) : 'Token không hợp lệ.'));
    }

    // 2. Panel Switching Logic
    signUpButton?.addEventListener('click', () => container.classList.add("active"));
    signInButton?.addEventListener('click', () => container.classList.remove("active"));
    mobileToRegister?.addEventListener('click', () => container.classList.add("active"));
    mobileToLogin?.addEventListener('click', () => container.classList.remove("active"));

    // 3. Handle Registration
    document.querySelector('.sign-up-container .btn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        const btn = e.target;
        const form = btn.closest('form');
        const messageDiv = document.getElementById('signup-message');
        
        const data = {
            name: form.name.value,
            email: form.email.value,
            password: form.password.value
        };

        if (!data.name || !data.email || !data.password) {
            messageDiv.innerHTML = '<span class="error">Vui lòng điền đầy đủ thông tin.</span>';
            return;
        }

        btn.classList.add('loading');
        btn.disabled = true;

        try {
            const response = await authService.register(data);
            messageDiv.innerHTML = `<span class="success">${response.message || 'Đăng ký thành công! Vui lòng kiểm tra email.'}</span>`;
            form.reset();
        } catch (error) {
            messageDiv.innerHTML = `<span class="error">${error.message || 'Đăng ký thất bại. Vui lòng thử lại.'}</span>`;
        } finally {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    });

    // 4. Handle Login
    document.querySelector('.sign-in-container .btn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        const btn = e.target;
        const form = btn.closest('form');
        
        const data = {
            email: form.email.value,
            password: form.password.value
        };

        btn.classList.add('loading');
        btn.disabled = true;

        try {
            await authService.login(data);
            // Sau khi đăng nhập thành công, điều hướng về Home
            window.location.href = '/index.html';
        } catch (error) {
            alert(error.message || 'Đăng nhập thất bại.');
        } finally {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    });
});






