import HardwareSlugClient from "./HardwareSlugClient";
import { Metadata } from "next";
import { HARDWARE_CATEGORIES } from "@/lib/categories";

type Props = {
    params: Promise<{ category: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { category: slug } = await params;
    const categoryDef = HARDWARE_CATEGORIES.find(c => c.slug === slug);

    if (categoryDef) {
        return {
            title: `${categoryDef.label} - Hardware Lab`,
            description: `Latest ${categoryDef.label} reviews and benchmarks.`,
        };
    }

    // For articles, metadata will be handled client-side or we could fetch here
    // For now, return default
    return {
        title: "Hardware Lab - TechPlay",
        description: "In-depth hardware reviews and benchmarks.",
    };
}

export default async function HardwareSlugPage({ params }: Props) {
    const { category: slug } = await params;
    return <HardwareSlugClient slug={slug} />;
}
