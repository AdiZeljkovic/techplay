import axios from 'axios';
import toast from 'react-hot-toast';

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

// Request interceptor - add auth token
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Track if we're currently refreshing to avoid loops
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
    refreshSubscribers.forEach((callback) => callback(token));
    refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
    refreshSubscribers.push(callback);
};

// Response interceptor - handle 401 gracefully
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Don't retry for login/register endpoints
            if (originalRequest.url?.includes('/auth/login') ||
                originalRequest.url?.includes('/auth/register')) {
                return Promise.reject(error);
            }

            // Check if user was logged in (had token)
            const hadToken = !!localStorage.getItem('token');

            // If no token existed, user is just a guest - don't redirect
            if (!hadToken) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // Wait for the refresh to complete
                return new Promise((resolve) => {
                    addRefreshSubscriber((token: string) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(axiosInstance(originalRequest));
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Try to refresh the token
                const refreshResponse = await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    }
                );

                const newToken = refreshResponse.data.token;
                localStorage.setItem('token', newToken);

                // Update header and retry original request
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                onRefreshed(newToken);
                isRefreshing = false;

                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // Refresh failed - logout gracefully
                isRefreshing = false;
                localStorage.removeItem('token');

                // Show toast since user WAS logged in
                toast.error('Session expired. Please login again.', { id: 'session-expired' });

                // Redirect to login (user was previously logged in)
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
