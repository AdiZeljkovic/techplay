
import ShopClient from "./ShopClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Shop — Gaming Merchandise & Gear",
    description: "Official TechPlay merchandise, premium gaming gear, and exclusive hardware accessories. Shop hoodies, peripherals, and more.",
    keywords: [
        "techplay shop", "gaming merchandise", "gaming gear", "gaming accessories",
        "gaming hoodies", "gaming peripherals", "techplay merch", "buy gaming products",
    ],
    openGraph: {
        title: "Shop — Gaming Merchandise & Gear",
        description: "Official TechPlay merchandise, premium gaming gear, and exclusive hardware accessories.",
        type: "website",
        url: "https://techplay.gg/shop",
        siteName: "TechPlay",
        // No `images` here on purpose. This named /og-shop.png, a file that has
        // never existed in public/ — so the card went out pointing at a 404 and
        // most readers got no image at all. Omitting the key lets the root
        // layout's default (the one set in the admin) through, which is a real
        // picture. Put a shop-specific card back the day there is one to point at.
        locale: "en_US",
    },
    twitter: {
        card: "summary_large_image",
        title: "Shop — Gaming Merchandise & Gear",
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
