import api from './api';

const reminderService = {
  async list() {
    const response = await api.get('/api/reminders');
    return response.data;
  },
  async create(payload) {
    const response = await api.post('/api/reminders', payload);
    return response.data;
  },
  async update(id, payload) {
    const response = await api.patch(`/api/reminders/${id}`, payload);
    return response.data;
  },
  async remove(id) {
    await api.delete(`/api/reminders/${id}`);
  },
  async complete(id, note) {
    const response = await api.post(`/api/reminders/${id}/complete`, { note });
    return response.data;
  },
  async skip(id, note) {
    const response = await api.post(`/api/reminders/${id}/skip`, { note });
    return response.data;
  },
};

export default reminderService;
