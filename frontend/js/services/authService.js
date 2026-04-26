import apiClient from './apiClient.js';

class AuthService {
  async register(userData) {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  }

  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials);
    const body = response.data;
    const data = body.data; // The inner data containing user and token
    
    if (data && data.token) {
      localStorage.setItem('auth_token', data.token);
      this.saveUserInfo(data.user);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    }
    return body; // Return full body for page-level success check
  }

  async forgotPassword(email) {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(payload) {
    const response = await apiClient.post('/auth/reset-password', payload);
    return response.data;
  }

  async verifyEmail(token) {
    const response = await fetch(`${apiClient.defaults.baseURL}/auth/verify?token=${encodeURIComponent(token)}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    let data = {};
    try {
      data = await response.json();
    } catch (error) {
      data = {};
    }

    if (!response.ok) {
      throw new Error(data.message || 'Verification failed.');
    }

    return data;
  }

  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    return response.data; // Note: layout-loader already handles unwrapping this
  }

  async logout() {
    const response = await apiClient.post('/auth/logout');
    localStorage.removeItem('auth_token');
    delete apiClient.defaults.headers.common['Authorization'];
    return response.data;
  }

  async changePassword(passwords) {
    const response = await apiClient.post('/auth/change-password', passwords);
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





