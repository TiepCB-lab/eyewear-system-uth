import apiClient from './apiClient.js';

class DashboardService {
  // ========== DASHBOARD ANALYTICS ==========
  async getSummary() {
    const response = await apiClient.get('/dashboard');
    return response.data;
  }

  async getOperationsOverview() {
    const response = await apiClient.get('/dashboard/operations');
    return response.data;
  }

  // ========== OPERATIONS & PRODUCTION ==========
  async getProductionQueue() {
    const response = await apiClient.get('/ops');
    return response.data;
  }

  async advanceProduction(orderId) {
    const response = await apiClient.post('/ops/advance', {
      order_id: orderId,
    });
    return response.data;
  }

  // ========== SHIPMENT MANAGEMENT ==========
  async createShipment(shipmentData) {
    const response = await apiClient.post('/ops/shipments', shipmentData);
    return response.data;
  }

  async updateShipment(shipmentData) {
    const response = await apiClient.put('/ops/shipments', shipmentData);
    return response.data;
  }
}

export default new DashboardService();
