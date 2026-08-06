import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import axios from '@/lib/axios';
import { useAuth as useAuthContext } from '@/context/AuthContext';

/**
 * Sign-in, sign-up and sign-out, over the one auth state.
 *
 * This used to be a second, independent auth system: it kept its own copy of
 * the user in an SWR cache off /auth/me while AuthContext kept another in
 * localStorage. Two sources meant two answers — the header could show a
 * signed-in reader while a page reading the context showed "sign in", which is
 * exactly what happened on the Social Hub.
 *
 * Worse, its login() wrote only `token` to localStorage and never `user`, so
 * the context had nothing cached and had to re-fetch /auth/me on every page
 * load before it could say who you were.
 *
 * It now reads and writes AuthContext and holds no state of its own. The
 * returned surface is unchanged, so its callers did not have to move.
 */
export const useAuth = (
    { middleware, redirectIfAuthenticated }: { middleware?: 'auth' | 'guest'; redirectIfAuthenticated?: string } = {},
) => {
    const router = useRouter();
    const { user, isLoading, login: setSession, logout: clearSession } = useAuthContext();

    const register = async ({ setErrors, setSuccess, ...props }: any) => {
        setErrors([]);
        if (setSuccess) setSuccess(false);

        try {
            const response = await axios.post('/auth/register', props);
            // ApiResponse wraps in {success, message, data}
            const payload = response.data.data || response.data;

            // Verification pending: no session yet, the email link creates it.
            if (payload.requires_verification) {
                if (setSuccess) setSuccess(true);
                const emailEncoded = encodeURIComponent(props.email || '');
                router.push(`/login?verification_required=true&email=${emailEncoded}`);
                return;
            }

            if (payload.access_token && payload.user) {
                setSession(payload.access_token, payload.user);
            }

            if (setSuccess) setSuccess(true);
        } catch (error: any) {
            if (error.response?.status !== 422) throw error;

            const responseErrors = error.response.data.errors;
            setErrors(
                responseErrors
                    ? Object.values(responseErrors).flat()
                    : [error.response.data.message || 'An error occurred during registration.'],
            );
        }
    };

    const login = async ({ setErrors, setStatus, setRequiresVerification, email, ...props }: any) => {
        setErrors([]);
        setStatus(null);
        // Note: Don't reset setRequiresVerification here - let the component manage that state

        try {
            const response = await axios.post('/auth/login', { email, ...props });
            const payload = response.data.data || response.data;

            // If verification is required, do NOT start a session
            if (payload.requires_verification) {
                if (setRequiresVerification) setRequiresVerification(email);
                return;
            }

            // The response carries the user alongside the token, so the session
            // is complete from the first moment and nothing has to go and ask
            // who this is afterwards.
            if (payload.access_token) {
                setSession(payload.access_token, payload.user);
            }
        } catch (error: any) {
            if (error.response?.status !== 422) {
                setErrors([error.response?.data?.message || 'Something went wrong.']);
                return;
            }

            const responseErrors = error.response.data.errors;
            setErrors(
                responseErrors
                    ? Object.values(responseErrors).flat()
                    : [error.response.data.message || 'Invalid credentials.'],
            );
        }
    };

    const logout = async () => {
        try {
            await axios.post('/auth/logout');
        } catch (error) {
            // The server may already have dropped the token; the local session
            // goes either way.
            console.error('Logout error', error);
        } finally {
            clearSession();
            router.push('/login');
        }
    };

    useEffect(() => {
        // Nothing is decided until the session has finished restoring.
        // Redirecting on a null user mid-restore signed people out of their own
        // pages, which is the same mistake the Social Hub gate was making.
        if (isLoading) return;

        if (middleware === 'guest' && redirectIfAuthenticated && user) {
            router.push(redirectIfAuthenticated);
        }

        if (middleware === 'auth' && !user) {
            router.push('/login');
        }
    }, [user, isLoading, middleware, redirectIfAuthenticated, router]);

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        register,
        login,
        logout,
    };
};
