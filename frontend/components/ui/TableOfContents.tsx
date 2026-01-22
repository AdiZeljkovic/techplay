"use client";

import { TOCItem } from "@/lib/content";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils"; // Assuming you have a utils file for merging classes

interface TableOfContentsProps {
    items: TOCItem[];
}

export default function TableOfContents({ items }: TableOfContentsProps) {
    const [activeId, setActiveId] = useState<string>("");

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: "0% 0% -80% 0%" }
        );

        items.forEach((item) => {
            const element = document.getElementById(item.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [items]);

    if (items.length < 2) return null;

    return (
        <div className="bg-[#0f172a] border border-blue-800/30 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
            <h3 className="font-bold text-lg text-white mb-4">Table of Contents</h3>
            <nav className="flex flex-col space-y-2">
                {items.map((item) => (
                    <a
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={(e) => {
                            e.preventDefault();
                            document.querySelector(`#${item.id}`)?.scrollIntoView({
                                behavior: "smooth",
                            });
                        }}
                        className={cn(
                            "text-sm py-1 transition-colors block",
                            item.level === 3 ? "pl-4" : "",
                            activeId === item.id
                                ? "text-[var(--accent)] font-bold"
                                : "text-gray-300 hover:text-white"
                        )}
                    >
                        {item.text.replace(/&quot;/g, '"')}
                    </a>
                ))}
            </nav>
        </div>
    );
}
