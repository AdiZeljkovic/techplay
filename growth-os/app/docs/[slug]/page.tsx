import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDoc } from "@/lib/data";
import { Markdown } from "@/components/Markdown";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: getDoc(slug)?.title ?? "Doc" };
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) notFound();
  const toc = doc.body.split("\n").filter((l) => /^## /.test(l)).map((l) => l.slice(3).trim());
  return (
    <div className="grid split-main">
      <article className="panel panel-body"><p className="small"><Link href="/docs" style={{ color: "var(--info)" }}>← Strategy docs</Link> · <span className="mono muted">{doc.file}</span></p><Markdown md={doc.body} /></article>
      <aside className="panel panel-body hide-sm" style={{ position: "sticky", top: 64 }}>
        <div className="small muted" style={{ marginBottom: 6 }}>Sections</div>
        <ul className="list">{toc.map((t) => <li key={t} className="small">{t}</li>)}</ul>
      </aside>
    </div>
  );
}
