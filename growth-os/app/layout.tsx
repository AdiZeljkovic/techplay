import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Shell } from "@/components/Shell";
import { ToastProvider } from "@/components/Toast";
import { StateProvider } from "@/lib/state/client";
import { getPlanDate } from "@/lib/server-date";
import { PLAN_END, PLAN_START, diffDays, fmt, isoWeek } from "@/lib/dates";

export const metadata: Metadata = {
  title: { default: "Growth OS · TechPlay", template: "%s · Growth OS" },
  description: "Internal growth command center for TechPlay.gg",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Theme is a per-viewer convenience kept in localStorage; this runs before paint to avoid a flash.
const themeScript = `try{var t=localStorage.getItem('gos-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const pd = await getPlanDate();
  const dayN = diffDays(PLAN_START, pd.date) + 1;
  const total = diffDays(PLAN_START, PLAN_END) + 1;
  const label = { main: fmt(pd.date, { weekday: "short", day: "numeric", month: "short" }), rest: ` 2026 · day ${dayN}/${total} · W${isoWeek(pd.date)}` };
  const notice = pd.clamped === "before"
    ? `The plan starts ${fmt(PLAN_START)}; today is ${fmt(pd.real)}. Showing the first plan day.`
    : pd.clamped === "after"
      ? `The Q4 plan ended ${fmt(PLAN_END)}. Showing the last plan day; see the 2027 bridge in Strategy docs.`
      : pd.overridden
        ? `Viewing the plan as of ${fmt(pd.date)} (date override in Settings).`
        : undefined;
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="gos-theme" strategy="beforeInteractive">{themeScript}</Script>
        <ToastProvider>
          <StateProvider>
            <Shell planDate={pd.date} planLabel={label} notice={notice}>{children}</Shell>
          </StateProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
