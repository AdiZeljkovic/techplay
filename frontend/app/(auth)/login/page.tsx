import { Suspense } from "react";
import LoginClient from "./LoginClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login",
    description: "Sign in to your TechPlay account",
    robots: { index: false, follow: false },
};

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen" />}>
            <LoginClient />
        </Suspense>
    );
}
