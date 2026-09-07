import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, setUnauthorizedHandler } from '@/lib/api';
import { clearToken, getToken, setToken } from '@/lib/session';

/**
 * Who is signed in, for the whole app.
 *
 * The web restores a session by reading localStorage and then verifying in
 * the background. The same shape works here with one difference that matters:
 * a Sanctum token lasts seven days, and an app opened on the eighth day would
 * throw its reader back to a login screen for no reason they can see. So the
 * launch path refreshes rather than merely verifying, and a phone that is
 * opened at least weekly stays signed in indefinitely.
 */

export interface User {
    id: number;
    username: string;
    display_name?: string | null;
    email?: string;
    avatar_url?: string | null;
    xp?: number;
    level?: number;
    rank?: { name: string; color: string } | null;
}

interface LoginResult {
    access_token: string | null;
    token_type?: string;
    user?: User;
    requires_verification: boolean;
}

interface AuthValue {
    user: User | null;
    /** True until the stored session has been checked — screens wait on this. */
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ requiresVerification: boolean }>;
    signOut: () => Promise<void>;
    refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    /** Called by the API client the moment the server refuses the token. */
    const endSession = useCallback(() => {
        setUser(null);
    }, []);

    useEffect(() => {
        setUnauthorizedHandler(endSession);

        return () => setUnauthorizedHandler(null);
    }, [endSession]);

    const refresh = useCallback(async () => {
        try {
            const me = await api<User>('/auth/me');
            setUser(me);
        } catch {
            // A 401 has already cleared the token through the client. Any
            // other failure — no signal on launch, the API down — must not
            // sign anybody out: the token is still good and the next screen
            // that needs it will try again.
            setUser((current) => current);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const token = await getToken();

            if (!token) {
                if (!cancelled) { setLoading(false); }

                return;
            }

            /*
             * Refresh first, then read the account.
             *
             * Refreshing pushes the seven-day expiry out on every launch, so
             * the only way to be logged out is to not open the app for a
             * week. If the refresh fails the token may still be valid — the
             * network may simply be down — so it is not treated as fatal and
             * /auth/me is tried anyway.
             */
            try {
                const renewed = await api<{ access_token?: string }>('/auth/refresh', { method: 'POST' });

                if (renewed?.access_token) {
                    await setToken(renewed.access_token);
                }
            } catch {
                // Fall through: the stored token gets its chance below.
            }

            await refresh();

            if (!cancelled) { setLoading(false); }
        })();

        return () => { cancelled = true; };
    }, [refresh]);

    const signIn = useCallback(async (email: string, password: string) => {
        const result = await api<LoginResult>('/auth/login', {
            method: 'POST',
            auth: false,
            body: { email, password },
        });

        /*
         * An unverified account gets no token, by design — the API answers
         * 200 with `access_token: null` and a message. Treating that as a
         * failure would show "something went wrong" to somebody whose only
         * problem is an unopened email.
         */
        if (!result.access_token) {
            return { requiresVerification: result.requires_verification };
        }

        await setToken(result.access_token);
        setUser(result.user ?? null);

        if (!result.user) {
            await refresh();
        }

        return { requiresVerification: false };
    }, [refresh]);

    const signOut = useCallback(async () => {
        try {
            await api('/auth/logout', { method: 'POST' });
        } catch {
            // The server may be unreachable, or the token already dead.
            // Neither should keep somebody signed in on their own phone.
        }

        await clearToken();
        setUser(null);
    }, []);

    const value = useMemo<AuthValue>(
        () => ({ user, loading, signIn, signOut, refresh }),
        [user, loading, signIn, signOut, refresh]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider');
    }

    return context;
}
