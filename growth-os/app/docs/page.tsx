import type { Metadata } from "next";
import Link from "next/link";
import { getDocs } from "@/lib/data";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Strategy docs" };

export default function DocsIndex() {
  const docs = getDocs();
  return (
    <div>
      <PageHeader title="Strategy docs" sub="The Phase 2 plan, rendered from docs/techplay-growth/strategy. Growth OS is built from these; edit the files, not this page." />
      <div className="cards">
        {docs.map((d) => (
          <Link key={d.slug} href={`/docs/${d.slug}`} className="card">
            <span className="mono small muted">{d.file}</span>
            <span className="card-title">{d.title}</span>
            <span className="small muted">{Math.round(d.body.length / 1000)}k characters</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
