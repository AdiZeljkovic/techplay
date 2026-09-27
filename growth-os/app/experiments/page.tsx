import type { Metadata } from "next";
import { getExperiments } from "@/lib/data";
import { ExperimentsView } from "./ExperimentsView";

export const metadata: Metadata = { title: "Experiments" };

export default function ExperimentsPage() {
  return <ExperimentsView rows={getExperiments()} />;
}
