import apiClient from './apiClient.js';

class ProfileService {
  async getProfile() {
    const response = await apiClient.get('/profile');
    return response.data;
  }

  async updateProfile(profileData) {
    const response = await apiClient.put('/profile', profileData);
    return response.data;
  }

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export default new ProfileService();





