import axios from "@/lib/axios";

export type FunnelEvent =
    | "wizard_shown"
    | "wizard_steam_click"
    | "wizard_xbox_submitted"
    | "wizard_pick_started"
    | "wizard_pick_done"
    | "wizard_skipped"
    | "checklist_steam_click"
    | "d1_return";

/**
 * Fire-and-forget funnel event: first-party Redis counter (auth-only
 * endpoint) + GA4 event when gtag is present. Never throws, never awaited.
 */
export function track(event: FunnelEvent): void {
    try {
        axios.post("/track/event", { event }).catch(() => { /* ignore */ });
    } catch { /* ignore */ }

    try {
        const gtag = (window as any).gtag;
        if (typeof gtag === "function") {
            gtag("event", event, { event_category: "activation_funnel" });
        }
    } catch { /* ignore */ }
}

/**
 * D1-return marker: fires once when an account created 24–48h ago comes
 * back. localStorage guard keeps it single-shot per browser.
 */
export function trackD1Return(createdAt: string | undefined | null): void {
    if (!createdAt) return;
    try {
        if (localStorage.getItem("tp_d1_tracked") === "1") return;
        const ageMs = Date.now() - new Date(createdAt).getTime();
        const day = 24 * 60 * 60 * 1000;
        if (ageMs >= day && ageMs < 2 * day) {
            localStorage.setItem("tp_d1_tracked", "1");
            track("d1_return");
        } else if (ageMs >= 2 * day) {
            // Too late to ever count — stop checking on every load
            localStorage.setItem("tp_d1_tracked", "1");
        }
    } catch { /* ignore */ }
}
