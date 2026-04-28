import api from '../services/api.js';
import AddressEditor from '../components/address-editor.js';

const profileForm = document.getElementById('profile-form');
const createTicketForm = document.getElementById('createTicketForm');
const changePasswordForm = document.getElementById('change-password-form');
const profileSaveButton = document.querySelector('.profile-editor__actions button[form="profile-form"]');
const activeTabStorageKey = 'eyewear_account_active_tab';

function setActiveAccountTab(tabSelector) {
    const tab = document.querySelector(`.account__tab[data-target="${tabSelector}"]`);
    const content = document.querySelector(tabSelector);

    if (!tab || !content) {
        return;
    }

    document.querySelectorAll('.account__tab').forEach((item) => item.classList.remove('active-tab'));
    document.querySelectorAll('.tab__content').forEach((item) => item.classList.remove('active-tab'));

    tab.classList.add('active-tab');
    content.classList.add('active-tab');
    localStorage.setItem(activeTabStorageKey, tabSelector);
}

function formatBirthdate(value) {
    if (!value) return 'Not set';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not set';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function normalizeAvatarUrl(avatar) {
    if (!avatar) return '../../assets/images/avatar-1.jpg';
    if (avatar.startsWith('http')) return avatar;
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

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderOrdersTable(orders) {
    const tbody = document.getElementById('ordersListBody');
    if (!tbody) return;

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
            : '<strong class="growth-positive">Paid ✓</strong>';

        return `
            <tr>
                <td><strong>#${order.order_number || order.id}</strong></td>
                <td>${date}</td>
                <td>${getStatusBadge(order.status)}</td>
                <td>${payAction}</td>
                <td><strong>${order.payment_status || 'pending'}</strong></td>
                <td><em>${order.production_step || '—'}</em></td>
            </tr>
        `;
    }).join('');
}

async function loadOrderTracking() {
    const tbody = document.getElementById('ordersListBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="table-state-cell">Loading...</td></tr>';
    try {
        const response = await api.profile.getProfile();
        renderOrdersTable(response.data?.profile?.recent_orders || []);
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" class="table-state-cell">Unable to load your orders right now.</td></tr>';
    }
}

async function loadProfileData() {
    try {
        const response = await api.profile.getProfile();
        const profile = response.data?.profile || {};
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

        if (avatarEl) avatarEl.src = avatarSrc;
        if (editorAvatarEl) editorAvatarEl.src = avatarSrc;

        if (profile.addresses) {
            renderAddressList(profile.addresses);
        } else {
            loadAddresses();
        }

        if (profile.recent_orders) {
            renderOrdersTable(profile.recent_orders);
        }

        return profile;
    } catch (error) {
        console.error('Failed to load profile:', error);
        throw error;
    }
}

function renderAddressList(addresses) {
    const list = document.getElementById('address-list');
    if (!list) return;

    if (!addresses || addresses.length === 0) {
        list.innerHTML = '<div class="empty-state">No addresses saved yet. Click the button below to add one.</div>';
        return;
    }

    list.innerHTML = addresses.map(addr => `
        <div class="address-card ${addr.is_default ? 'address-card--default' : ''}">
            <div class="address-card__header">
                <span class="address-card__label">${addr.label}</span>
                ${addr.is_default ? '<span class="address-card__badge">Default</span>' : ''}
            </div>
            <div class="address-card__body">
                <p class="address-card__text">${addr.address.replace(/\n/g, '<br>')}</p>
                <p class="address-card__phone"><i class="fi fi-rs-phone"></i> ${addr.phone}</p>
            </div>
            <div class="address-card__actions">
                <button class="address-action-btn edit-btn" data-id="${addr.id}">Edit</button>
                <button class="address-action-btn delete-btn" data-id="${addr.id}">Delete</button>
            </div>
        </div>
    `).join('');
}

async function loadAddresses() {
    try {
        const response = await api.profile.getAddresses();
        renderAddressList(response.data || []);
        return response.data;
    } catch (err) {
        console.error("Failed to load addresses", err);
    }
}

async function loadUserTickets() {
    const tbody = document.getElementById('userTicketsList');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="table-state-cell">Loading...</td></tr>';
    try {
        const response = await api.support.getTickets(false);
        const tickets = response?.data || [];
        if (!tickets.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="table-state-cell">You have no support tickets yet.</td></tr>';
            return;
        }
        tbody.innerHTML = tickets.map((ticket) => {
            const updatedAt = ticket.updated_at
                ? new Date(ticket.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : '-';

            return `
            <tr>
                <td><strong>${escapeHtml(ticket.subject || '—')}</strong></td>
                <td><span class="badge">${escapeHtml(ticket.status || 'open')}</span></td>
                <td>${updatedAt}</td>
                <td><a href="../support-detail/?id=${ticket.id}" class="view__order ticket-detail-link">View</a></td>
            </tr>
        `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="4" class="table-state-cell table-state-cell--error">Failed to retrieve tickets.</td></tr>';
    }
}

// Handle dynamic component loading for modals
const initAddressEditorIfLoaded = () => {
    const el = document.querySelector('[data-include="components/modals/address-editor"]');
    if (el && el.classList.contains('component-loaded')) {
        AddressEditor.init(() => loadAddresses());
        return true;
    }
    return false;
};

if (!initAddressEditorIfLoaded()) {
    window.addEventListener('content-loaded', (e) => {
        if (e.detail.path === 'components/modals/address-editor') {
            AddressEditor.init(() => loadAddresses());
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadProfileData();
        
        // Handle deep-linking to tabs via query param ?tab=tab-id
        const params = new URLSearchParams(window.location.search);
        const tabId = params.get('tab');
        if (tabId) {
            const tabTrigger = document.querySelector(`.account__tab[data-target="#${tabId}"]`);
            if (tabTrigger) {
                tabTrigger.click();
                if (tabId === 'support-tickets') {
                    await loadUserTickets();
                }
            }
        } else if (localStorage.getItem(activeTabStorageKey) === '#support-tickets') {
            await loadUserTickets();
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
});

profileForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const file = document.getElementById('avatar-input')?.files?.[0];
    if (profileSaveButton) {
        profileSaveButton.disabled = true;
        profileSaveButton.textContent = 'Saving...';
    }
    try {
        const formData = new FormData(profileForm);
        await api.profile.updateProfile(Object.fromEntries(formData));
        if (file) await api.profile.uploadAvatar(file);
        await loadProfileData();
        alert('Profile updated successfully!');
    } catch (error) {
        alert('Failed: ' + (error.response?.data?.message || error.message));
    } finally {
        if (profileSaveButton) {
            profileSaveButton.disabled = false;
            profileSaveButton.textContent = 'Save Changes';
        }
    }
});

createTicketForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const subject = document.getElementById('ticketSubject')?.value;
    const message = document.getElementById('ticketMessage')?.value;
    try {
        localStorage.setItem(activeTabStorageKey, '#support-tickets');
        setActiveAccountTab('#support-tickets');
        await api.support.createTicket(subject, message);
        alert('Ticket created!');
        createTicketForm.reset();
        await loadUserTickets();
    } catch (err) {
        alert('Error: ' + err.message);
    }
});

changePasswordForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
        await api.auth.changePassword({
            current_password: changePasswordForm.current_password.value,
            new_password: changePasswordForm.new_password.value,
            confirm_password: changePasswordForm.confirm_password.value
        });
        alert('Password updated!');
        changePasswordForm.reset();
    } catch (err) {
        alert('Error: ' + (err.response?.data?.message || err.message));
    }
});

document.addEventListener('click', async (event) => {
    const target = event.target;
    if (target.closest('.account__tab:last-child')) {
        await api.auth.logout();
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        localStorage.removeItem('eyewear_cart_count');
        localStorage.removeItem('eyewear_wishlist_count');
        window.location.href = '../auth/index.html';
    } else if (target.closest('[data-target="#orders"]')) {
        loadOrderTracking();
    } else if (target.closest('[data-target="#support-tickets"]')) {
        setActiveAccountTab('#support-tickets');
        loadUserTickets();
    } else if (target.closest('#add-new-address-btn')) {
        AddressEditor.open();
    } else if (target.closest('.address-action-btn.edit-btn')) {
        const id = target.closest('.edit-btn').dataset.id;
        const res = await api.profile.getAddresses();
        AddressEditor.open(res.data.find(a => a.id == id));
    } else if (target.closest('.address-action-btn.delete-btn')) {
        if (confirm('Delete?')) {
            await api.profile.deleteAddress(target.closest('.delete-btn').dataset.id);
            loadAddresses();
        }
    } else if (target.closest('.account__tab[data-target]')) {
        const tab = target.closest('.account__tab');
        setActiveAccountTab(tab.dataset.target);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const savedTab = localStorage.getItem(activeTabStorageKey);
    if (savedTab && document.querySelector(savedTab)) {
        setActiveAccountTab(savedTab);
    }
});
