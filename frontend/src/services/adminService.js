import apiClient from './apiClient.js';

class AdminService {
  async getStaffList(filters = {}) {
    const response = await apiClient.get('/v1/admin/staff', { params: filters });
    return response.data;
  }

  async getStaffById(id) {
    const response = await apiClient.get('/v1/admin/staff/show', { params: { id } });
    return response.data;
  }

  async createStaff(payload) {
    const response = await apiClient.post('/v1/admin/staff', payload);
    return response.data;
  }

  async updateStaff(id, payload) {
    const response = await apiClient.put('/v1/admin/staff/update', payload, { params: { id } });
    return response.data;
  }

  async deleteStaff(id) {
    const response = await apiClient.delete('/v1/admin/staff/delete', { params: { id } });
    return response.data;
  }

  async getRoles() {
    const response = await apiClient.get('/v1/admin/roles');
    return response.data;
  }

  async getRoleById(id) {
    const response = await apiClient.get('/v1/admin/roles/show', { params: { id } });
    return response.data;
  }

  async setConfig(key, value) {
    const response = await apiClient.post('/v1/admin/config', { key, value });
    return response.data;
  }

  async getConfig(key = null) {
    const params = key ? { key } : {};
    const response = await apiClient.get('/v1/admin/config', { params });
    return response.data;
  }

  async createVoucher(payload) {
    const response = await apiClient.post('/v1/admin/vouchers', payload);
    return response.data;
  }

  async getVouchers(filters = {}) {
    const response = await apiClient.get('/v1/admin/vouchers', { params: filters });
    return response.data;
  }

  async getVoucherById(id) {
    const response = await apiClient.get('/v1/admin/vouchers/show', { params: { id } });
    return response.data;
  }

  async updateVoucher(id, payload) {
    const response = await apiClient.put('/v1/admin/vouchers/update', payload, { params: { id } });
    return response.data;
  }

  async deactivateVoucher(id) {
    const response = await apiClient.delete('/v1/admin/vouchers/delete', { params: { id } });
    return response.data;
  }
}

export default new AdminService();
