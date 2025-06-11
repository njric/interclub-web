import axios from 'axios';

const API_URL = 'http://localhost:8000';

// Configure axios defaults
axios.defaults.headers.common['Accept'] = 'application/json';

// Add interceptor to include auth token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Fight {
  id: string;
  fight_number: number;
  fighter_a: string;
  fighter_a_club: string;
  fighter_b: string;
  fighter_b_club: string;
  weight_class: number;
  duration: number;
  fight_type: string;
  expected_start: string;
  actual_start: string | null;
  actual_end: string | null;
  is_completed: boolean;
}

export interface FightCreate {
  fighter_a: string;
  fighter_a_club: string;
  fighter_b: string;
  fighter_b_club: string;
  weight_class: number;
  duration: number;
  fight_type: string;
  position?: number;
}

export interface FightUpdate {
  fighter_a?: string;
  fighter_a_club?: string;
  fighter_b?: string;
  fighter_b_club?: string;
  weight_class?: number;
  duration?: number;
  fight_type?: string;
  is_completed?: boolean;
}

const api = {
  // Auth endpoints
  login: async (username: string, password: string): Promise<{ token: string }> => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await axios.post(`${API_URL}/auth/login`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

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

  // Get next fights
  getNextFights: async (limit: number = 5): Promise<Fight[]> => {
    const response = await axios.get(`${API_URL}/fights/next?limit=${limit}`);
    return response.data;
  },

  // Get past fights
  getPastFights: async (limit: number = 10): Promise<Fight[]> => {
    const response = await axios.get(`${API_URL}/fights/past?limit=${limit}`);
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

  // Cancel a fight
  cancelFight: async (fightId: string): Promise<Fight> => {
    try {
      const response = await axios.post(`${API_URL}/fights/${fightId}/cancel`, null, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update fight number
  updateFightNumber: async (fightId: string, newNumber: number): Promise<Fight[]> => {
    try {
      const response = await axios.patch(`${API_URL}/fights/${fightId}/number/${newNumber}`, null, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Set start time for first fight
  setStartTime: async (startTime: string): Promise<{ message: string }> => {
    const response = await axios.post(`${API_URL}/fights/start-time`, {
      start_time: startTime,
    });
    return response.data;
  },

  // Add a new fight
  addFight: async (fight: FightCreate): Promise<Fight> => {
    try {
      const response = await axios.post(`${API_URL}/fights/add`, fight, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update an existing fight
  updateFight: async (fightId: string, fight: FightUpdate): Promise<Fight> => {
    try {
      const response = await axios.patch(`${API_URL}/fights/${fightId}`, fight, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Delete a fight
  deleteFight: async (fightId: string): Promise<void> => {
    try {
      await axios.delete(`${API_URL}/fights/${fightId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
    } catch (error: any) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  },
};

export default api;
