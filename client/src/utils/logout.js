import userService from '../services/userService';

const clearStoredSession = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('role');
};

export const performLogout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');

    try {
        if (refreshToken) {
            await userService.logout(refreshToken);
        }
        return { success: true };
    } catch (error) {
        console.error('Logout request failed', error.response?.data || error.message);
        return { success: false, error };
    } finally {
        clearStoredSession();
    }
};

export default performLogout;
