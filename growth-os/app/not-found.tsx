import Link from "next/link";
import { Empty } from "@/components/ui";

export default function NotFound() {
  return <div><Empty title="Not in Growth OS" hint="That page, campaign or document does not exist." /><p className="small" style={{ textAlign: "center", marginTop: 10 }}><Link href="/" style={{ color: "var(--info)" }}>Back to Overview</Link></p></div>;
}
