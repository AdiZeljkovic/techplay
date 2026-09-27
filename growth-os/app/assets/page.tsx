import type { Metadata } from "next";
import { getAssets, getBriefs } from "@/lib/data";
import { AssetsView } from "./AssetsView";

export const metadata: Metadata = { title: "Assets" };

export default function AssetsPage() {
  const briefs = getBriefs();
  return <AssetsView rows={getAssets()} briefIds={Object.keys(briefs)} />;
}
