
import LoginClient from "./LoginClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login",
    description: "Sign in to your TechPlay account",
};

export default function LoginPage() {
    return <LoginClient />;
}
