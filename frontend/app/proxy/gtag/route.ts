import { NextRequest, NextResponse } from "next/server";

// Cache the patched gtag.js via Next.js fetch cache
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
        return new NextResponse("Missing id parameter", { status: 400 });
    }

    try {
        const upstream = await fetch(
            `https://www.googletagmanager.com/gtag/js?id=${id}`,
            { next: { revalidate: 3600 } }
        );

        if (!upstream.ok) {
            return new NextResponse("Failed to fetch gtag.js", { status: 502 });
        }

        let script = await upstream.text();

        // Patch all GA4 collect URLs to go through our first-party proxy
        const origin = process.env.NEXT_PUBLIC_APP_URL || "https://techplay.gg";
        script = script.replaceAll(
            "https://www.google-analytics.com",
            `${origin}/proxy/ga`
        );
        script = script.replaceAll(
            "http://www.google-analytics.com",
            `${origin}/proxy/ga`
        );

        return new NextResponse(script, {
            headers: {
                "Content-Type": "application/javascript; charset=utf-8",
                "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch {
        return new NextResponse("Upstream error", { status: 502 });
    }
}
