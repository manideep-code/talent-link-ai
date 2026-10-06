import axiosInstance from '../utils/axiosInstance';

export const contractService = {
    // 1. UPDATE THIS FUNCTION
    createContract: async (proposalId, contractData) => {
        // OLD (WRONG): axiosInstance.post(`/users/contracts/create/${proposalId}/`, ...
        // NEW (CORRECT):
        const response = await axiosInstance.post(`/contracts/create/${proposalId}/`, contractData);
        return response.data;
    },

    // 2. UPDATE THIS FUNCTION TOO
    getClientContracts: async () => {
        // OLD (WRONG): axiosInstance.get('/users/contracts/');
        // NEW (CORRECT):
        const response = await axiosInstance.get('/contracts/');
        return response.data;
    },

    // Generic contracts fetch with optional query params (search, status, freelancer, client)
    getContracts: async (params = {}) => {
        const response = await axiosInstance.get('/contracts/', { params });
        return response.data;
    },

    updateContract: async (contractId, data) => {
        const response = await axiosInstance.patch(`/contracts/${contractId}/update/`, data);
        return response.data;
    },
    getContract: async (contractId) => {
        const response = await axiosInstance.get(`/contracts/${contractId}/`);
        return response.data;
    },
    
    // If you have updateMilestone, fix that too:
    updateMilestone: async (contractId, milestoneId, status) => {
        const response = await axiosInstance.patch(`/contracts/${contractId}/milestones/${milestoneId}/`, { status });
        return response.data;
    }
};