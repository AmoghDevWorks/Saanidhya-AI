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

  async listRelationships() {
    const response = await api.get('/api/family/relationships');
    return response.data;
  },

  async listInvitations() {
    const response = await api.get('/api/family/invitations');
    return response.data;
  },

  async inviteFamily(payload) {
    const response = await api.post('/api/family/invitations', payload);
    return response.data;
  },

  async acceptInvitation(token) {
    const response = await api.post('/api/family/invitations/accept', { token });
    return response.data;
  },

  async rejectInvitation(token) {
    await api.post('/api/family/invitations/reject', { token });
  },

  async revokeRelationship(id) {
    await api.delete(`/api/family/relationships/${id}`);
  },

  async updatePermissions(id, permissions) {
    const response = await api.patch(`/api/family/relationships/${id}/permissions`, { permissions });
    return response.data;
  },

  async getFamilyConsent() {
    const response = await api.get('/api/family/consent');
    return response.data;
  },

  async updateFamilyConsent(payload) {
    const response = await api.patch('/api/family/consent', payload);
    return response.data;
  },
};

export default notificationService;
