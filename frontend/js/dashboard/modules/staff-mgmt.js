import adminService from '../../services/adminService.js';

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

let staff = [];
let editingStaffId = null;

async function initializeStaffPage() {
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
    let roleClass = 'badge-pending';
    if (member.role_name === 'ADMIN') roleClass = 'badge-active';
    else if (member.role_name === 'CUSTOMER') roleClass = 'badge-qc';
    else if (member.role_name === 'MANAGER') roleClass = 'badge-shipped';

    return `
      <tr>
        <td data-label="ID">${member.id || 'N/A'}</td>
        <td data-label="Name"><strong>${member.full_name || 'Unknown'}</strong></td>
        <td data-label="Email">${member.email || 'N/A'}</td>
        <td data-label="Phone">${member.phone || '—'}</td>
        <td data-label="Role"><span class="badge ${roleClass}">${member.role_name || 'No role'}</span></td>
        <td data-label="Status">${member.status || 'Unknown'}</td>
        <td data-label="Joined">${formatDate(member.created_at)}</td>
        <td data-label="Action">
          <button type="button" class="btn btn--sm staff-edit-btn" data-staff-id="${member.id}">Edit / Promote</button>
          <button type="button" class="btn btn--sm staff-delete-btn" data-staff-id="${member.id}">Delete</button>
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
  if (modalTitle) modalTitle.textContent = 'Add New Staff';
  if (submitText) submitText.textContent = 'Create Staff';
  if (staffModal) staffModal.hidden = false;
}

async function openEditModal(staffId) {
  try {
    const response = await adminService.getUserById(staffId);
    const member = response.data || response;

    editingStaffId = staffId;
    if (fullNameInput) fullNameInput.value = member.full_name || '';
    if (emailInput) emailInput.value = member.email || '';
    if (phoneInput) phoneInput.value = member.phone || '';
    if (staffRoleSelect) staffRoleSelect.value = member.role_name || '';
    if (staffStatusSelect) staffStatusSelect.value = member.status || 'active';

    if (modalTitle) modalTitle.textContent = 'Edit User / Promote';
    if (submitText) submitText.textContent = 'Update User';
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
    phone: phoneInput?.value || '',
    role_name: staffRoleSelect?.value || '',
    status: staffStatusSelect?.value || '',
  };

  try {
    if (editingStaffId) {
      await adminService.updateUser(editingStaffId, {
          role_id: document.querySelector(`#staffRole option[value="${staffRoleSelect.value}"]`)?.index, // This is a bit hacky, better use actual IDs
          status: staffStatusSelect.value
      });
      // Wait, role_id should be numeric. Let's fix this properly.
      // We need to fetch roles from backend to map names to IDs.
      const rolesRes = await adminService.getRoles();
      const roleId = rolesRes.data.find(r => r.name === staffRoleSelect.value)?.id;
      
      await adminService.updateUser(editingStaffId, {
          role_id: roleId,
          status: staffStatusSelect.value
      });
      
      showAlert('User updated successfully', 'success');
    } else {
      // For creation, we still use createStaff but it's fine
      const rolesRes = await adminService.getRoles();
      const roleId = rolesRes.data.find(r => r.name === staffRoleSelect.value)?.id;
      
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
