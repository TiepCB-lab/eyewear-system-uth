import apiClient from './apiClient.js';

export const paymentService = {
    async processPayment(orderId, method, amount = null) {
        try {
            const body = { order_id: orderId, method: method };
            if (amount) body.amount = amount;
            
            const response = await apiClient.post('/v1/payments/process', body);
            return response.data;
        } catch (error) {
            console.error('Payment Error:', error);
            throw error;
        }
    }
};






