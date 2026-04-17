import apiClient from './apiClient.js';

class AdminService {
  // ========== STAFF MANAGEMENT ==========
  async getStaffList(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.role) params.append('role', filters.role);
    
    const response = await apiClient.get(`/v1/admin/staff${params.toString() ? '?' + params : ''}`);
    return response.data;
  }

  async getStaffById(id) {
    const response = await apiClient.get(`/v1/admin/staff/show?id=${id}`);
    return response.data;
  }

  async createStaff(staffData) {
    const response = await apiClient.post('/v1/admin/staff', staffData);
    return response.data;
  }

  async updateStaff(id, staffData) {
    const response = await apiClient.put(`/v1/admin/staff/update?id=${id}`, staffData);
    return response.data;
  }

  async deleteStaff(id) {
    const response = await apiClient.delete(`/v1/admin/staff/delete?id=${id}`);
    return response.data;
  }

  // ========== ROLE MANAGEMENT ==========
  async getRoles() {
    const response = await apiClient.get('/v1/admin/roles');
    return response.data;
  }

  async getRole(id) {
    const response = await apiClient.get(`/v1/admin/roles/show?id=${id}`);
    return response.data;
  }

  // ========== SYSTEM CONFIGURATION ==========
  async setConfig(configKey, configValue) {
    const response = await apiClient.post('/v1/admin/config', {
      config_key: configKey,
      config_value: configValue,
    });
    return response.data;
  }

  async getConfig(configKey = null) {
    const url = configKey ? `/v1/admin/config?key=${configKey}` : '/v1/admin/config';
    const response = await apiClient.get(url);
    return response.data;
  }

  // ========== VOUCHER MANAGEMENT ==========
  async createVoucher(voucherData) {
    const response = await apiClient.post('/v1/admin/vouchers', voucherData);
    return response.data;
  }

  async listVouchers(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    
    const response = await apiClient.get(`/v1/admin/vouchers${params.toString() ? '?' + params : ''}`);
    return response.data;
  }

  async getVoucher(id) {
    const response = await apiClient.get(`/v1/admin/vouchers/show?id=${id}`);
    return response.data;
  }

  async updateVoucher(id, voucherData) {
    const response = await apiClient.put(`/v1/admin/vouchers/update?id=${id}`, voucherData);
    return response.data;
  }

  async deleteVoucher(id) {
    const response = await apiClient.delete(`/v1/admin/vouchers/delete?id=${id}`);
    return response.data;
  }
}

export default new AdminService();
