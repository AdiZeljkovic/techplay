import axios from 'axios';
import { announceReward } from '@/components/ui/RewardFeed';
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


/**
 * Reset CSRF state (used when token is invalid)
 */
const resetCsrf = () => {
    csrfInitialized = false;
    csrfPromise = null;
};


/**
 * The session is over. Clear it, tell the application (AuthContext listens,
 * so the header stops showing an avatar for a session that no longer exists)
 * and say so once — not once per in-flight request.
 */
function endSession(): void {
    if (typeof window === 'undefined') return;

    removeStorageItem('token');
    removeStorageItem('user');
    window.dispatchEvent(new Event('techplay:session-expired'));
    toast.error('Session expired. Please sign in again.', { id: 'session-expired' });
}

// Response interceptor - handle 401 and 419 (CSRF) errors gracefully
axiosInstance.interceptors.response.use(
    (response) => {
        // The API attaches what a write earned; this is the one place that has
        // to notice, so no caller has to remember to. Everything that pays out
        // used to do it silently and show up on the next page load.
        const rewards = response.data?.rewards;

        if (rewards && typeof rewards === "object") {
            announceReward(rewards);
        }

        return response;
    },
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

        // A 401 with a token in hand means the token is gone — revoked,
        // expired, or logged out in another tab. Refreshing it was never
        // possible: /auth/refresh sits behind the same guard that just
        // refused us, so the old code always fell into its catch, and on the
        // way there it read the wrong field off the response and wrote the
        // string "undefined" into localStorage, which then rode along on
        // every later request as `Bearer undefined`.
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (originalRequest.url?.includes('/auth/login') ||
                originalRequest.url?.includes('/auth/register')) {
                return Promise.reject(error);
            }

            // A guest getting a 401 is simply a guest.
            if (!getStorageItem('token')) {
                return Promise.reject(error);
            }

            originalRequest._retry = true;
            endSession();

            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
