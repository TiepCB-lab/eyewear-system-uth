import apiClient from './apiClient.js';

const orderService = {
    /**
     * Get order history for the current user
     */
    async getMyOrders() {
        try {
            const response = await apiClient.get('/orders');
            return response.data;
        } catch (error) {
            console.error('OrderService getMyOrders Error:', error);
            throw error;
        }
    },

    /**
     * Get full details of a specific order (For Staff - bypass user_id check)
     */
    async getStaffOrderDetail(orderId) {
        try {
            const response = await apiClient.get(`/sales/orders/${orderId}`);
            return response.data;
        } catch (error) {
            console.error('OrderService getStaffOrderDetail Error:', error);
            throw error;
        }
    }
};

export default orderService;
