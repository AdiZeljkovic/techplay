import type { Metadata } from "next";
import { getEmail } from "@/lib/data";
import { getPlanDate } from "@/lib/server-date";
import { EmailView } from "./EmailView";

export const metadata: Metadata = { title: "Email" };

export default async function EmailPage() {
  const pd = await getPlanDate();
  return <EmailView data={getEmail()} today={pd.date} />;
}
