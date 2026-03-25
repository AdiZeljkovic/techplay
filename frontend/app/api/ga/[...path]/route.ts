import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const GA_UPSTREAM = "https://www.google-analytics.com";

async function proxy(request: NextRequest, path: string[]): Promise<NextResponse> {
    const upstreamPath = "/" + path.join("/");
    const { searchParams } = new URL(request.url);
    const qs = searchParams.toString();
    const upstreamUrl = `${GA_UPSTREAM}${upstreamPath}${qs ? `?${qs}` : ""}`;

    // Forward real client IP and User-Agent so GA4 doesn't attribute everything to the server
    const clientIp =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";

    const upstreamHeaders: Record<string, string> = {
        "User-Agent": userAgent,
        "X-Forwarded-For": clientIp,
    };

    // Forward Content-Type for POST requests
    const contentType = request.headers.get("content-type");
    if (contentType) upstreamHeaders["Content-Type"] = contentType;

    const body =
        request.method !== "GET" && request.method !== "HEAD"
            ? await request.arrayBuffer()
            : undefined;

    try {
        await fetch(upstreamUrl, {
            method: request.method,
            headers: upstreamHeaders,
            body: body ? body : undefined,
        });
    } catch {
        // Fire-and-forget — don't expose upstream errors to the client
    }

    // Always return 204 so the browser doesn't retry
    return new NextResponse(null, { status: 204 });
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
