'use client';

import { useEffect, useState } from 'react';
import { List } from 'lucide-react';

interface TocItem {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    content: string;
    className?: string;
}

export default function TableOfContents({ content, className = '' }: TableOfContentsProps) {
    const [items, setItems] = useState<TocItem[]>([]);
    const [activeId, setActiveId] = useState<string>('');

    useEffect(() => {
        // Parse headings from HTML content
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const headings = doc.querySelectorAll('h2, h3');

        const tocItems: TocItem[] = [];
        headings.forEach((heading, index) => {
            const id = heading.id || `heading-${index}`;
            tocItems.push({
                id,
                text: heading.textContent || '',
                level: parseInt(heading.tagName[1]),
            });
        });

        setItems(tocItems);
    }, [content]);

    useEffect(() => {
        // Intersection observer for active heading
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: '-100px 0px -66%' }
        );

        items.forEach((item) => {
            const element = document.getElementById(item.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [items]);

    const scrollToHeading = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (items.length < 3) return null; // Don't show TOC for short articles

    return (
        <nav className={`bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)] ${className}`}>
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-[var(--text-primary)]">
                <List className="w-4 h-4 text-[var(--accent)]" />
                Table of Contents
            </div>
            <ul className="space-y-1">
                {items.map((item) => (
                    <li
                        key={item.id}
                        style={{ paddingLeft: `${(item.level - 2) * 12}px` }}
                    >
                        <button
                            onClick={() => scrollToHeading(item.id)}
                            className={`
                text-left text-sm py-1 transition-colors w-full truncate
                ${activeId === item.id
                                    ? 'text-[var(--accent)] font-medium'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }
              `}
                        >
                            {item.text}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
