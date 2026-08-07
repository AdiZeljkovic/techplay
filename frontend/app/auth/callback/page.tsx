"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth(); // Assuming login method accepts token or we manually set it

    useEffect(() => {
        const token = searchParams.get("token");
        const error = searchParams.get("error");

        if (error) {
            toast.error(decodeURIComponent(error));
            router.push("/login");
            return;
        }

        if (token) {
            // Manually handle login success
            // We might need to expose a method in AuthContext to set token directly
            // Or we can just set the cookie/localstorage and reload/redirect
            try {
                // Option A: If AuthContext exposes a way to set token
                // login(token); 

                // Option B: Manual storage (depends on how AuthContext works)
                localStorage.setItem("token", token);
                // Dispatch event or force context update?
                // Easiest is to redirect to home and let AuthContext pick it up on mount

                toast.success("Successfully logged in with Discord!");

                // Use window.location to force full reload and context initialization if needed
                window.location.href = "/";
            } catch (err) {
                console.error("Login failed", err);
                toast.error("Failed to process login.");
                router.push("/login");
            }
        } else {
            router.push("/");
        }
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white/45">Authenticating with Discord...</p>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuthCallbackContent />
        </Suspense>
    );
}
