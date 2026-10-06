import axiosInstance from '../../../utils/axiosInstance';

export const registerUser = async (userData) => {
    const response = await axiosInstance.post('register/', userData);
    return response.data;
};