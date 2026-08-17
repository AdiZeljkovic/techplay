import * as Sentry from "@sentry/nextjs";

/**
 * Server-side error reporting for the Next process.
 *
 * The backend has its own SDK; this covers what fails inside Next itself —
 * a server component that throws, a route handler that blows up, an ISR
 * regeneration that fails in the background. Those never reach Laravel's log,
 * and until now they reached nothing but pm2's stdout.
 *
 * Receiver is the self-hosted GlitchTip at glitchtip.techplay.gg. Reasoning for
 * the disabled options is in instrumentation-client.ts and applies here too.
 */
export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
        Sentry.init({
            dsn: process.env.NEXT_PUBLIC_GLITCHTIP_DSN,
            enabled:
                process.env.NODE_ENV === "production" &&
                !!process.env.NEXT_PUBLIC_GLITCHTIP_DSN,
            tracesSampleRate: 0,
        });
    }
}

/**
 * Next hands every server-side render error here.
 *
 * Without this the SDK sees only what it can hook globally, and an error inside
 * a server component — the most common way a page breaks — is not that. This is
 * the difference between "the page 500s sometimes" and knowing which component
 * and which line.
 */
export const onRequestError = Sentry.captureRequestError;
