import axiosInstance from '../utils/axiosInstance';

export const matchingService = {
  /**
   * Fetch AI-ranked talent matches for a specific client project.
   * @param {number|string} projectId
   * @param {Object} params - optional query params (min_score, availability, experience, sort_by, limit)
   */
  getTalentMatches: async (projectId, params = {}) => {
    const response = await axiosInstance.get(`projects/${projectId}/talent-matches/`, { params });
    return response.data;
  },

  /**
   * Invite a freelancer to submit a proposal for a project.
   * @param {number|string} projectId
   * @param {number|string} freelancerId
   * @param {string} message
   */
  inviteFreelancer: async (projectId, freelancerId, message = '') => {
    const response = await axiosInstance.post(`projects/${projectId}/invite/`, {
      freelancer_id: freelancerId,
      message,
    });
    return response.data;
  },

  /**
   * Fetch open projects recommended for the authenticated freelancer.
   * @param {Object} params - optional query params (limit)
   */
  getRecommendedProjects: async (params = {}) => {
    const response = await axiosInstance.get('freelancers/me/recommended-projects/', { params });
    return response.data;
  },

  /**
   * Fetch project invitations received by the authenticated freelancer.
   */
  getInvitations: async () => {
    const response = await axiosInstance.get('freelancers/me/invitations/');
    return response.data;
  },
};

export default matchingService;
