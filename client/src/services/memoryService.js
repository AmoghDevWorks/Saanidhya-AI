import api from './api';

const memoryService = {
  async list() {
    const response = await api.get('/api/memory');
    return response.data;
  },

  async update(memoryId, changes) {
    const response = await api.patch(`/api/memory/${memoryId}`, changes);
    return response.data;
  },

  async remove(memoryId) {
    await api.delete(`/api/memory/${memoryId}`);
  },

  async setConsent(enabled) {
    const response = await api.patch('/api/memory/preferences', { enabled });
    return response.data;
  },

  async deleteAll() {
    const response = await api.delete('/api/memory');
    return response.data;
  },
};

export default memoryService;
