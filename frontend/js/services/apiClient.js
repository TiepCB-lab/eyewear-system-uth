import axios from 'https://cdn.jsdelivr.net/npm/axios@1.6.7/+esm';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (config?.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
  }

  return config;
});

const savedToken = sessionStorage.getItem('auth_token');
if (savedToken) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_info');
      sessionStorage.removeItem('eyewear_cart_count');
      sessionStorage.removeItem('eyewear_wishlist_count');
      delete apiClient.defaults.headers.common['Authorization'];

      const currentPath = window.location.pathname.toLowerCase();
      // Only force redirect if the user is in a protected area
      const isProtectedPage = currentPath.includes('/pages/accounts') || 
                              currentPath.includes('/pages/dashboard') || 
                              currentPath.includes('/pages/checkout') ||
                              currentPath.includes('/pages/cart');
      if (isProtectedPage) {
        window.location.href = '/pages/auth/index.html';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;







