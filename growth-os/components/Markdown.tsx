import { marked } from "marked";

// Renders the team's own strategy markdown (trusted, from the repo). Not for
// user-submitted text.
export function Markdown({ md, className }: { md: string; className?: string }) {
  const html = marked.parse(md || "", { async: false, gfm: true }) as string;
  return <div className={`md ${className ?? ""}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
