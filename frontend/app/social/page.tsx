import type { Metadata } from "next";
import SocialClient from "./SocialClient";

export const metadata: Metadata = {
    title: "Social Hub — TechPlay",
    description: "Chat, squad up, and stay connected across TechPlay.",
};

export default function SocialPage() {
    return <SocialClient />;
}
