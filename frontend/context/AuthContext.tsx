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

        if (storedToken && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setToken(storedToken);
                setUser(parsedUser);

                // Optionally verify token in background (don't block UI)
                verifyToken(storedToken, parsedUser);
            } catch (e) {
                // Invalid JSON in localStorage, clear it
                clearAuth();
            }
        }

        setIsLoading(false);
    }, []);

    // Background verification - only updates if there's new data
    const verifyToken = async (authToken: string, cachedUser: User) => {
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

