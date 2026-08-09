import { Suspense } from "react";
import ForgotPasswordClient from "./ForgotPasswordClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Forgot Password",
    description: "Request a password reset link for your TechPlay account",
    robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen" />}>
            <ForgotPasswordClient />
        </Suspense>
    );
}
