import { after, NextRequest, NextResponse } from "next/server";

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

    // Genuinely fire-and-forget. Awaiting Google before answering the browser
    // meant every page_view held the event loop and a socket open — on a
    // single Node process, that is the first thing to saturate under a spike.
    after(async () => {
        try {
            await fetch(upstreamUrl, {
                method: request.method,
                headers: upstreamHeaders,
                body: body ? body : undefined,
            });
        } catch {
            // upstream errors are not the visitor's problem
        }
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
