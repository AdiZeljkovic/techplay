import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact Us - Get in Touch with TechPlay",
    description: "Have a news tip, partnership inquiry, or need technical support? Contact TechPlay via email or our contact form. We respond within 24 hours. Reach our editorial, marketing, or support teams directly.",
    keywords: ["contact TechPlay", "gaming news tip", "advertising gaming", "game review request", "tech partnership"],
    openGraph: {
        title: "Contact TechPlay - News Tips, Partnerships & Support",
        description: "Reach out to TechPlay for news tips, advertising inquiries, partnership opportunities, or technical support.",
        type: "website",
    },
    alternates: {
        canonical: "/contact",
    },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
