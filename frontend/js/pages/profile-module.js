import profileService from '/js/services/profileService.js';
import authService from '/js/services/authService.js';

async function loadProfile() {
    try {
        const res = await profileService.getProfile();
        const profile = res.profile;
        const user = profile.user || {};
        const staffRole = authService.getUserRoles()[0] || 'staff';

        const form = document.getElementById('staff-profile-form');
        if (form) {
            form.querySelector('input[name="name"]').value = user.full_name || user.name || '';
            form.querySelector('input[name="email"]').value = user.email || '';
            form.querySelector('input[name="phone"]').value = profile.phone || '';
            form.querySelector('input[name="birthdate"]').value = profile.birthdate || '';
            form.querySelector('textarea[name="address"]').value = profile.address || '';
        }

        const nameEl = document.getElementById('profile-name-full');
        if (nameEl) nameEl.textContent = user.full_name || user.name || 'Staff User';
        
        const roleEl = document.getElementById('profile-role-badge');
        if (roleEl) roleEl.textContent = staffRole.replace(/_/g, ' ');
    } catch (e) {
        console.error("Profile load error:", e);
    }
}

const profileForm = document.getElementById('staff-profile-form');
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        try {
            await profileService.updateProfile(data);
            if (window.Notification) window.Notification.show('Your profile has been updated!', 'success');
            else alert('Your profile has been updated!');
        } catch (err) {
            if (window.Notification) window.Notification.show('Error updating profile: ' + err.message, 'error');
            else alert('Error updating profile: ' + err.message);
        }
    });
}

loadProfile();
