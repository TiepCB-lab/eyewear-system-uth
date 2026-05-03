import apiClient from './apiClient.js';

class AdminService {
  // ========== STAFF MANAGEMENT ==========
  async getStaffList(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.role) params.append('role', filters.role);
    
    const response = await apiClient.get(`/admin/staff${params.toString() ? '?' + params : ''}`);
    return response.data;
  }

  async getStaffById(id) {
    const response = await apiClient.get(`/admin/staff/${id}`);
    return response.data;
  }

  async createStaff(staffData) {
    const response = await apiClient.post('/admin/staff', staffData);
    return response.data;
  }

  async updateStaff(id, staffData) {
    const response = await apiClient.put(`/admin/staff/${id}`, staffData);
    return response.data;
  }

  async deleteStaff(id) {
    const response = await apiClient.delete(`/admin/staff/${id}`);
    return response.data;
  }

  // ========== ROLE MANAGEMENT ==========
  async getRoles() {
    const response = await apiClient.get('/admin/roles');
    return response.data;
  }

  async getRole(id) {
    const response = await apiClient.get(`/admin/roles/show?id=${id}`);
    return response.data;
  }

  // ========== SYSTEM CONFIGURATION ==========
  async setConfig(configKey, configValue) {
    const response = await apiClient.post('/admin/config', {
      config_key: configKey,
      config_value: configValue,
    });
    return response.data;
  }

  async getConfig(configKey = null) {
    const url = configKey ? `/admin/config?key=${configKey}` : '/admin/config';
    const response = await apiClient.get(url);
    return response.data;
  }

  // ========== VOUCHER MANAGEMENT ==========
  async createVoucher(voucherData) {
    const response = await apiClient.post('/admin/vouchers', voucherData);
    return response.data;
  }

  async listVouchers(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    
    const response = await apiClient.get(`/admin/vouchers${params.toString() ? '?' + params : ''}`);
    return response.data;
  }

  async getVoucher(id) {
    const response = await apiClient.get(`/admin/vouchers/show?id=${id}`);
    return response.data;
  }

  async updateVoucher(id, voucherData) {
    const response = await apiClient.put(`/admin/vouchers/${id}`, voucherData);
    return response.data;
  }

  async deleteVoucher(id) {
    const response = await apiClient.delete(`/admin/vouchers/${id}`);
    return response.data;
  }

  // ========== INVENTORY MANAGEMENT ==========
  async getInventory() {
    const response = await apiClient.get('/admin/inventory');
    return response.data;
  }

  async updateStock(variantId, quantity) {
    const response = await apiClient.put('/admin/inventory/stock', {
      variant_id: variantId,
      quantity: quantity
    });
    return response.data;
  }
}


export default new AdminService();
