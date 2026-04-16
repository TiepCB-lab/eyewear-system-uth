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
}

export default new AuthService();