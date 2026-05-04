import apiClient from './apiClient.js';

/**
 * Support Ticket Service - Dành cho Customer
 */
export const supportService = {
    /**
     * Lấy danh sách ticket (Customer: của mình, Staff: tất cả open)
     */
    async getTickets(isStaff = false, userId = null) {
        try {
            const params = {};
            if (isStaff) {
                params.role = 'staff';
            } else if (userId) {
                params.user_id = userId;
            }
            const response = await apiClient.get('/support', { params });
            return response.data;
        } catch (error) {
            console.error('Support getTickets Error:', error);
            throw error;
        }
    },

    /**
     * Lấy chi tiết 1 ticket kèm toàn bộ thread reply
     */
    async getTicketById(ticketId) {
        try {
            const response = await apiClient.get(`/support/${ticketId}`);
            return response.data;
        } catch (error) {
            console.error('Support getTicketById Error:', error);
            throw error;
        }
    },

    /**
     * Khách hàng tạo ticket mới
     */
    async createTicket(subject, message, orderId = null) {
        try {
            const body = { subject, message };
            if (orderId) body.order_id = orderId;
            const response = await apiClient.post('/support', body);
            return response.data;
        } catch (error) {
            console.error('Support createTicket Error:', error);
            throw error;
        }
    },

    /**
     * User hoặc Staff gửi reply vào ticket
     */
    async replyTicket(ticketId, message, userId = null) {
        try {
            const body = { ticket_id: ticketId, message };
            if (userId) body.user_id = userId;
            const response = await apiClient.post('/support/reply', body);
            return response.data;
        } catch (error) {
            console.error('Support replyTicket Error:', error);
            throw error;
        }
    },

    /**
     * Staff cập nhật trạng thái ticket
     */
    async updateTicketStatus(ticketId, status) {
        try {
            const response = await apiClient.post('/support/status', {
                ticket_id: ticketId,
                status: status
            });
            return response.data;
        } catch (error) {
            console.error('Support updateTicketStatus Error:', error);
            throw error;
        }
    }
};

/**
 * Sales Service - Dành cho Staff
 */
export const salesService = {
    /**
     * Lấy danh sách đơn hàng (mặc định là pending, nhưng có thể lọc)
     */
    async getOrders(filters = {}) {
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.search) params.append('search', filters.search);
            
            const response = await apiClient.get(`/sales/orders${params.toString() ? '?' + params : ''}`);
            return response.data;
        } catch (error) {
            console.error('Sales getOrders Error:', error);
            throw error;
        }
    },

    /**
     * Cập nhật thông số độ cận cho một item
     */
    async updateOrderPrescription(orderItemId, data) {
        try {
            const response = await apiClient.put('/sales/prescription', {
                order_item_id: orderItemId,
                ...data
            });
            return response.data;
        } catch (error) {
            console.error('Sales updateOrderPrescription Error:', error);
            throw error;
        }
    },

    /**
     * Staff xác minh đơn hàng chuyển qua production
     */
    async verifyOrder(orderId) {
        try {
            const response = await apiClient.post('/sales/verify', { order_id: orderId });
            return response.data;
        } catch (error) {
            console.error('Sales verifyOrder Error:', error);
            throw error;
        }
    },

    /**
     * Staff xử lý khiếu nại: đổi trả, bảo hành, hoàn tiền
     */
    async processComplaint(orderId, type, reason) {
        try {
            const response = await apiClient.post('/sales/complaint', {
                order_id: orderId,
                type: type,
                reason: reason
            });
            return response.data;
        } catch (error) {
            console.error('Sales processComplaint Error:', error);
            throw error;
        }
    }
};

export default supportService;
