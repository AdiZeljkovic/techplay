import type { Metadata } from "next";
import { getMeta } from "@/lib/data";
import { getPlanDate } from "@/lib/server-date";
import { integrationStatus } from "@/lib/integrations";
import { ASSIST_ACTIONS, assistConfigured } from "@/lib/ai";
import { SettingsView } from "./SettingsView";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const pd = await getPlanDate();
  return <SettingsView meta={getMeta()} planDate={pd} integrations={integrationStatus()} assist={{ configured: assistConfigured(), actions: ASSIST_ACTIONS }} />;
}
