import axiosInstance from '../../../utils/axiosInstance';

export const verifyUserOtp = async (email, otp) => {
    const response = await axiosInstance.post('verify-otp/', { 
        email, 
        otp 
    });
    return response.data;
};