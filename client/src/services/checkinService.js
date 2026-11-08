import api, { getErrorMessage } from './api';

export const checkinService = {
  async startSession(requestId) {
    const response = await api.post('/api/checkin/start', null, {
      headers: requestId ? { 'X-Request-ID': requestId } : undefined,
    });
    return response.data;
  },

  async transcribe(audioBlob, languageCode = 'indic-auto') {
    const formData = new FormData();
    formData.append('audio', audioBlob, audioBlob.name || 'checkin.ogg');
    formData.append('language_code', languageCode);
    formData.append('model', 'prisma-v3.0');
    formData.append('output_format', 'verbatim');
    const response = await api.post('/api/voice/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async sendMessage(sessionId, transcript, conversation, language) {
    const response = await api.post(`/api/checkin/${sessionId}/message`, {
      transcript,
      conversation,
      language,
    });
    return response.data;
  },

  async synthesize(responseText, language) {
    const response = await api.post('/api/voice/synthesize', {
      response_text: responseText,
      language,
    });
    return response.data;
  },

  async endSession(sessionId) {
    const response = await api.post(`/api/checkin/${sessionId}/end`);
    return response.data;
  },

  /**
   * Fetch today's checkin summary for the senior
   */
  async getTodaySummary() {
    const response = await api.get('/api/checkin/today');
    return response.data;
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
    const response = await api.get('/api/checkin/history');
    return response.data;
  },
};

export default checkinService;
