import type { Metadata } from "next";
import { getPr } from "@/lib/data";
import { PrView } from "./PrView";

export const metadata: Metadata = { title: "PR" };

export default function PrPage() {
  return <PrView rows={getPr()} />;
}
