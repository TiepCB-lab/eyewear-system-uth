import adminService from '../../services/adminService.js';
import { getCurrentUserPermissions } from '../../core/rbac.js';

const staffTableBody = document.getElementById('staffTableBody');
const staffModal = document.getElementById('staffModal');
const staffForm = document.getElementById('staffForm');
const modalTitle = document.getElementById('modalTitle');
const submitText = document.getElementById('submitText');
const alertMessage = document.getElementById('alertMessage');
const searchInput = document.getElementById('searchInput');
const roleFilter = document.getElementById('roleFilter');
const statusFilter = document.getElementById('statusFilter');

const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const staffRoleSelect = document.getElementById('staffRole');
const staffStatusSelect = document.getElementById('staffStatus');
const passwordInput = document.getElementById('password');
const passwordFieldContainer = document.getElementById('passwordFieldContainer');

let staff = [];
let editingStaffId = null;

async function initializeStaffPage() {
  const { hasRole } = await getCurrentUserPermissions();
  window.currentUserIsAdmin = hasRole('ADMIN');
  
  await loadStaffList();
  setupEventListeners();
}

async function loadStaffList() {
  try {
    const filters = {
        role: roleFilter?.value || '',
        status: statusFilter?.value || '',
        search: searchInput?.value || ''
    };
    const response = await adminService.getUserList(filters);
    staff = Array.isArray(response) ? response : response.data || [];
    renderStaffTable(staff);
  } catch (error) {
    console.error('Error loading users:', error);
    showAlert('Failed to load user list', 'error');
  }
}

function renderStaffTable(staffData) {
  if (!staffTableBody) return;

  if (!staffData || staffData.length === 0) {
    staffTableBody.innerHTML = '<tr><td colspan="8" class="table-state-cell">No staff members found</td></tr>';
    return;
  }

  staffTableBody.innerHTML = staffData.map((member) => {
    let roleClass = 'status-in-stock'; // Default green for Customer
    if (member.role_name === 'ADMIN') roleClass = 'status-out-of-stock'; // Red
    else if (member.role_name === 'MANAGER') roleClass = 'status-low-stock'; // Yellow
    else if (member.role_name === 'SALES_STAFF' || member.role_name === 'OPERATIONS_STAFF') roleClass = 'status-in-stock';

    return `
      <tr>
        <td data-label="ID">${member.id || 'N/A'}</td>
        <td data-label="Name">
            <div style="font-weight: 700; color: var(--title-color);">${member.full_name || 'Unknown'}</div>
            <div style="font-size: 11px; color: #64748b;">${member.email || 'N/A'}</div>
        </td>
        <td data-label="Phone" style="text-align: center;">${member.phone || '—'}</td>
        <td data-label="Role" style="text-align: center;">
            <span class="status-badge ${roleClass}" style="font-size: 10px; padding: 4px 10px;">${member.role_name || 'No role'}</span>
        </td>
        <td data-label="Status" style="text-align: center;">
            <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: ${member.status === 'active' ? '#10b981' : '#ef4444'}">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: ${member.status === 'active' ? '#10b981' : '#ef4444'}"></span>
                ${member.status.charAt(0).toUpperCase() + member.status.slice(1)}
            </span>
        </td>
        <td data-label="Joined" style="text-align: center; color: #64748b; font-size: 12px;">${formatDate(member.created_at)}</td>
        <td data-label="Action" style="text-align: center;">
          ${(member.role_name === 'ADMIN' && !window.currentUserIsAdmin) ? '<span style="font-size: 11px; color: #94a3b8;">Restricted</span>' : `
          <div class="action-buttons-group">
            <button type="button" class="btn-inventory-action staff-edit-btn" data-staff-id="${member.id}" title="Edit / Promote">
                <i class="fi fi-rs-pencil"></i>
            </button>
            <button type="button" class="btn-inventory-action btn-inventory-action--cancel staff-delete-btn" data-staff-id="${member.id}" title="Deactivate">
                <i class="fi fi-rs-trash"></i>
            </button>
          </div>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

function setupEventListeners() {
  if (searchInput) searchInput.addEventListener('input', filterStaffList);
  if (roleFilter) roleFilter.addEventListener('change', filterStaffList);
  if (statusFilter) statusFilter.addEventListener('change', filterStaffList);

  document.addEventListener('click', async (event) => {
    const createButton = event.target.closest('#openCreateStaffModal');
    if (createButton) {
      openCreateModal();
      return;
    }

    const closeButton = event.target.closest('#closeStaffModal');
    if (closeButton) {
      closeModal();
      return;
    }

    const editButton = event.target.closest('.staff-edit-btn');
    if (editButton) {
      await openEditModal(Number(editButton.dataset.staffId));
      return;
    }

    const deleteButton = event.target.closest('.staff-delete-btn');
    if (deleteButton) {
      confirmDelete(Number(deleteButton.dataset.staffId));
    }
  });

  if (staffForm) {
    staffForm.addEventListener('submit', handleFormSubmit);
  }
}

function filterStaffList() {
    loadStaffList(); // Backend-side filtering is more robust
}

function openCreateModal() {
  editingStaffId = null;
  staffForm?.reset();
  if (passwordFieldContainer) passwordFieldContainer.hidden = false;
  if (passwordInput) passwordInput.required = true;
  if (modalTitle) modalTitle.textContent = 'Add New Staff / Ops';
  if (submitText) submitText.textContent = 'Create Staff Account';
  if (staffModal) staffModal.hidden = false;
}

async function openEditModal(staffId) {
  try {
    const response = await adminService.getUserById(staffId);
    const member = response.data || response;

    editingStaffId = staffId;
    if (member.role_name === 'ADMIN' && !window.currentUserIsAdmin) {
        showAlert('You do not have permission to edit Admin accounts', 'error');
        return;
    }

    if (fullNameInput) fullNameInput.value = member.full_name || '';
    if (emailInput) emailInput.value = member.email || '';
    if (phoneInput) phoneInput.value = member.phone || '';
    if (staffRoleSelect) staffRoleSelect.value = member.role_name || '';
    if (staffStatusSelect) staffStatusSelect.value = member.status || 'active';

    if (passwordFieldContainer) passwordFieldContainer.hidden = true;
    if (passwordInput) passwordInput.required = false;

    if (modalTitle) modalTitle.textContent = 'Edit User / Promote';
    if (submitText) submitText.textContent = 'Update User Info';
    if (staffModal) staffModal.hidden = false;
  } catch (error) {
    console.error('Error loading user details:', error);
    showAlert('Failed to load user details', 'error');
  }
}

function closeModal() {
  if (staffModal) staffModal.hidden = true;
  editingStaffId = null;
  staffForm?.reset();
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const staffData = {
    full_name: fullNameInput?.value || '',
    email: emailInput?.value || '',
    password: passwordInput?.value || '',
    phone: phoneInput?.value || '',
    role_name: staffRoleSelect?.value || '',
    status: staffStatusSelect?.value || '',
  };

  try {
    const rolesRes = await adminService.getRoles();
    const roles = rolesRes.data || rolesRes;
    const roleId = roles.find(r => r.name === staffRoleSelect.value)?.id;

    if (editingStaffId) {
      await adminService.updateUser(editingStaffId, {
          role_id: roleId,
          status: staffStatusSelect.value
      });
      showAlert('User updated successfully', 'success');
    } else {
      await adminService.createStaff({
          ...staffData,
          role_id: roleId
      });
      showAlert('Staff member created successfully', 'success');
    }

    closeModal();
    await loadStaffList();
  } catch (error) {
    console.error('Error saving staff:', error);
    showAlert(`Failed to save staff: ${error.message}`, 'error');
  }
}

function confirmDelete(staffId) {
  if (confirm('Are you sure you want to delete this staff member?')) {
    deleteStaff(staffId);
  }
}

async function deleteStaff(staffId) {
  try {
    await adminService.deleteStaff(staffId);
    showAlert('Staff member deleted successfully', 'success');
    await loadStaffList();
  } catch (error) {
    console.error('Error deleting staff:', error);
    showAlert(`Failed to delete staff: ${error.message}`, 'error');
  }
}

function showAlert(message, type) {
  if (!alertMessage) return;
  alertMessage.textContent = message;
  alertMessage.hidden = false;
  alertMessage.className = `admin-alert ${type === 'success' ? 'admin-alert--success' : 'admin-alert--error'}`;

  setTimeout(() => {
    alertMessage.hidden = true;
  }, 3000);
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeStaffPage);
} else {
  initializeStaffPage();
}
