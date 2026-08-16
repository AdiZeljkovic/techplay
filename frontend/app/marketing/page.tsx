import MarketingClient from "./MarketingClient";
import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/marketing', {
        title: "Advertise with us",
        description: "Advertise on TechPlay — display units, sponsored coverage and giveaways, with editorial kept independent. Rates and formats on request.",
    });
}

export default function MarketingPage() {
    return <MarketingClient />;
}
