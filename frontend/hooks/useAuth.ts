import useSWR from 'swr';
import axios from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const useAuth = ({ middleware, redirectIfAuthenticated }: { middleware?: 'auth' | 'guest', redirectIfAuthenticated?: string } = {}) => {
    const router = useRouter();

    const { data: user, error, mutate } = useSWR('/auth/me', () =>
        axios.get('/auth/me')
            .then(res => {
                // Handle Laravel Resource 'data' wrapper
                return res.data.data || res.data;
            })
            .catch(error => {
                if (error.response?.status !== 409) throw error;
            })
        , {
            shouldRetryOnError: false,
            revalidateOnFocus: false
        });

    const register = async ({ setErrors, setSuccess, ...props }: any) => {
        setErrors([]);
        if (setSuccess) setSuccess(false);

        try {
            const response = await axios.post('/auth/register', props);
            // ApiResponse wraps in {success, message, data}
            const payload = response.data.data || response.data;

            // Redirect to verify email if required - do NOT store token or login user
            if (payload.requires_verification) {
                // Call success callback if provided
                if (setSuccess) setSuccess(true);
                // Redirect to login page with verification status to show the "Verify Email" screen
                const emailEncoded = encodeURIComponent(props.email || '');
                router.push(`/login?verification_required=true&email=${emailEncoded}`);
                return;
            }

            // Only store token and login if no verification required
            if (payload.access_token) {
                localStorage.setItem('token', payload.access_token);
            }
            await mutate();

            // Call success callback if provided
            if (setSuccess) setSuccess(true);
        } catch (error: any) {
            if (error.response?.status !== 422) throw error;

            const responseErrors = error.response.data.errors;
            if (responseErrors) {
                setErrors(Object.values(responseErrors).flat());
            } else {
                setErrors([error.response.data.message || 'An error occurred during registration.']);
            }
        }
    };

    const login = async ({ setErrors, setStatus, setRequiresVerification, email, ...props }: any) => {
        setErrors([]);
        setStatus(null);
        // Note: Don't reset setRequiresVerification here - let the component manage that state

        try {
            const response = await axios.post('/auth/login', { email, ...props });
            // ApiResponse wraps in {success, message, data}
            const payload = response.data.data || response.data;

            // If verification is required, do NOT store token or login user
            if (payload.requires_verification) {
                // Notify the component that verification is required
                if (setRequiresVerification) setRequiresVerification(email);
                return;
            }

            // Only store token and login if verified
            if (payload.access_token) {
                localStorage.setItem('token', payload.access_token);
            }
            await mutate();
        } catch (error: any) {
            if (error.response?.status !== 422) {
                setErrors([error.response?.data?.message || 'Something went wrong.']);
                return;
            }

            const responseErrors = error.response.data.errors;
            if (responseErrors) {
                setErrors(Object.values(responseErrors).flat());
            } else {
                setErrors([error.response.data.message || 'Invalid credentials.']);
            }
        }
    };

    const logout = async () => {
        try {
            await axios.post('/auth/logout');
        } catch (error) {
            console.error("Logout error", error);
        } finally {
            localStorage.removeItem('token');
            mutate(null, false);
            router.push('/login');
        }
    };

    useEffect(() => {
        if (middleware === 'guest' && redirectIfAuthenticated && user) router.push(redirectIfAuthenticated);
        if (middleware === 'auth' && error) logout();
    }, [user, error, middleware, redirectIfAuthenticated, router]);

    const isLoading = !user && !error;
    const isAuthenticated = !!user;

    return {
        user,
        isLoading,
        isAuthenticated,
        register,
        login,
        logout,
    };
};
