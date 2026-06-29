"use client";

import { useLibraryIndex } from "@/hooks/useLibraryIndex";
import LibraryStatusBadge from "./LibraryStatusBadge";

export default function HeroLibraryBadge({ slug }: { slug: string }) {
    const { library } = useLibraryIndex();
    const status = library[slug];
    if (!status) return null;
    return <LibraryStatusBadge status={status} className="backdrop-blur-sm" />;
}
