"use client";
import { marked } from "marked";
import { useMemo } from "react";

/** Client twin of Markdown for sections that live inside client views. Trusted repo content only. */
export function MarkdownClient({ md }: { md: string }) {
  const html = useMemo(() => marked.parse(md || "", { async: false, gfm: true }) as string, [md]);
  return <div className="md" dangerouslySetInnerHTML={{ __html: html }} />;
}
