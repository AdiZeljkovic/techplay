import type { Metadata } from "next";
import BaseClient from "./BaseClient";

export const metadata: Metadata = {
    title: "Clan Base — TechPlay",
    description: "Your clan's base: buildings, construction and the treasury that everything you play feeds.",
};

export default async function ClanBasePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return <BaseClient slug={slug} />;
}
