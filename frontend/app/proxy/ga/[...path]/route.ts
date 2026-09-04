import { NextRequest, NextResponse } from "next/server";

const GA_UPSTREAM = "https://www.google-analytics.com";

/** GA's collection endpoints. Anything else is not ours to relay. */
const ALLOWED = new Set(["g/collect", "collect", "j/collect", "mp/collect", "debug/mp/collect"]);

async function proxy(request: NextRequest, path: string[]): Promise<NextResponse> {
    const upstreamPath = "/" + path.join("/");

    if (!ALLOWED.has(path.join("/"))) {
        return new NextResponse(null, { status: 404 });
    }
    const { searchParams } = new URL(request.url);

    /*
     * Whose visit this is, said in the one place GA4 will read it.
     *
     * Geography is derived from the IP that opens the connection, and once a
     * hit is relayed that is this server — so without this every reader in the
     * world files as one datacentre in Germany, which is worse for a report
     * than the readers we were losing. `_uip` / `_uipv6` are what Google's own
     * server-side Tag Manager sends when it forwards to /g/collect for exactly
     * this reason. The X-Forwarded-For header below is not enough on its own;
     * GA does not read it.
     *
     * Not officially documented for this endpoint, so it is verified against
     * Realtime after deploying rather than assumed.
     */
    const clientIp =
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "";

    if (clientIp && !searchParams.has("_uip") && !searchParams.has("_uipv6")) {
        searchParams.set(clientIp.includes(":") ? "_uipv6" : "_uip", clientIp);
    }

    const qs = searchParams.toString();
    const upstreamUrl = `${GA_UPSTREAM}${upstreamPath}${qs ? `?${qs}` : ""}`;
    const userAgent = request.headers.get("user-agent") || "";

    const upstreamHeaders: Record<string, string> = {
        "User-Agent": userAgent,
        "X-Forwarded-For": clientIp || "127.0.0.1",
    };

    // Forward Content-Type for POST requests
    const contentType = request.headers.get("content-type");
    if (contentType) upstreamHeaders["Content-Type"] = contentType;

    const body =
        request.method !== "GET" && request.method !== "HEAD"
            ? await request.arrayBuffer()
            : undefined;

    /*
     * Fire and forget, but it has to actually fire.
     *
     * This used `after()`, and measured on the server it forwarded nothing at
     * all: twenty-five beacons through the relay, sampled every 100ms across
     * both address families, produced **zero** outbound connections from the
     * Next process — while the same request by curl from the same machine got
     * a 204 from Google in sixty milliseconds. The relay answered 204 to every
     * caller the whole time, so from the page, from the log and from this file
     * it looked delivered.
     *
     * That is the failure this endpoint's own comment warns about one
     * paragraph down, arriving through a different door: a beacon that looks
     * sent from every side and reaches nobody.
     *
     * A floating promise instead. The response still goes out first — nothing
     * here is awaited — but the request is started inside the handler, where
     * it is an ordinary pending I/O the process keeps alive, rather than work
     * handed to a lifecycle hook that may never be drained.
     *
     * The catch is not optional: an unhandled rejection in Node takes the
     * process down, and the whole point is that a failed beacon costs nothing.
     * It logs, because the previous silence is what let this run unnoticed.
     */
    void fetch(upstreamUrl, {
        method: request.method,
        headers: upstreamHeaders,
        body: body ? body : undefined,
    }).catch((error) => {
        console.error("[proxy/ga] forward failed:", error instanceof Error ? error.message : error);
    });

    /*
     * Always 204 so the browser does not retry — and never stored. gtag sends
     * small hits by GET, and a cached 204 at the edge would answer the next
     * reader's page view without it ever reaching Google. That failure is
     * completely silent: the beacon looks delivered from every side.
     */
    return new NextResponse(null, {
        status: 204,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    return proxy(request, path);
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    return proxy(request, path);
}
