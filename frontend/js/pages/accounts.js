import profileService from '../services/profileService.js';
import authService from '../services/authService.js';
import { supportService } from '../services/supportService.js';

const profileForm = document.getElementById('profile-form');
const createTicketForm = document.getElementById('createTicketForm');
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

    if (avatarEl) avatarEl.src = avatarSrc;
    if (editorAvatarEl) editorAvatarEl.src = avatarSrc;

    const headerGreeting = document.querySelector('.user-trigger span');
    if (headerGreeting) headerGreeting.textContent = `Hi, ${displayName}`;

    if (profile.addresses) {
        renderAddressList(profile.addresses);
    } else {
        loadAddresses();
    }

    if (profile.recent_orders) {
        renderOrdersTable(profile.recent_orders);
    }

    return profile;
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
        const response = await profileService.getAddresses();
        renderAddressList(response.data || []);
        return response.data;
    } catch (err) {
        console.error("Failed to load addresses", err);
    }
}

function openAddressEditor(address = null) {
    const overlay = document.getElementById('address-editor-overlay');
    const form = document.getElementById('address-editor-form');
    const title = document.getElementById('address-editor-title');
    
    if (!overlay || !form) return;

    overlay.hidden = false;
    form.reset();

    if (address) {
        title.textContent = 'Edit Address';
        form.id.value = address.id;
        form.label.value = address.label;
        form.phone.value = address.phone;
        form.is_default.checked = !!address.is_default;
    } else {
        title.textContent = 'Add New Address';
        form.id.value = '';
    }

    overlay.classList.add('show');
    initAddressSelectors(address);
}

const provinceSelect = document.getElementById('address-province-select');
const wardSelect = document.getElementById('address-ward-select');
const streetInput = document.getElementById('address-street-input');
const fullAddressHidden = document.getElementById('address-full-hidden');

async function initAddressSelectors(address = null) {
    if (!provinceSelect) return;

    provinceSelect.innerHTML = '<option value="">Loading Provinces...</option>';
    wardSelect.innerHTML = '<option value="">Select Ward/Commune</option>';
    wardSelect.disabled = true;
    streetInput.value = '';

    try {
        const response = await fetch('https://provinces.open-api.vn/api/v2/p/');
        const provinces = await response.json();
        
        provinceSelect.innerHTML = '<option value="">Select Province/City (2025 Standard)</option>';
        provinces.sort((a, b) => a.name.localeCompare(b.name, 'vi')).forEach(p => {
            const option = document.createElement('option');
            option.value = p.code;
            option.textContent = p.name;
            provinceSelect.appendChild(option);
        });

        if (address) {
            const parts = address.address.split(',').map(s => s.trim());
            if (parts.length >= 3) {
                streetInput.value = parts[0];
                const wardName = parts[1];
                const provinceName = parts[2];

                const provinceOption = Array.from(provinceSelect.options).find(opt => opt.text === provinceName);
                if (provinceOption) {
                    provinceSelect.value = provinceOption.value;
                    await loadWards(provinceOption.value, wardName);
                }
            }
        }
    } catch (err) {
        console.error("OpenAPI v2 Load Error:", err);
        provinceSelect.innerHTML = '<option value="">Error loading provinces</option>';
    }
}

async function loadWards(provinceCode, autoSelectWardName = null) {
    wardSelect.innerHTML = '<option value="">Loading Wards...</option>';
    wardSelect.disabled = true;

    try {
        const response = await fetch(`https://provinces.open-api.vn/api/v2/w/?province=${provinceCode}`);
        const wards = await response.json();

        wardSelect.innerHTML = '<option value="">Select Ward/Commune</option>';
        wards.sort((a, b) => a.name.localeCompare(b.name, 'vi')).forEach(w => {
            const option = document.createElement('option');
            option.value = w.code;
            option.textContent = w.name;
            wardSelect.appendChild(option);
        });

        if (autoSelectWardName) {
            const wardOption = Array.from(wardSelect.options).find(opt => opt.text === autoSelectWardName);
            if (wardOption) wardSelect.value = wardOption.value;
        }
        wardSelect.disabled = false;
    } catch (err) {
        console.error("Ward Load Error:", err);
        wardSelect.innerHTML = '<option value="">Error loading wards</option>';
    }
}

provinceSelect?.addEventListener('change', () => {
    const pCode = provinceSelect.value;
    if (pCode) loadWards(pCode);
    else {
        wardSelect.innerHTML = '<option value="">Select Ward/Commune</option>';
        wardSelect.disabled = true;
    }
});

function closeAddressEditor() {
    const overlay = document.getElementById('address-editor-overlay');
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => overlay.hidden = true, 300);
    }
}

async function loadUserTickets() {
    const tbody = document.getElementById('userTicketsList');
    if (!tbody) return;

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
    if (!file || !avatarPreview) return;
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

const addressEditorForm = document.getElementById('address-editor-form');
addressEditorForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Concatenate address string
    const street = streetInput.value.trim();
    const ward = wardSelect.options[wardSelect.selectedIndex].text;
    const province = provinceSelect.options[provinceSelect.selectedIndex].text;
    
    const fullAddress = `${street}, ${ward}, ${province}`;
    fullAddressHidden.value = fullAddress;

    const formData = new FormData(addressEditorForm);
    const data = Object.fromEntries(formData);
    const id = data.id;
    delete data.id;
    data.is_default = !!data.is_default;

    try {
        if (id) {
            await profileService.updateAddress(id, data);
        } else {
            await profileService.addAddress(data);
        }
        await loadAddresses();
        closeAddressEditor();
        alert('Address saved successfully!');
    } catch (err) {
        alert('Failed to save address: ' + (err.response?.data?.message || err.message));
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
        alert('Ticket created successfully!');
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
        await authService.logout();
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

    const addBtn = event.target.closest('#add-new-address-btn');
    if (addBtn) {
        openAddressEditor();
        return;
    }

    const editBtn = event.target.closest('.address-action-btn.edit-btn');
    if (editBtn) {
        const id = editBtn.dataset.id;
        const response = await profileService.getAddresses();
        const address = response.data.find(a => a.id == id);
        if (address) openAddressEditor(address);
        return;
    }

    const deleteBtn = event.target.closest('.address-action-btn.delete-btn');
    if (deleteBtn) {
        if (!confirm('Are you sure?')) return;
        try {
            await profileService.deleteAddress(deleteBtn.dataset.id);
            loadAddresses();
        } catch (err) {
            alert('Failed to delete');
        }
        return;
    }

    const cancelBtn = event.target.closest('#cancel-address-edit');
    if (cancelBtn) {
        closeAddressEditor();
        return;
    }

    const ticketLink = event.target.closest('.ticket-detail-link');
    if (ticketLink) {
        event.preventDefault();
        await viewTicketDetail(Number(ticketLink.dataset.ticketId));
    }

    const tab = event.target.closest('.account__tab');
    if (tab && tab.dataset.target) {
        document.querySelectorAll('.account__tab').forEach(t => t.classList.remove('active-tab'));
        tab.classList.add('active-tab');
        document.querySelectorAll('.tab__content').forEach(c => c.classList.remove('active-tab'));
        document.querySelector(tab.dataset.target).classList.add('active-tab');
    }
});
