
import ShopClient from "./ShopClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Shop - TechPlay | Gaming Merchandise & Gear",
    description: "Official TechPlay merchandise, premium gaming gear, and exclusive hardware accessories. Shop hoodies, peripherals, and more.",
    keywords: [
        "techplay shop", "gaming merchandise", "gaming gear", "gaming accessories",
        "gaming hoodies", "gaming peripherals", "techplay merch", "buy gaming products",
    ],
    openGraph: {
        title: "Shop - TechPlay | Gaming Merchandise & Gear",
        description: "Official TechPlay merchandise, premium gaming gear, and exclusive hardware accessories.",
        type: "website",
        url: "https://techplay.gg/shop",
        siteName: "TechPlay",
        images: [{ url: "/og-shop.png", width: 1200, height: 630, alt: "TechPlay Shop" }],
        locale: "en_US",
    },
    twitter: {
        card: "summary_large_image",
        title: "Shop - TechPlay | Gaming Merchandise & Gear",
        description: "Official TechPlay merchandise, premium gaming gear, and exclusive hardware accessories.",
    },
    alternates: {
        canonical: "https://techplay.gg/shop",
    },
    robots: { index: true, follow: true },
};

export default function ShopPage() {
    return <ShopClient />;
}
