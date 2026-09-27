import type { Metadata } from "next";
import { getCampaigns } from "@/lib/data";
import { UtmBuilder } from "./UtmBuilder";

export const metadata: Metadata = { title: "UTM Builder" };

export default function UtmPage() {
  const campaigns = getCampaigns().map((c) => ({ id: c.id, name: c.name, example: (c.utm_example.match(/utm_campaign=([^&]+)/) || [])[1] || "", landing: /^https:\/\/techplay\.gg/.test(c.utm_example) ? c.utm_example.split("?")[0] : "" }));
  return <UtmBuilder campaigns={campaigns} />;
}
