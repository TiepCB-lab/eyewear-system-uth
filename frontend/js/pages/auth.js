import authService from '../services/authService.js';

(function() {
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const toSignUpMobile = document.getElementById('toSignUpMobile');
    const toSignInMobile = document.getElementById('toSignInMobile');
    const container = document.getElementById('auth-container');

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
        alert('Email verified successfully! You can now log in.');
    } else if (verified === '0') {
        container.classList.remove('active');
        alert('Verification failed: ' + (verifyError ? decodeURIComponent(verifyError) : 'Invalid token.'));
    }

    if(signUpButton) {
        signUpButton.addEventListener('click', () => {
            container.classList.add("active");
        });
    }

    if(signInButton) {
        signInButton.addEventListener('click', () => {
            container.classList.remove("active");
        });
    }

    if(toSignUpMobile) {
        toSignUpMobile.addEventListener('click', () => {
            container.classList.add("active");
        });
    }

    if(toSignInMobile) {
        toSignInMobile.addEventListener('click', () => {
            container.classList.remove("active");
        });
    }

    // Handle Registration
    const signUpBtn = document.querySelector('.sign-up-container .btn');
    if (signUpBtn) {
        signUpBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const messageEl = document.getElementById('signup-message');
            const name = document.querySelector('.sign-up-container input[name="name"]').value;
            const email = document.querySelector('.sign-up-container input[name="email"]').value;
            const password = document.querySelector('.sign-up-container input[name="password"]').value;

            messageEl.textContent = '';
            messageEl.classList.remove('error', 'success');

            if (!name || !email || !password) {
                messageEl.textContent = 'Please enter your name, email and password.';
                messageEl.classList.add('error');
                return;
            }

            try {
                const response = await authService.register({ name, email, password });
                const message = response.message || 'Registration successful! Verification email sent.';
                messageEl.textContent = message;
                messageEl.classList.add('success');
                alert(message);
                container.classList.remove("active");
            } catch (error) {
                const errorMessage = error.response?.data?.message || error.message || 'Registration failed.';
                messageEl.textContent = errorMessage;
                messageEl.classList.add('error');
            }
        });
    }

    // Handle Login
    const signInBtn = document.querySelector('.sign-in-container .btn');
    if (signInBtn) {
        signInBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const emailInput = document.querySelector('.sign-in-container input[name="email"]');
            const passInput = document.querySelector('.sign-in-container input[name="password"]');
            
            const email = emailInput ? emailInput.value : '';
            const password = passInput ? passInput.value : '';

            if (!email || !password) {
                alert('Please fill in all fields');
                return;
            }

            try {
                const response = await authService.login({ email, password });

                // Redirect based on role context
                const context = authService.getPrimaryContext();
                
                if (context === 'staff') {
                    window.location.href = '../dashboard/index.html';
                } else {
                    window.location.href = '/'; // Home/Shop
                }
            } catch (error) {
                alert('Login failed: ' + (error.response?.data?.message || error.message));
            }
        });
    }
})();
