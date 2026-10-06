import axiosInstance from '../../../utils/axiosInstance';
import { performLogout } from '../../../utils/logout';

export const loginUser = async (email, password) => {
    try {
        // Backend routes for authentication live under `users/` (e.g. /api/users/login/)
        const response = await axiosInstance.post('users/login/', {
            email,
            password,
        });

        if (response.data.access) {
            // Store tokens securely
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            localStorage.setItem('user_email', email); // Optional: store user info
            if (response.data.role) {
                localStorage.setItem('role', response.data.role);
            }

            const nameFromResponse =
                response.data.username ||
                response.data.name ||
                `${response.data.first_name || ""} ${response.data.last_name || ""}`.trim();

            if (nameFromResponse) {
                localStorage.setItem('user_name', nameFromResponse);
            }
        }

        return response.data;
    } catch (error) {
        // Return a clean error message
        throw error.response ? error.response.data : { detail: "Network Error" };
    }
};

export const logoutUser = () => performLogout();

export const loginWithGoogle = async ({ idToken, role } = {}) => {
    try {
        const payload = { id_token: idToken };
        if (role) {
            payload.role = role;
        }

        const response = await axiosInstance.post('users/google-auth/', payload);

        if (response.data.access) {
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);

            const emailFromResponse = response.data.email || '';
            if (emailFromResponse) {
                localStorage.setItem('user_email', emailFromResponse);
            }

            if (response.data.role) {
                localStorage.setItem('role', response.data.role);
            }

            const nameFromResponse =
                response.data.name ||
                `${response.data.first_name || ""} ${response.data.last_name || ""}`.trim();

            if (nameFromResponse) {
                localStorage.setItem('user_name', nameFromResponse);
            }

            if (response.data.avatar) {
                localStorage.setItem('user_avatar', response.data.avatar);
            }
        }

        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : { detail: 'Network Error' };
    }
};