"use client";

import { useState, useEffect } from "react";
import { useLibraryIndex } from "@/hooks/useLibraryIndex";
import LibraryStatusBadge from "./LibraryStatusBadge";

export default function HeroLibraryBadge({ slug }: { slug: string }) {
    const [mounted, setMounted] = useState(false);
    const { library } = useLibraryIndex();

    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return null;
    const status = library[slug];
    if (!status) return null;
    return <LibraryStatusBadge status={status} className="backdrop-blur-sm" />;
}
