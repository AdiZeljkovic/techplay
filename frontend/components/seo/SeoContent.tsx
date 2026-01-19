
import { fetchPageSeo } from "@/lib/seo";

interface SeoContentProps {
    path: string;
}

export default async function SeoContent({ path }: SeoContentProps) {
    const seo = await fetchPageSeo(path);

    if (!seo || !seo.seo_text) {
        return null;
    }

    return (
        <section className="bg-[var(--bg-elevated)] border-t border-[var(--border)] py-12 mt-12">
            <div className="container mx-auto px-4">
                <div
                    className="prose prose-invert max-w-none text-[var(--text-secondary)]
                        prose-headings:text-white prose-a:text-[var(--accent)] 
                        prose-strong:text-white"
                    dangerouslySetInnerHTML={{ __html: seo.seo_text }}
                />
            </div>
        </section>
    );
}
