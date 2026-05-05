import api from '../services/api.js';

(async function() {
    if (api.auth.isAuthenticated()) {
        window.location.href = api.auth.isStaff() ? '/pages/portal/index.html' : '/index.html';
        return;
    }

    const container = document.getElementById('auth-container');
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
        try {
            await api.auth.verifyEmail(token);
            await EvelensNotify.success('Success!', 'Your email has been verified. You can now log in.');
        } catch (error) {
            await EvelensNotify.error('Verification Failed', error.message);
        }
    }

    // Toggle forms
    const switchToSignUp = () => container.classList.add("active");
    const switchToSignIn = () => container.classList.remove("active");

    document.getElementById('signUp')?.addEventListener('click', switchToSignUp);
    document.getElementById('signIn')?.addEventListener('click', switchToSignIn);
    
    // Mobile Toggles
    document.getElementById('toSignUpMobile')?.addEventListener('click', switchToSignUp);
    document.getElementById('toSignInMobile')?.addEventListener('click', switchToSignIn);

    // Forgot Password
    document.getElementById('forgot-password-link')?.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = prompt('Enter your email to reset password:');
        if (!email) return;

        const loader = await EvelensNotify.loading('Sending request...');
        try {
            const response = await api.auth.forgotPassword(email.trim());
            loader.update({
                type: 'success',
                title: 'Email Sent!',
                desc: response.message || 'Please check your inbox for the reset link.',
                btnText: 'Close'
            });
        } catch (error) {
            loader.update({
                type: 'error',
                title: 'Failed',
                desc: error.response?.data?.message || error.message,
                btnText: 'Try Again'
            });
        }
    });

    // Handle Registration
    const signUpForm = document.querySelector('.sign-up-container form');
    signUpForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(signUpForm);
        
        const loader = await EvelensNotify.loading('Creating your account...');
        const btn = signUpForm.querySelector('.btn');
        if (btn) btn.disabled = true;

        try {
            const response = await api.auth.register(Object.fromEntries(formData));
            loader.update({
                type: 'success',
                title: 'Registration Successful!',
                desc: response.message || 'Please check your email to activate your account.',
                btnText: 'Great'
            });
            container.classList.remove("active");
            signUpForm.reset();
        } catch (error) {
            loader.update({
                type: 'error',
                title: 'Registration Error',
                desc: error.response?.data?.message || error.message,
                btnText: 'Go Back'
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

        const loader = await EvelensNotify.loading('Authenticating...');
        const btn = signInForm.querySelector('.btn');
        if (btn) btn.disabled = true;

        try {
            await api.auth.login(Object.fromEntries(formData));
            loader.hide();
            window.location.href = api.auth.isStaff() ? '/pages/portal/index.html' : '/index.html';
        } catch (error) {
            loader.update({
                type: 'error',
                title: 'Login Failed',
                desc: error.response?.data?.message || error.message,
                btnText: 'Try Again'
            });
        } finally {
            if (btn) btn.disabled = false;
        }
    });
})();

