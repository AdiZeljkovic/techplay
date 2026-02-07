import { Metadata } from "next";
import CookiesClient from "./CookiesClient";

export const metadata: Metadata = {
    title: "Cookie Policy",
    description: "Understand how TechPlay uses cookies and how you can manage your preferences.",
};

export default function CookiesPage() {
    return <CookiesClient />;
}
