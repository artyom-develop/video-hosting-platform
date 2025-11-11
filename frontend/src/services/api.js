import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  // Token is now stored in httpOnly cookies, so no need to add it manually
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Remove automatic redirect on 401 - let components handle auth logic
    // if (error.response?.status === 401) {
    //   localStorage.removeItem('token');
    //   window.location.href = '/login';
    // }
    return Promise.reject(error);
  }
);

export default api;

// Channel API functions
export const channelAPI = {
  getMyChannel: () => api.get('/channels/my'),
  updateChannel: (channelId, data) => api.put(`/channels/${channelId}`, data),
  regenerateStreamKey: (channelId) => api.post(`/channels/${channelId}/regenerate-stream-key`),
};

// RTMP API functions
export const rtmpAPI = {
  validateStreamKey: (streamKey) => api.get(`/rtmp/validate-key?stream_key=${streamKey}`),
};
