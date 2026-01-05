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

    const register = async ({ setErrors, ...props }: any) => {
        setErrors([]);

        try {
            const response = await axios.post('/auth/register', props);
            if (response.data.access_token) {
                localStorage.setItem('token', response.data.access_token);
            }
            await mutate();

            // Redirect to verify email if required
            if (response.data.requires_verification) {
                router.push('/verify-email');
                return;
            }
        } catch (error: any) {
            if (error.response?.status !== 422) throw error;
            setErrors(Object.values(error.response.data.errors).flat());
        }
    };

    const login = async ({ setErrors, setStatus, ...props }: any) => {
        setErrors([]);
        setStatus(null);

        try {
            const response = await axios.post('/auth/login', props);
            if (response.data.access_token) {
                localStorage.setItem('token', response.data.access_token);
            }
            await mutate();

            // Redirect to verify email if not verified
            if (response.data.requires_verification) {
                router.push('/verify-email');
                return;
            }
        } catch (error: any) {
            if (error.response?.status !== 422) {
                // Handle invalid credentials which might return 422 or plain text
                setErrors([error.response?.data?.message || 'Something went wrong.']);
                return;
            }
            setErrors(Object.values(error.response.data.errors).flat());
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

    return {
        user,
        isLoading,
        register,
        login,
        logout,
    };
};
