
import MarketingClient from "./MarketingClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Advertise with us",
    description: "Reach a passionate audience in the world of technology and gaming.",
};

export default function MarketingPage() {
    return <MarketingClient />;
}
