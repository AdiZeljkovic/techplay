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
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-lg backdrop-blur-sm">
            <h4 className="flex items-center gap-3 text-sm font-bold text-white uppercase tracking-wider mb-6">
                <div className="w-1.5 h-6 bg-[#ff4500]" />
                On this page
            </h4>
            <nav>
                <ul className="flex flex-col space-y-3">
                    {items.map((item) => (
                        <li key={item.id} className={item.level === 3 ? "pl-4" : ""}>
                            <a
                                href={`#${item.id}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.querySelector(`#${item.id}`)?.scrollIntoView({
                                        behavior: "smooth",
                                    });
                                }}
                                className="flex items-start gap-3 group"
                            >
                                <span
                                    className={cn(
                                        "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 transition-colors",
                                        activeId === item.id
                                            ? "bg-[#ff4500]"
                                            : "bg-gray-600 group-hover:bg-gray-400"
                                    )}
                                />
                                <span
                                    className={cn(
                                        "text-sm transition-colors leading-relaxed",
                                        activeId === item.id
                                            ? "text-white font-bold"
                                            : "text-gray-400 group-hover:text-white"
                                    )}
                                >
                                    {item.text.replace(/&quot;/g, '"')}
                                </span>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
}
