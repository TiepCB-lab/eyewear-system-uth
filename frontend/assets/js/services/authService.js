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
    const user = JSON.parse(localStorage.getItem('user_info') || '{}');
    return user.roles || [];
  }

  // Kiểm tra xem User có quyền Staff không
  isStaff() {
    const staffRoles = ['system_admin', 'manager', 'sales_staff', 'operations_staff'];
    const userRoles = this.getUserRoles();
    return userRoles.some(role => staffRoles.includes(role));
  }

  hasRole(roleName) {
    return this.getUserRoles().includes(roleName);
  }

  saveUserInfo(user) {
    localStorage.setItem('user_info', JSON.stringify(user));
  }
}

export default new AuthService();





