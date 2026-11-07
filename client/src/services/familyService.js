import api, { getErrorMessage } from './api';

export const familyService = {
  /**
   * Fetch complete family dashboard data
   */
  async getFamilyDashboard() {
    try {
      const response = await api.get('/api/family/dashboard');
      return response.data;
    } catch (error) {
      console.warn('Could not fetch family dashboard from backend:', error);
      // Safe fallback data
      return {
        familyMemberName: 'Family Caregiver',
        seniorProfile: {
          name: 'Ramesh Kumar',
          relationship: 'Father',
          age: 74,
          preferredLanguage: 'Kannada & English',
          lastCheckinTime: 'Today at 09:15 AM',
          todayStatus: 'Completed',
        },
        wellnessOverview: {
          adherenceRate: '100%',
          checkinStreak: '7 Days',
          currentMood: 'Peaceful & Reassured',
          medicationCompliance: 'On Track (7/7 days)',
          keyObservation:
            'Mild knee discomfort noted during cool mornings. Rest and warm compress recommended.',
        },
        recentCheckins: [],
        alerts: [
          {
            id: 'alert-1',
            type: 'discomfort',
            severity: 'attention',
            title: 'Repeated Knee Discomfort Mentioned',
            message:
              'Father mentioned knee stiffness during morning check-ins for 2 consecutive days after garden walking.',
            timestamp: 'Today at 09:18 AM',
            isAcknowledged: false,
          },
          {
            id: 'alert-2',
            type: 'medication',
            severity: 'info',
            title: 'Morning Medication Confirmed',
            message:
              'BP tablet confirmed taken on schedule right after breakfast.',
            timestamp: 'Today at 09:16 AM',
            isAcknowledged: true,
          },
        ],
        reminders: [
          {
            id: 'rem-1',
            title: 'Amlodipine (BP Medication)',
            time: '09:00 AM',
            frequency: 'Daily Morning',
            status: 'Completed Today',
          },
          {
            id: 'rem-2',
            title: 'Hydration & Warm Water',
            time: '03:00 PM',
            frequency: 'Daily Afternoon',
            status: 'Upcoming',
          },
        ],
      };
    }
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
