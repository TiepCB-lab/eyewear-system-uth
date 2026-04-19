import apiClient from './apiClient.js';

export const paymentService = {
    /**
     * Customer: Chọn phương thức và xử lý thanh toán
     */
    async processPayment(orderId, method, amount = null) {
        try {
            const body = { order_id: orderId, method: method };
            if (amount !== null) body.amount = amount;
            
            const response = await apiClient.post('/v1/payments/process', body);
            return response.data;
        } catch (error) {
            console.error('Payment processPayment Error:', error);
            throw error;
        }
    },

    /**
     * Staff: Xác nhận đã nhận tiền thủ công (Bank Transfer / COD)
     */
    async confirmPayment(paymentId) {
        try {
            const response = await apiClient.post('/v1/payments/confirm', { payment_id: paymentId });
            return response.data;
        } catch (error) {
            console.error('Payment confirmPayment Error:', error);
            throw error;
        }
    },

    /**
     * Lấy thông tin thanh toán của một đơn hàng
     */
    async getPaymentByOrder(orderId) {
        try {
            const response = await apiClient.get('/v1/payments/status', { params: { order_id: orderId } });
            return response.data;
        } catch (error) {
            console.error('Payment getPaymentByOrder Error:', error);
            throw error;
        }
    },

    /**
     * Lấy danh sách thanh toán đang chờ xác nhận (Staff)
     */
    async getPendingPayments() {
        try {
            const response = await apiClient.get('/v1/payments/pending');
            return response.data;
        } catch (error) {
            console.error('Payment getPendingPayments Error:', error);
            throw error;
        }
    }
};

export default paymentService;
