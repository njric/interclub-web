import axios from 'axios';

const API_URL = 'http://localhost:8000';

// Configure axios defaults
axios.defaults.headers.common['Accept'] = 'application/json';

export interface Fight {
  id: string;
  fighter_a: string;
  fighter_b: string;
  duration: number;
  expected_start: string;
  actual_start: string | null;
  actual_end: string | null;
  is_completed: boolean;
}

const api = {
  // Get all fights
  getFights: async (): Promise<Fight[]> => {
    const response = await axios.get(`${API_URL}/fights`);
    return response.data;
  },

  // Get ongoing fight
  getOngoingFight: async (): Promise<Fight | null> => {
    const response = await axios.get(`${API_URL}/fights/ongoing`);
    return response.data;
  },

  // Get ready fight
  getReadyFight: async (): Promise<Fight | null> => {
    const response = await axios.get(`${API_URL}/fights/ready`);
    return response.data;
  },

  // Start a fight
  startFight: async (fightId: string): Promise<Fight> => {
    const response = await axios.post(`${API_URL}/fights/${fightId}/start`);
    return response.data;
  },

  // End a fight
  endFight: async (fightId: string): Promise<Fight> => {
    const response = await axios.post(`${API_URL}/fights/${fightId}/end`);
    return response.data;
  },

  // Reset a fight
  resetFight: async (fightId: string): Promise<Fight> => {
    const response = await axios.post(`${API_URL}/fights/${fightId}/reset`);
    return response.data;
  },

  // Import fights from CSV
  importFights: async (file: File): Promise<{ imported: number }> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/fights/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Clear all fights
  clearAllFights: async (): Promise<{ message: string }> => {
    const response = await axios.delete(`${API_URL}/fights`);
    return response.data;
  },

  // Cancel a fight (move to end of schedule)
  cancelFight: async (fightId: string): Promise<Fight> => {
    const response = await axios.post(`${API_URL}/fights/${fightId}/cancel`);
    return response.data;
  },
};

export default api;
