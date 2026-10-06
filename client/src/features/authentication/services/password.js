import axiosInstance from '../../../utils/axiosInstance';

export const resetPasswordConfirm = async (email, otp, newPassword) => {
    const response = await axiosInstance.post('reset-password/', {
        email,
        otp,
        new_password: newPassword
    });
    return response.data;
};