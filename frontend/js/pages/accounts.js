import profileService from '../services/profileService.js';
import authService from '../services/authService.js';
import { supportService } from '../services/supportService.js';

const profileForm = document.getElementById('profile-form');
const createTicketForm = document.getElementById('createTicketForm');
const addressEditorForm = document.getElementById('address-editor');
const profileSaveButton = document.querySelector('.profile-editor__actions button[form="profile-form"]');

function formatBirthdate(value) {
    if (!value) return 'Not set';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not set';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function normalizeAvatarUrl(avatar) {
    if (!avatar) return '../../assets/images/avatar-1.jpg';
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
    if (avatar.startsWith('/')) return `http://localhost:8000${avatar}`;
    return `http://localhost:8000/${avatar.replace(/^\/+/, '')}`;
}

function getStatusBadge(status) {
    const map = {
        pending: { cls: 'badge-pending', label: 'Pending' },
        verified: { cls: 'badge-qc', label: 'Verified' },
        processing: { cls: 'badge-shipped', label: 'Processing' },
        shipped: { cls: 'badge-shipped', label: 'Shipped' },
        delivered: { cls: 'badge-active', label: 'Delivered' },
        cancelled: { cls: 'badge-inactive', label: 'Cancelled' },
        refunded: { cls: 'badge-inactive', label: 'Refunded' },
    };

    const current = map[status] || { cls: 'badge-pending', label: status };
    return `<span class="badge ${current.cls}">${current.label}</span>`;
}

function getTicketStatusBadge(status) {
    const map = {
        open: { cls: 'badge-pending', label: 'Open' },
        in_progress: { cls: 'badge-qc', label: 'In Progress' },
        resolved: { cls: 'badge-active', label: 'Resolved' },
        closed: { cls: 'badge-inactive', label: 'Closed' },
    };

    const current = map[status] || { cls: 'badge-pending', label: status };
    return `<span class="badge ${current.cls}">${current.label}</span>`;
}

function renderOrdersTable(orders) {
    const tbody = document.getElementById('ordersListBody');
    if (!tbody) {
        return;
    }

    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="table-state-cell">You have no orders yet.</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map((order) => {
        const date = order.placed_at
            ? new Date(order.placed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '-';
        const payAction = (order.payment_status === 'pending' || !order.payment_status)
            ? `<a href="../payment/?order_id=${order.id}" class="view__order">Pay Now</a>`
            : '<strong class="growth-positive">Paid âœ“</strong>';

        return `
            <tr>
                <td><strong>#${order.order_number || order.id}</strong></td>
                <td>${date}</td>
                <td>${getStatusBadge(order.status)}</td>
                <td>${payAction}</td>
                <td><strong>${order.payment_status || 'pending'}</strong></td>
                <td><em>${order.production_step || 'â€”'}</em></td>
            </tr>
        `;
    }).join('');
}

async function loadOrderTracking() {
    const tbody = document.getElementById('ordersListBody');
    if (!tbody) {
        return;
    }

    tbody.innerHTML = '<tr><td colspan="6" class="table-state-cell">Loading...</td></tr>';
    try {
        const response = await profileService.getProfile();
        renderOrdersTable(response.profile?.recent_orders || []);
    } catch (err) {
        console.error('Orders load error:', err);
        tbody.innerHTML = '<tr><td colspan="6" class="table-state-cell">Unable to load your orders right now.</td></tr>';
    }
}

async function loadProfileData() {
    const response = await profileService.getProfile();
    const profile = response.profile || {};
    const user = profile.user || {};

    const displayName = user.full_name || user.name || 'User';
    const avatarSrc = normalizeAvatarUrl(profile.avatar);

    const fullNameInput = document.querySelector('input[name="full_name"]');
    const birthdateInput = document.querySelector('input[name="birthdate"]');
    const profileEmailInput = document.getElementById('profile-email-input');
    const profileEditorNameInput = document.getElementById('profile-editor-name-input');

    if (fullNameInput) fullNameInput.value = displayName;
    if (profileEditorNameInput) profileEditorNameInput.value = displayName;
    if (birthdateInput) birthdateInput.value = profile.birthdate || '';
    if (profileEmailInput) profileEmailInput.value = user.email || '';

    const dashboardTab = document.querySelector('#dashboard .tab__header');
    if (dashboardTab) dashboardTab.textContent = `Hello ${displayName}`;

    const fullNameEl = document.getElementById('profile-fullname');
    const birthdateEl = document.getElementById('profile-birthdate');
    const phoneEl = document.getElementById('profile-phone');
    const emailEl = document.getElementById('profile-email');
    const avatarEl = document.getElementById('profile-avatar');
    const editorAvatarEl = document.getElementById('profile-editor-avatar');

    if (fullNameEl) fullNameEl.textContent = displayName;
    if (birthdateEl) birthdateEl.textContent = formatBirthdate(profile.birthdate);
    if (phoneEl) phoneEl.textContent = profile.phone || 'Not set';
    if (emailEl) emailEl.textContent = user.email || 'Not set';

    if (avatarEl) {
        avatarEl.src = avatarSrc;
        avatarEl.dataset.fallbackSrc = '../../assets/images/avatar-1.jpg';
    }

    if (editorAvatarEl) {
        editorAvatarEl.src = avatarSrc;
        editorAvatarEl.dataset.fallbackSrc = '../../assets/images/avatar-1.jpg';
    }

    const headerGreeting = document.querySelector('.user-trigger span');
    if (headerGreeting) {
        headerGreeting.textContent = `Hi, ${displayName}`;
    }

    const addressBox = document.getElementById('account-address');
    const addressMeta = document.getElementById('account-address-meta');
    const addressPhoneInput = document.getElementById('address-phone-input');
    const addressTextInput = document.getElementById('address-text-input');

    if (addressBox) {
        const accountAddress = profile.billing_address || profile.address || 'No address set yet.';
        addressBox.innerHTML = accountAddress
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .join('<br />');
    }

    if (addressMeta) {
        addressMeta.textContent = profile.phone ? `Phone: ${profile.phone}` : 'No phone number set.';
    }

    if (addressPhoneInput) addressPhoneInput.value = profile.phone || '';
    if (addressTextInput) addressTextInput.value = profile.address || '';

    if (profile.recent_orders) {
        renderOrdersTable(profile.recent_orders);
    }

    return profile;
}

async function loadUserTickets() {
    const tbody = document.getElementById('userTicketsList');
    if (!tbody) {
        return;
    }

    tbody.innerHTML = '<tr><td colspan="4" class="table-state-cell">Loading...</td></tr>';
    try {
        const response = await supportService.getTickets(false);
        const tickets = response?.data || [];

        if (!tickets.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="table-state-cell">You have no support tickets yet.</td></tr>';
            return;
        }

        tbody.innerHTML = tickets.map((ticket) => {
            const updated = ticket.updated_at
                ? new Date(ticket.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : '-';

            return `
                <tr>
                    <td><strong>${ticket.subject}</strong><br><small class="support-message-preview">${ticket.message?.substring(0, 80)}${ticket.message?.length > 80 ? '...' : ''}</small></td>
                    <td>${getTicketStatusBadge(ticket.status)}</td>
                    <td>${updated}</td>
                    <td><a href="#" class="view__order ticket-detail-link" data-ticket-id="${ticket.id}">View</a></td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="4" class="table-state-cell table-state-cell--error">Failed to retrieve tickets.</td></tr>';
    }
}

async function viewTicketDetail(ticketId) {
    try {
        const response = await supportService.getTicketById(ticketId);
        const ticket = response?.data;
        if (!ticket) {
            alert('Could not load ticket details.');
            return;
        }

        const replies = ticket.replies || [];
        const message = `Ticket #${ticket.id}: ${ticket.subject}\nStatus: ${ticket.status}\n\n--- Replies ---\n${replies.map((reply) => reply.message).join('\n') || 'None'}`;
        alert(message);
    } catch (err) {
        alert('Error loading ticket: ' + err.message);
    }
}

function openAddressEditor() {
    const addressView = document.getElementById('address-view');
    const addressEditor = document.getElementById('address-editor');
    if (addressView) addressView.hidden = true;
    if (addressEditor) addressEditor.hidden = false;

    window.setTimeout(() => {
        const addressInput = document.getElementById('address-text-input');
        if (addressInput) {
            addressInput.focus();
            addressInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 50);
}

function closeAddressEditor() {
    const addressView = document.getElementById('address-view');
    const addressEditor = document.getElementById('address-editor');
    if (addressEditor) addressEditor.hidden = true;
    if (addressView) addressView.hidden = false;
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadProfileData();
    } catch (error) {
        console.error('Failed to load profile:', error);
        if (error.response?.status === 401) {
            window.location.href = '../auth/index.html';
        }
    }
});

const avatarTrigger = document.getElementById('profile-avatar-trigger');
const avatarInput = document.getElementById('avatar-input');
const avatarPreview = document.getElementById('profile-editor-avatar');

avatarTrigger?.addEventListener('click', () => avatarInput?.click());

avatarInput?.addEventListener('change', () => {
    const file = avatarInput.files?.[0];
    if (!file || !avatarPreview) {
        return;
    }

    const previewUrl = URL.createObjectURL(file);
    avatarPreview.src = previewUrl;
    avatarPreview.onload = () => URL.revokeObjectURL(previewUrl);
});

profileForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const file = avatarInput?.files?.[0];

    if (profileSaveButton) {
        profileSaveButton.disabled = true;
        profileSaveButton.textContent = 'Saving...';
    }

    const formData = new FormData(profileForm);
    const data = Object.fromEntries(formData);

    try {
        await profileService.updateProfile(data);
        if (file) {
            await profileService.uploadAvatar(file);
            avatarInput.value = '';
        }
        await loadProfileData();
        alert('Profile updated successfully!');
    } catch (error) {
        alert('Failed to update profile: ' + (error.response?.data?.message || error.message));
    } finally {
        if (profileSaveButton) {
            profileSaveButton.disabled = false;
            profileSaveButton.textContent = 'Save Changes';
        }
    }
});

const profileEditorNameInput = document.getElementById('profile-editor-name-input');
const hiddenProfileNameInput = document.getElementById('profile-full-name');
profileEditorNameInput?.addEventListener('input', () => {
    if (hiddenProfileNameInput) {
        hiddenProfileNameInput.value = profileEditorNameInput.value;
    }
});

addressEditorForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = addressEditorForm.querySelector('button[type="submit"]');
    const formData = new FormData(addressEditorForm);
    const data = Object.fromEntries(formData);

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';
    }

    try {
        await profileService.updateProfile(data);
        await loadProfileData();
        closeAddressEditor();
        alert('Address updated successfully!');
    } catch (error) {
        alert('Failed to update address: ' + (error.response?.data?.message || error.message));
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Save Address';
        }
    }
});

createTicketForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const subject = document.getElementById('ticketSubject')?.value.trim();
    const message = document.getElementById('ticketMessage')?.value.trim();
    if (!subject || !message) {
        alert('Please fill in all fields.');
        return;
    }

    const button = createTicketForm.querySelector('button[type="submit"]');
    if (button) {
        button.disabled = true;
        button.textContent = 'Submitting...';
    }

    try {
        await supportService.createTicket(subject, message);
        alert('Ticket created successfully! Our team will respond shortly.');
        createTicketForm.reset();
        loadUserTickets();
    } catch (err) {
        alert('Error creating ticket: ' + (err.response?.data?.error || err.message));
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = 'Create Ticket';
        }
    }
});

document.addEventListener('click', async (event) => {
    const logoutTab = event.target.closest('.account__tab:last-child');
    if (logoutTab) {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
        window.location.href = '../auth/index.html';
        return;
    }

    const ordersTab = event.target.closest('[data-target="#orders"]');
    if (ordersTab) {
        loadOrderTracking();
        return;
    }

    const supportTab = event.target.closest('[data-target="#support-tickets"]');
    if (supportTab) {
        loadUserTickets();
        return;
    }

    const editAddressLink = event.target.closest('#edit-address-link');
    if (editAddressLink) {
        event.preventDefault();
        openAddressEditor();
        return;
    }

    const cancelAddressButton = event.target.closest('#cancel-address-edit');
    if (cancelAddressButton) {
        closeAddressEditor();
        return;
    }

    const ticketLink = event.target.closest('.ticket-detail-link');
    if (ticketLink) {
        event.preventDefault();
        await viewTicketDetail(Number(ticketLink.dataset.ticketId));
    }
});

const initialOrdersTab = document.querySelector('[data-target="#orders"]');
if (initialOrdersTab?.classList.contains('active-tab')) {
    loadOrderTracking();
}
