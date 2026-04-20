import axios from 'https://cdn.jsdelivr.net/npm/axios@1.6.7/+esm';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

const savedToken = localStorage.getItem('auth_token');
if (savedToken) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      delete apiClient.defaults.headers.common['Authorization'];

      const currentPath = window.location.pathname.toLowerCase();
      const isAuthPage = currentPath.includes('/pages/auth/');
      if (!isAuthPage) {
        window.location.href = '/frontend/pages/auth/index.html';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;






