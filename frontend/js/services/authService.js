import apiClient from './apiClient.js';

class AuthService {
  async register(userData) {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  }

  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      this.saveUserInfo(response.data.user);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    }
    return response.data;
  }

  async forgotPassword(email) {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(payload) {
    const response = await apiClient.post('/auth/reset-password', payload);
    return response.data;
  }

  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }

  async logout() {
    const response = await apiClient.post('/auth/logout');
    localStorage.removeItem('auth_token');
    delete apiClient.defaults.headers.common['Authorization'];
    return response.data;
  }

  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  }

  getToken() {
    return localStorage.getItem('auth_token');
  }

  // Lấy danh sách Roles từ dữ liệu đã lưu (nếu có)
  getUserRoles() {
    const userJson = localStorage.getItem('user_info');
    if (!userJson) return [];
    try {
      const user = JSON.parse(userJson);
      // Support both array and single string
      if (Array.isArray(user.roles)) return user.roles;
      if (user.role) return [user.role];
    } catch (e) {
      console.error("Error parsing user roles", e);
    }
    return [];
  }

  getStaffRoles() {
    return ['system_admin', 'manager', 'sales_staff', 'operations_staff'];
  }

  // Kiểm tra xem User có quyền Staff không
  isStaff() {
    const staffRoles = this.getStaffRoles();
    const userRoles = this.getUserRoles();
    return userRoles.some(role => staffRoles.includes(role));
  }

  // Kiểm tra xem User có quyền Customer không
  isCustomer() {
    return this.getUserRoles().includes('customer');
  }

  // Determine which side of the app the user belongs to primarily
  getPrimaryContext() {
    if (this.isStaff()) return 'staff';
    if (this.isCustomer()) return 'customer';
    return 'guest';
  }

  hasRole(roleName) {
    return this.getUserRoles().includes(roleName);
  }

  saveUserInfo(user) {
    localStorage.setItem('user_info', JSON.stringify(user));
  }
}

export default new AuthService();





