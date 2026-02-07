import { Metadata } from "next";
import PrivacyClient from "./PrivacyClient";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "Learn how TechPlay collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
    return <PrivacyClient />;
}
