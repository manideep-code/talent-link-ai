import axiosInstance from '../utils/axiosInstance';
import axios from 'axios';

const getApiBaseUrl = () => {
  // Explicit API URL can still be supplied when needed.
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }

  // GitHub Codespaces:
  // frontend: <codespace>-3000.app.github.dev
  // backend:  <codespace>-8000.app.github.dev
  if (
    typeof window !== 'undefined' &&
    window.location.hostname.endsWith('-3000.app.github.dev')
  ) {
    return `${window.location.protocol}//${window.location.hostname.replace(
      '-3000.app.github.dev',
      '-8000.app.github.dev'
    )}`;
  }

  // Local development fallback.
  return 'http://127.0.0.1:8000';
};

const API_BASE_URL = getApiBaseUrl();

// Create a no-auth axios instance for public endpoints
const noAuthApi = axios.create({
  baseURL: `${API_BASE_URL}/api/`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const profileService = {
  freelancer: {
    getProfile: async () => {
      try {
        const response = await axiosInstance.get('profiles/me/?profile_type=freelancer');
        return response.data;
      } catch (error) {
        console.error('Error fetching freelancer profile:', error);
        throw error;
      }
    },
    createProfile: async (profileData) => {
      try {
        const formData = new FormData();

        Object.keys(profileData).forEach(key => {
          if (profileData[key] !== null && profileData[key] !== undefined) {
            if (key === 'profile_image' || key === 'documents') {
              if (profileData[key] instanceof File) {
                formData.append(key, profileData[key]);
              }
            } else {
              formData.append(key, profileData[key]);
            }
          }
        });
        const response = await axiosInstance.post('profiles/me/?profile_type=freelancer', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
      } catch (error) {
        console.error('Error creating freelancer profile:', error);
        throw error;
      }
    },
    updateProfile: async (profileData) => {
      try {
        const formData = new FormData();

        Object.keys(profileData).forEach(key => {
          if (profileData[key] !== null && profileData[key] !== undefined) {
            if (key === 'profile_image' || key === 'documents') {
              if (profileData[key] instanceof File) {
                formData.append(key, profileData[key]);
              }
            } else {
              formData.append(key, profileData[key]);
            }
          }
        });
        const response = await axiosInstance.patch('profiles/me/?profile_type=freelancer', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
      } catch (error) {
        console.error('Error updating freelancer profile:', error);
        throw error;
      }
    },
    getProfileById: async (id) => {
      try {
        // Updated to use correct endpoint 'profiles/' (plural)
        const response = await noAuthApi.get(`profiles/${id}/`);
        return response.data;
      } catch (error) {
        console.error('Error fetching freelancer profile:', error);
        throw error;
      }
    },

    getProfileByUserId: async (userId) => {
      if (!userId) return null;
      try {
        const response = await axiosInstance.get('profiles/', {
          params: { user_id: userId }
        });
        const data = response.data;
        return Array.isArray(data) ? data[0] || null : data;
      } catch (error) {
        console.error('Error fetching freelancer profile by user:', error);
        throw error;
      }
    },

    listProfiles: async (params = {}) => {
      try {
        const response = await noAuthApi.get('profiles/', { params });
        return response.data;
      } catch (error) {
        console.error('Error listing freelancer profiles:', error);
        throw error;
      }
    },
    deleteProfile: async (id) => {
      try {
        await axiosInstance.delete(`profiles/${id}/`);
      } catch (error) {
        console.error('Error deleting freelancer profile:', error);
        throw error;
      }
    },
  },

  client: {
    getProfile: async () => {
      try {
        const response = await axiosInstance.get('profiles/me/?profile_type=client');
        return response.data;
      } catch (error) {
        console.error('Error fetching client profile:', error);
        throw error;
      }
    },
    createProfile: async (profileData) => {
      try {
        const formData = new FormData();

        Object.keys(profileData).forEach(key => {
          if (profileData[key] !== null && profileData[key] !== undefined) {
            if (key === 'profile_image' || key === 'documents') {
              if (profileData[key] instanceof File) {
                formData.append(key, profileData[key]);
              }
            } else {
              formData.append(key, profileData[key]);
            }
          }
        });
        const response = await axiosInstance.post('profiles/me/?profile_type=client', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
      } catch (error) {
        console.error('Error creating client profile:', error);
        throw error;
      }
    },
    updateProfile: async (profileData) => {
      try {
        const formData = new FormData();

        Object.keys(profileData).forEach(key => {
          if (profileData[key] !== null && profileData[key] !== undefined) {
            if (key === 'profile_image' || key === 'documents') {
              if (profileData[key] instanceof File) {
                formData.append(key, profileData[key]);
              }
            } else {
              formData.append(key, profileData[key]);
            }
          }
        });
        // Changed to patch here too for consistency if needed, but keeping post if existing logic required it
        // But assumed me/ update uses patch.
        const response = await axiosInstance.patch('profiles/me/?profile_type=client', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
      } catch (error) {
        console.error('Error updating client profile:', error);
        throw error;
      }
    },
    getProfileById: async (id) => {
      try {
        // Assuming client profile endpoint might be distinct or same. 
        // If backend does NOT have client profile viewset, this will fail regardless.
        // But for consistency I update syntax.
        const response = await noAuthApi.get(`profiles/client-profile/${id}/`);
        // Leaving client-profile as I am not sure about client structure.
        return response.data;
      } catch (error) {
        console.error('Error fetching client profile:', error);
        throw error;
      }
    },
    getProfileByUserId: async (userId) => {
      if (!userId) return null;
      try {
        const response = await axiosInstance.get('profiles/client-profile/', {
          params: { user_id: userId }
        });
        const data = response.data;
        return Array.isArray(data) ? data[0] || null : data;
      } catch (error) {
        console.error('Error fetching client profile by user:', error);
        throw error;
      }
    },
    listProfiles: async (params = {}) => {
      try {
        const response = await noAuthApi.get('profiles/client-profile/', { params });
        return response.data;
      } catch (error) {
        console.error('Error listing client profiles:', error);
        throw error;
      }
    },
    deleteProfile: async (id) => {
      try {
        await axiosInstance.delete(`profiles/client-profile/${id}/`);
      } catch (error) {
        console.error('Error deleting client profile:', error);
        throw error;
      }
    },
  },
};

export default profileService;
