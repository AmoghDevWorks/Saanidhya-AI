import api, { getErrorMessage } from './api';

export const checkinService = {
  /**
   * Fetch today's checkin summary for the senior
   */
  async getTodaySummary() {
    try {
      const response = await api.get('/api/checkin/today');
      return response.data;
    } catch (error) {
      console.warn('Fallback today summary due to error:', error);
      // Return safe fallback if backend is momentarily unreachable
      return {
        hasCheckedInToday: false,
        todayCheckin: null,
        mood: 'Ready for Morning Check-in',
        medicationStatus: 'Pending Morning Confirmation',
        wellnessNotes: 'Ready for today’s voice conversation with Saanidhya.',
        followUp: 'Press "Talk to Saanidhya" to start your daily check-in.',
        recentCheckins: [],
      };
    }
  },

  /**
   * Save a completed voice check-in
   */
  async saveCheckin(payload) {
    try {
      const response = await api.post('/api/checkin/save', payload);
      return response.data;
    } catch (error) {
      const msg = getErrorMessage(error);
      throw new Error(msg);
    }
  },

  /**
   * Fetch complete conversation history
   */
  async getHistory() {
    try {
      const response = await api.get('/api/checkin/history');
      return response.data;
    } catch (error) {
      console.warn('Could not fetch checkin history from backend:', error);
      return [];
    }
  },
};

export default checkinService;
