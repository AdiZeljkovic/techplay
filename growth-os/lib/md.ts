/** Sections of a markdown document at one heading level (runtime twin of the sync parser). */
export function sectionsOf(md: string, level: 2 | 3): { title: string; body: string }[] {
  const re = new RegExp(`^#{${level}} `);
  const stop = new RegExp(`^#{1,${level}} `);
  const out: { title: string; body: string }[] = [];
  let cur: { title: string; body: string } | null = null;
  for (const l of md.split(/\r?\n/)) {
    if (re.test(l)) { if (cur) out.push(cur); cur = { title: l.replace(re, "").trim(), body: "" }; continue; }
    if (cur && stop.test(l)) { out.push(cur); cur = null; continue; }
    if (cur) cur.body += `${l}\n`;
  }
  if (cur) out.push(cur);
  return out;
}
