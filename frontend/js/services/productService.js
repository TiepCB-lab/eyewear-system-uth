import apiClient from './apiClient.js';

class ProductService {
    async getProducts(params = {}) {
        const response = await apiClient.get('/v1/products', { params });
        return response.data;
    }

    async getProduct(id) {
        const response = await apiClient.get(`/v1/products/${id}`);
        return response.data;
    }

    async getRelatedProducts(id, limit = 4) {
        const response = await apiClient.get('/v1/products/related', {
            params: { exclude_id: id, limit }
        });
        return response.data;
    }

    async getCategories() {
        const response = await apiClient.get('/v1/products/categories');
        return response.data;
    }

    async getLenses() {
        const response = await apiClient.get('/v1/products/lenses/available');
        return response.data;
    }

    async getBrands() {
        const response = await apiClient.get('/v1/products/brands');
        return response.data;
    }
}


export default new ProductService();
