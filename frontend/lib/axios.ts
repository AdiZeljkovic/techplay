import axios from 'axios';
import toast from 'react-hot-toast';

// Base API URL (without /api/v1 suffix for CSRF cookie endpoint)
// Derive from NEXT_PUBLIC_API_URL if NEXT_PUBLIC_API_BASE_URL is not set
const getApiBase = (): string => {
    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
        return process.env.NEXT_PUBLIC_API_BASE_URL;
    }
    // Strip /api/v1 from API URL to get base URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    return apiUrl.replace(/\/api\/v\d+$/, '');
};

const API_BASE = getApiBase();

const axiosInstance = axios.create({
    baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, ''),
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

// CSRF token cache - avoid multiple requests
let csrfInitialized = false;
let csrfPromise: Promise<void> | null = null;

/**
 * Get CSRF cookie from Laravel Sanctum
 * This must be called before making stateful POST/PUT/PATCH/DELETE requests
 */
export const getCsrfCookie = async (): Promise<void> => {
    if (csrfInitialized) return;

    // If already fetching, wait for it
    if (csrfPromise) return csrfPromise;

    csrfPromise = (async () => {
        try {
            await axios.get(`${API_BASE}/sanctum/csrf-cookie`, {
                withCredentials: true,
            });
            csrfInitialized = true;
        } catch (error) {
            console.warn('Failed to get CSRF cookie:', error);
            // Don't throw - let the actual request handle the error
        } finally {
            csrfPromise = null;
        }
    })();

    return csrfPromise;
};

/**
 * Get XSRF token from cookies
 */
const getXsrfToken = (): string | null => {
    if (typeof document === 'undefined') return null;

    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    if (match) {
        // URL decode the token (Laravel encodes it)
        return decodeURIComponent(match[1]);
    }
    return null;
};

// Helper to safely access localStorage (SSR-safe)
const getStorageItem = (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
};

const setStorageItem = (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, value);
    } catch {
        // Ignore storage errors
    }
};

const removeStorageItem = (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(key);
    } catch {
        // Ignore storage errors
    }
};

// Request interceptor - add auth token and XSRF token
axiosInstance.interceptors.request.use(async (config) => {
    // Add Bearer token if available
    const token = getStorageItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // For non-GET requests, ensure CSRF cookie is set and add XSRF token
    if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
        // Get CSRF cookie if not already initialized
        await getCsrfCookie();

        const xsrfToken = getXsrfToken();
        if (xsrfToken) {
            config.headers['X-XSRF-TOKEN'] = xsrfToken;
        }
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

/**
 * Reset CSRF state (used when token is invalid)
 */
const resetCsrf = () => {
    csrfInitialized = false;
    csrfPromise = null;
};

// Response interceptor - handle 401 and 419 (CSRF) errors gracefully
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle CSRF token mismatch (419) - refresh CSRF and retry once
        if (error.response?.status === 419 && !originalRequest._csrfRetry) {
            originalRequest._csrfRetry = true;
            resetCsrf();

            try {
                // Get fresh CSRF cookie
                await getCsrfCookie();

                // Update XSRF token in header
                const xsrfToken = getXsrfToken();
                if (xsrfToken) {
                    originalRequest.headers['X-XSRF-TOKEN'] = xsrfToken;
                }

                // Retry the original request
                return axiosInstance(originalRequest);
            } catch (csrfError) {
                console.error('CSRF refresh failed:', csrfError);
                return Promise.reject(error);
            }
        }

        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Don't retry for login/register endpoints
            if (originalRequest.url?.includes('/auth/login') ||
                originalRequest.url?.includes('/auth/register')) {
                return Promise.reject(error);
            }

            // Check if user was logged in (had token)
            const hadToken = !!getStorageItem('token');

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
                            Authorization: `Bearer ${getStorageItem('token')}`,
                        },
                    }
                );

                const newToken = refreshResponse.data.token;
                setStorageItem('token', newToken);

                // Update header and retry original request
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                onRefreshed(newToken);
                isRefreshing = false;

                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // Refresh failed - clear token gracefully
                isRefreshing = false;
                removeStorageItem('token');

                // Show toast so user knows their session expired
                toast.error('Session expired. Please login again.', { id: 'session-expired' });

                // Don't redirect - let user stay on current page and choose to login

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
