import authService from '../services/authService.js';

(function () {
  const form = document.getElementById('reset-password-form');
  const messageEl = document.getElementById('reset-message');

  const params = new URLSearchParams(window.location.search);
  const email = params.get('email') || '';
  const token = params.get('token') || '';

  if (!form || !messageEl) {
    return;
  }

  if (!email || !token) {
    messageEl.textContent = 'Invalid reset password link.';
    messageEl.classList.add('error');
    form.querySelector('button[type="submit"]').disabled = true;
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    messageEl.textContent = '';
    messageEl.classList.remove('error', 'success');
    const submitBtn = form.querySelector('button[type="submit"]');

    const password = document.getElementById('new-password')?.value || '';
    const passwordConfirmation = document.getElementById('new-password-confirm')?.value || '';

    if (password.length < 6) {
      messageEl.textContent = 'New password must be at least 6 characters.';
      messageEl.classList.add('error');
      return;
    }

    if (password !== passwordConfirmation) {
      messageEl.textContent = 'Password confirmation does not match.';
      messageEl.classList.add('error');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
    }
    messageEl.textContent = 'Updating your password. Please wait...';
    messageEl.classList.add('success');

    try {
      const response = await authService.resetPassword({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });

      messageEl.textContent = response.message || 'Dat lai mat khau thanh cong.';
      messageEl.classList.add('success');

      setTimeout(() => {
        window.location.href = '/frontend/pages/auth/index.html';
      }, 1200);
    } catch (error) {
      messageEl.textContent = error.response?.data?.message || error.message || 'Dat lai mat khau that bai.';
      messageEl.classList.remove('success');
      messageEl.classList.add('error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
      }
    }
  });
})();
