import apiClient from './apiClient.js';

class ProductService {
    async getProducts(params = {}) {
        const response = await apiClient.get('/products', { params });
        return response.data;
    }

    async getFeaturedProducts() {
        const response = await apiClient.get('/products/featured');
        return response.data;
    }

    async getProduct(id) {
        const response = await apiClient.get(`/products/${id}`);
        return response.data;
    }

    async getRelatedProducts(id, limit = 4) {
        const response = await apiClient.get('/products/related', {
            params: { exclude_id: id, limit }
        });
        return response.data;
    }

    async getCategories() {
        const response = await apiClient.get('/products/categories');
        return response.data;
    }

    async getLenses() {
        const response = await apiClient.get('/products/lenses/available');
        return response.data;
    }

    async getBrands() {
        const response = await apiClient.get('/products/brands');
        return response.data;
    }
}


export default new ProductService();
