import { Metadata } from "next";
import ComingSoonClient from "./ComingSoonClient";

export const metadata: Metadata = {
    title: "Coming Soon",
    description: "This feature is coming soon to TechPlay. Stay tuned!",
};

export default function ComingSoonPage() {
    return <ComingSoonClient />;
}
