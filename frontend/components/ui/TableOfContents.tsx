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
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 sticky top-24">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">Table of Contents</h3>
            <nav className="flex flex-col space-y-1">
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
                            "text-sm py-1 transition-colors border-l-2 pl-3",
                            item.level === 3 ? "ml-3" : "",
                            activeId === item.id
                                ? "border-[var(--accent)] text-[var(--accent)] font-medium"
                                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border)]"
                        )}
                    >
                        {item.text}
                    </a>
                ))}
            </nav>
        </div>
    );
}
