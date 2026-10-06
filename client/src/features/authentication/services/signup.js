import axiosInstance from '../../../utils/axiosInstance';

export const registerUser = async (userData) => {
    // userData should contain: first_name, last_name, email, password
    const response = await axiosInstance.post('register/', userData);
    return response.data;
};