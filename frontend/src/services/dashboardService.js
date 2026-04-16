import apiClient from './apiClient.js';

class DashboardService {
  async getSummary() {
    const response = await apiClient.get('/v1/dashboard');
    return response.data;
  }

  async getOperationsOverview() {
    const response = await apiClient.get('/v1/dashboard/operations');
    return response.data;
  }

  async getProductionQueue() {
    const response = await apiClient.get('/v1/ops');
    return response.data;
  }

  async advanceProduction(orderId) {
    const response = await apiClient.post('/v1/ops/advance', { order_id: orderId });
    return response.data;
  }

  async createShipment(payload) {
    const response = await apiClient.post('/v1/ops/shipments', payload);
    return response.data;
  }

  async updateShipment(payload) {
    const response = await apiClient.put('/v1/ops/shipments', payload);
    return response.data;
  }
}

export default new DashboardService();
