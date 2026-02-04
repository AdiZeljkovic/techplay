"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

import { User } from "@/types";

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
    const router = useRouter();

    useEffect(() => {
        // Restore auth state from localStorage on mount
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken) {
            setToken(storedToken);

            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    // Verify token in background (don't block UI)
                    verifyToken(storedToken);
                } catch (e) {
                    // Invalid JSON - fetch fresh user data
                    fetchAndSetUser(storedToken);
                }
            } else {
                // Token exists but no cached user - fetch it
                fetchAndSetUser(storedToken);
            }
        }

        setIsLoading(false);
    }, []);

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

