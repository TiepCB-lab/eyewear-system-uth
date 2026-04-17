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
    const response = await adminService.getStaffList();
    staff = Array.isArray(response) ? response : response.data || [];
    renderStaffTable(staff);
  } catch (error) {
    console.error('Error loading staff:', error);
    showAlert('Failed to load staff list', 'error');
  }
}

function renderStaffTable(staffData) {
  if (!staffTableBody) return;

  if (!staffData || staffData.length === 0) {
    staffTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">No staff members found</td></tr>';
    return;
  }

  staffTableBody.innerHTML = staffData.map((member) => `
      <tr>
        <td>${member.id || 'N/A'}</td>
        <td>${member.full_name || 'Unknown'}</td>
        <td>${member.email || 'N/A'}</td>
        <td>${member.phone || 'N/A'}</td>
        <td>${member.role_name || 'No role'}</td>
        <td>${member.status || 'Unknown'}</td>
        <td>${formatDate(member.created_at)}</td>
        <td>
          <button class="btn btn--sm" onclick="openEditModal(${member.id})">Edit</button>
          <button class="btn btn--sm" onclick="confirmDelete(${member.id})">Delete</button>
        </td>
      </tr>
    `).join('');
}

function setupEventListeners() {
  if (searchInput) searchInput.addEventListener('input', filterStaffList);
  if (roleFilter) roleFilter.addEventListener('change', filterStaffList);
  if (statusFilter) statusFilter.addEventListener('change', filterStaffList);
}

function filterStaffList() {
  const searchTerm = (searchInput?.value || '').toLowerCase();
  const roleValue = roleFilter?.value || '';
  const statusValue = statusFilter?.value || '';

  const filtered = staff.filter((member) => {
    const matchesSearch =
      member.full_name?.toLowerCase().includes(searchTerm) ||
      member.email?.toLowerCase().includes(searchTerm);
    const matchesRole = !roleValue || member.role_name === roleValue;
    const matchesStatus = !statusValue || member.status === statusValue;
    return matchesSearch && matchesRole && matchesStatus;
  });

  renderStaffTable(filtered);
}

window.openCreateModal = function () {
  editingStaffId = null;
  staffForm?.reset();
  if (modalTitle) modalTitle.textContent = 'Add New Staff';
  if (submitText) submitText.textContent = 'Create Staff';
  if (staffModal) staffModal.style.display = 'flex';
};

window.openEditModal = async function (staffId) {
  try {
    const response = await adminService.getStaffById(staffId);
    const member = response.data || response;

    editingStaffId = staffId;
    if (fullNameInput) fullNameInput.value = member.full_name || '';
    if (emailInput) emailInput.value = member.email || '';
    if (phoneInput) phoneInput.value = member.phone || '';
    if (staffRoleSelect) staffRoleSelect.value = member.role_name || '';
    if (staffStatusSelect) staffStatusSelect.value = member.status || 'active';

    if (modalTitle) modalTitle.textContent = 'Edit Staff Member';
    if (submitText) submitText.textContent = 'Update Staff';
    if (staffModal) staffModal.style.display = 'flex';
  } catch (error) {
    console.error('Error loading staff details:', error);
    showAlert('Failed to load staff details', 'error');
  }
};

window.closeModal = function () {
  if (staffModal) staffModal.style.display = 'none';
  editingStaffId = null;
  staffForm?.reset();
};

window.handleFormSubmit = async function (event) {
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
      await adminService.updateStaff(editingStaffId, staffData);
      showAlert('Staff member updated successfully', 'success');
    } else {
      await adminService.createStaff(staffData);
      showAlert('Staff member created successfully', 'success');
    }

    closeModal();
    await loadStaffList();
  } catch (error) {
    console.error('Error saving staff:', error);
    showAlert(`Failed to save staff: ${error.message}`, 'error');
  }
};

window.confirmDelete = function (staffId) {
  if (confirm('Are you sure you want to delete this staff member?')) {
    deleteStaff(staffId);
  }
};

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
  alertMessage.style.display = 'block';
  alertMessage.style.background = type === 'success' ? '#d4edda' : '#f8d7da';
  alertMessage.style.color = type === 'success' ? '#155724' : '#721c24';

  setTimeout(() => {
    alertMessage.style.display = 'none';
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
