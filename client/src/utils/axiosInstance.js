
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/';
const REFRESH_URL = `${API_BASE_URL}users/token/refresh/`;

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

let isRefreshing = false;
const refreshQueue = [];

const clearSessionAndRedirect = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
};

const processQueue = (error, token = null) => {
    refreshQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });
    refreshQueue.length = 0;
};

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;
        const originalRequest = error.config;

        if (status !== 401 || originalRequest?._retry) {
            return Promise.reject(error);
        }

        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            clearSessionAndRedirect();
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                refreshQueue.push({ resolve, reject });
            })
                .then((token) => {
                    if (token) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    return axiosInstance(originalRequest);
                })
                .catch((queueError) => Promise.reject(queueError));
        }

        isRefreshing = true;

        try {
            const refreshResponse = await axios.post(REFRESH_URL, { refresh: refreshToken });
            const newAccessToken = refreshResponse.data?.access;

            if (!newAccessToken) {
                throw new Error('Refresh token response missing access token');
            }

            localStorage.setItem('access_token', newAccessToken);
            axiosInstance.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
            processQueue(null, newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axiosInstance(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            clearSessionAndRedirect();
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default axiosInstance;