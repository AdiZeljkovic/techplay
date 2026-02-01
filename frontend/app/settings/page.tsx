import { Metadata } from "next";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = {
    title: "Settings",
    description: "Manage your TechPlay account settings",
    robots: { index: false, follow: false },
};

export default function SettingsPage() {
    return <SettingsClient />;
}
