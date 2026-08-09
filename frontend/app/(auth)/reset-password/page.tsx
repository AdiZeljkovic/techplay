import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Reset Password",
    description: "Choose a new password for your TechPlay account",
    robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen" />}>
            <ResetPasswordClient />
        </Suspense>
    );
}
