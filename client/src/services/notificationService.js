import api from './api';

const notificationService = {
  async list() {
    const response = await api.get('/api/notifications');
    return response.data;
  },

  async markRead(id) {
    await api.patch(`/api/notifications/${id}/read`);
  },

  async markAllRead() {
    await api.patch('/api/notifications/read-all');
  },

  async listAlerts() {
    const response = await api.get('/api/alerts');
    return response.data;
  },
};

export default notificationService;
