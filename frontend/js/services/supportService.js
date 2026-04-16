import apiClient from './apiClient.js';

export const supportService = {
    async getTickets(isStaff = false) {
        try {
            const params = isStaff ? { role: 'staff' } : {};
            const response = await apiClient.get('/v1/support', { params });
            return response.data;
        } catch (error) {
            console.error('Support Service Error:', error);
            throw error;
        }
    },
    
    async createTicket(subject, message) {
        try {
            const response = await apiClient.post('/v1/support', { subject, message });
            return response.data;
        } catch (error) {
            console.error('Support Service Error:', error);
            throw error;
        }
    },
    
    async replyTicket(ticketId, message) {
        try {
            const response = await apiClient.post('/v1/support/reply', { ticket_id: ticketId, message });
            return response.data;
        } catch (error) {
            console.error('Support Service Error:', error);
            throw error;
        }
    }
};

export const salesService = {
    async getPendingOrders() {
        try {
            const response = await apiClient.get('/v1/sales/pending-orders');
            return response.data;
        } catch (error) {
            console.error('Sales Service Error:', error);
            throw error;
        }
    },
    
    async verifyOrder(orderId) {
        try {
            const response = await apiClient.post('/v1/sales/verify', { order_id: orderId });
            return response.data;
        } catch (error) {
            console.error('Sales Service Error:', error);
            throw error;
        }
    }
};






