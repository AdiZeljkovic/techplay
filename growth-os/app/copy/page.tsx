import type { Metadata } from "next";
import { getCopy } from "@/lib/data";
import { CopyLibrary } from "./CopyLibrary";

export const metadata: Metadata = { title: "Copy Library" };

export default function CopyPage() {
  const rows = getCopy().map((c) => ({ ...c, label: c.label.slice(0, 200) }));
  return <CopyLibrary rows={rows} />;
}
