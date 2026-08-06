"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

import { User } from "@/types";
import { trackD1Return } from "@/lib/track";

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user and store in localStorage
    const fetchAndSetUser = async (authToken: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    Accept: "application/json",
                },
            });

            if (response.ok) {
                const json = await response.json();
                const userData = json.data || json;
                setUser(userData);
                localStorage.setItem("user", JSON.stringify(userData));
            } else {
                // Token invalid - clear everything
                clearAuth();
            }
        } catch (error) {
            console.error("Failed to fetch user:", error);
            // Network error - keep token, maybe try again later
        }
    };

    // Background verification - only updates if there's new data
    const verifyToken = async (authToken: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    Accept: "application/json",
                },
            });

            if (response.ok) {
                const json = await response.json();
                const freshUser = json.data || json;
                // Update with fresh data if available
                setUser(freshUser);
                localStorage.setItem("user", JSON.stringify(freshUser));
            } else if (response.status === 401) {
                // Token is truly invalid - clear auth
                clearAuth();
            }
            // For other errors (network, 500, etc.) - keep using cached user
        } catch (error) {
            // Network error - keep using cached user, don't logout
            console.warn("Could not verify token, using cached user data");
        }
    };

    // Clear auth state
    const clearAuth = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    };

    useEffect(() => {
        // Restore auth state from localStorage on mount
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!storedToken) {
            setIsLoading(false);
            return;
        }

        setToken(storedToken);

        let cached: User | null = null;
        if (storedUser) {
            try {
                cached = JSON.parse(storedUser);
            } catch {
                cached = null;
            }
        }

        if (cached) {
            // A cached user means the page can render immediately; the token is
            // confirmed in the background.
            setUser(cached);
            setIsLoading(false);
            verifyToken(storedToken);
            return;
        }

        // No usable cache, so there is nothing to show until /auth/me answers.
        // isLoading has to stay true across that request: it used to be cleared
        // here, synchronously, which told every gate "loading is done, and there
        // is no user" — and gates that trusted it showed a signed-out screen to
        // a signed-in reader.
        fetchAndSetUser(storedToken).finally(() => setIsLoading(false));
    }, []);

    // Activation funnel: single-shot D1-return marker (accounts 24-48h old)
    useEffect(() => {
        if (user?.created_at) trackD1Return(user.created_at);
    }, [user?.created_at]);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    };

    // Logout - clears auth state
    const logout = () => {
        clearAuth();
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

