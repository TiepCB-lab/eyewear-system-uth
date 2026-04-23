import apiClient from './apiClient.js';

const WishlistService = {
    async getWishlist() {
        const response = await apiClient.get('/v1/wishlist');
        return response.data;
    },

    async toggleItem(productId) {
        const response = await apiClient.post('/v1/wishlist/toggle', { product_id: productId });
        return response.data;
    },

    async removeItem(productId) {
        const response = await apiClient.delete('/v1/wishlist/delete', { data: { product_id: productId } });
        return response.data;
    }
};

export default WishlistService;
