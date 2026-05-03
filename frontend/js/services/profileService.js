import apiClient from './apiClient.js';

class ProfileService {
  async getProfile() {
    const response = await apiClient.get('/v1/profile');
    return response.data;
  }

  async updateProfile(profileData) {
    const response = await apiClient.put('/v1/profile', profileData);
    return response.data;
  }

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post('/v1/profile/avatar', formData);
    return response.data;
  }

  async getAddresses() {
    const response = await apiClient.get('/v1/profile/addresses');
    return response.data;
  }

  async addAddress(addressData) {
    const response = await apiClient.post('/v1/profile/addresses', addressData);
    return response.data;
  }

  async updateAddress(id, addressData) {
    const response = await apiClient.put(`/v1/profile/addresses/${id}`, addressData);
    return response.data;
  }

  async deleteAddress(id) {
    const response = await apiClient.delete(`/v1/profile/addresses/${id}`);
    return response.data;
  }
}

export default new ProfileService();
