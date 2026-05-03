import apiClient from './apiClient.js';

const WishlistService = {
    async getWishlist() {
        const response = await apiClient.get('/wishlist');
        return response.data;
    },

    async toggleItem(productId) {
        const response = await apiClient.post('/wishlist/toggle', { product_id: productId });
        return response.data;
    },

    async removeItem(productId) {
        const response = await apiClient.delete('/wishlist/delete', { data: { product_id: productId } });
        return response.data;
    }
};

export default WishlistService;
