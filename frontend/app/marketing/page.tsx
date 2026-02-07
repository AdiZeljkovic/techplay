import MarketingClient from "./MarketingClient";
import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/marketing', {
        title: "Advertise with us",
        description: "Reach a passionate audience in the world of technology and gaming.",
    });
}

export default function MarketingPage() {
    return <MarketingClient />;
}
