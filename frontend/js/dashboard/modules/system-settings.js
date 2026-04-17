import adminService from '../../services/adminService.js';

const countAdmin = document.getElementById('countAdmin');
const countManager = document.getElementById('countManager');
const countSales = document.getElementById('countSales');
const countOps = document.getElementById('countOps');

const lensFeeInput = document.getElementById('lensFee');
const comboDiscountInput = document.getElementById('comboDiscount');
const warrantyMonthsInput = document.getElementById('warrantyMonths');
const promotionRulesInput = document.getElementById('promotionRules');

async function initializeSettings() {
  try {
    await loadStaffCounts();
    await loadSystemConfig();
  } catch (error) {
    console.error('Error initializing settings:', error);
  }
}

async function loadStaffCounts() {
  try {
    const response = await adminService.getStaffList();
    const staff = Array.isArray(response) ? response : response.data || [];

    const adminCount = staff.filter((s) => s.role_name === 'system_admin').length;
    const managerCount = staff.filter((s) => s.role_name === 'manager').length;
    const salesCount = staff.filter((s) => s.role_name === 'sales_staff').length;
    const opsCount = staff.filter((s) => s.role_name === 'operations_staff').length;

    if (countAdmin) countAdmin.textContent = `${adminCount} (Main Control)`;
    if (countManager) countManager.textContent = `${managerCount} (Reports/Logistics)`;
    if (countSales) countSales.textContent = `${salesCount} (Support/Verification)`;
    if (countOps) countOps.textContent = `${opsCount} (Lab Ky thuat)`;
  } catch (error) {
    console.error('Error loading staff counts:', error);
    if (countAdmin) countAdmin.textContent = 'Error loading';
  }
}

async function loadSystemConfig() {
  try {
    const response = await adminService.getConfig();
    const config = response.data || response;

    if (config.lens_fee && lensFeeInput) {
      lensFeeInput.value = parseFloat(config.lens_fee).toFixed(2);
    }
    if (config.combo_discount && comboDiscountInput) {
      comboDiscountInput.value = parseFloat(config.combo_discount).toFixed(1);
    }
    if (config.warranty_months && warrantyMonthsInput) {
      warrantyMonthsInput.value = parseInt(config.warranty_months, 10);
    }
    if (config.promotion_rules && promotionRulesInput) {
      promotionRulesInput.value = config.promotion_rules;
    }
  } catch (error) {
    console.error('Error loading system config:', error);
  }
}

window.handleSettingsSubmit = async function (event) {
  event.preventDefault();

  try {
    await Promise.all([
      adminService.setConfig('lens_fee', lensFeeInput?.value || ''),
      adminService.setConfig('combo_discount', comboDiscountInput?.value || ''),
      adminService.setConfig('warranty_months', warrantyMonthsInput?.value || ''),
      adminService.setConfig('promotion_rules', promotionRulesInput?.value || ''),
    ]);

    alert('System settings updated successfully!');
  } catch (error) {
    console.error('Error saving settings:', error);
    alert(`Failed to save settings: ${error.message}`);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSettings);
} else {
  initializeSettings();
}
