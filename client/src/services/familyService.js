import api, { getErrorMessage } from './api';

export const familyService = {
  /**
   * Fetch complete family dashboard data
   */
  async getFamilyDashboard() {
    const response = await api.get('/api/family/dashboard');
    return response.data;
  },

  /**
   * Mark an alert as acknowledged
   */
  async acknowledgeAlert(alertId) {
    try {
      const response = await api.post(`/api/family/alerts/${alertId}/acknowledge`);
      return response.data;
    } catch (error) {
      const msg = getErrorMessage(error);
      throw new Error(msg);
    }
  },

  /**
   * Create a new reminder for the senior
   */
  async createReminder(payload) {
    try {
      const response = await api.post('/api/family/reminders', payload);
      return response.data;
    } catch (error) {
      const msg = getErrorMessage(error);
      throw new Error(msg);
    }
  },
};

export default familyService;
