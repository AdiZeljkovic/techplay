import { Metadata } from "next";
import GuidesClientPage from "@/components/guides/GuidesClientPage";

export const metadata: Metadata = {
    title: "Gaming Guides & Tutorials",
    description: "Master your favorite games with our in-depth guides, tips, and strategy walkthroughs.",
};

export default function GuidesPage() {
    return <GuidesClientPage />;
}
