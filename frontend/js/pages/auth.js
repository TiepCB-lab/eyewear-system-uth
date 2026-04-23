import authService from '../services/authService.js';

(async function() {
    // If already logged in, redirect away
    if (authService.isAuthenticated()) {
        const context = authService.getPrimaryContext();
        if (context === 'staff') {
            window.location.href = '/pages/dashboard/index.html';
        } else {
            window.location.href = '/index.html';
        }
        return;
    }
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const toSignUpMobile = document.getElementById('toSignUpMobile');
    const toSignInMobile = document.getElementById('toSignInMobile');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const container = document.getElementById('auth-container');

    const params = new URLSearchParams(window.location.search);
    let verified = params.get('verified');
    let verifiedEmail = params.get('email');
    let verifyError = params.get('error');
    const token = params.get('token');

    if (token) {
        try {
            const result = await authService.verifyEmail(token);
            verified = '1';
            verifiedEmail = result.email || verifiedEmail;
            verifyError = null;

            const nextUrl = new URL(window.location.href);
            nextUrl.searchParams.delete('token');
            nextUrl.searchParams.delete('error');
            nextUrl.searchParams.set('verified', '1');
            if (verifiedEmail) {
                nextUrl.searchParams.set('email', verifiedEmail);
            }
            window.history.replaceState({}, '', nextUrl);
        } catch (error) {
            verified = '0';
            verifyError = error.message || 'Invalid token.';

            const nextUrl = new URL(window.location.href);
            nextUrl.searchParams.delete('token');
            nextUrl.searchParams.set('verified', '0');
            nextUrl.searchParams.set('error', verifyError);
            window.history.replaceState({}, '', nextUrl);
        }
    }

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

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const emailInput = document.querySelector('.sign-in-container input[name="email"]');
            const prefilledEmail = emailInput ? emailInput.value.trim() : '';
            const email = prompt('Enter email to receive password reset link:', prefilledEmail);

            if (!email) {
                return;
            }

            try {
                const response = await authService.forgotPassword(email.trim());
                let message = response.message || 'If the email exists in our system, a reset link has been sent.';
                if (response.email_sent === false && response.reset_url) {
                    message += '\n\nCould not send email. You can open this link to reset your password:\n' + response.reset_url;
                }
                alert(message);
            } catch (error) {
                alert('Forgot password request failed: ' + (error.response?.data?.message || error.message));
            }
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

            signUpBtn.disabled = true;
            messageEl.textContent = 'Processing...';

            // Fire async without awaiting immediately to prevent UI blocking
            authService.register({ name, email, password }).catch(error => {
                const errorMessage = error.response?.data?.message || 'Email sending failed.';
                alert('Registration Error: ' + errorMessage);
            });

            // Instant feedback
            await alert('Registration successful! Please check your Email Inbox (including Spam folder) to verify your account.');
            container.classList.remove("active");
            signUpBtn.disabled = false;
            messageEl.textContent = '';
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
                    window.location.href = '/pages/dashboard/index.html';
                } else {
                    window.location.href = '/index.html';
                }
            } catch (error) {
                alert('Login failed: ' + (error.response?.data?.message || error.message));
            }
        });
    }
})();

