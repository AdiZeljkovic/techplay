import { revalidatePath, revalidateTag } from 'next/cache';
import { after } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * On-demand revalidation endpoint
 * Called by backend (Laravel/Filament) when content is updated
 *
 * Security: Uses secret token to prevent unauthorized cache purging
 *
 * Usage from backend:
 * POST /api/revalidate
 * Headers: { "x-revalidate-token": "YOUR_SECRET_TOKEN" }
 * Body: { "type": "article", "slug": "article-slug", "category": "news" }
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Verify secret token (security)
        //
        // Two headers, because two services used to post here and each picked
        // its own. They were merged into RevalidationService on 18 Aug 2026 and
        // it sends Bearer; x-revalidate-token stays accepted so a queued job
        // written before the merge still lands.
        const headerToken = request.headers.get('x-revalidate-token')
            ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null;
        // Two names for one secret have been in circulation: the backend's
        // .env says REVALIDATE_SECRET_TOKEN, the frontend's said
        // REVALIDATION_SECRET, and this file read only the first — so every
        // purge came back 401 and edited articles never went live.
        const expectedToken = process.env.REVALIDATE_SECRET_TOKEN
            || process.env.REVALIDATION_SECRET;

        if (!expectedToken || headerToken !== expectedToken) {
            return NextResponse.json(
                { error: 'Invalid or missing revalidate token' },
                { status: 401 }
            );
        }

        // 2. Parse request body
        const body = await request.json();
        const { type, slug, category } = body;

        // Handle paths array (sent by RevalidationService::revalidatePaths for GTA6 content)
        // An empty array is truthy, and the backend sends `paths: []` on every
        // article purge — so this branch swallowed the request, revalidated
        // nothing and answered "success".
        if ((Array.isArray(body.paths) && body.paths.length > 0)
            || (Array.isArray(body.tags) && body.tags.length > 0)) {
            const paths: string[] = (body.paths ?? []).filter((p: unknown) => typeof p === 'string');
            const tags: string[] = (body.tags ?? []).filter((t: unknown) => typeof t === 'string');

            for (const path of paths) {
                revalidatePath(path);
            }

            // Tags are what actually reach a dynamic route: revalidatePath does
            // nothing for one, which is why editing a GTA6 character used to
            // change everything except that character's own page.
            for (const tag of tags) {
                revalidateTag(tag, { expire: 0 });
            }

            return NextResponse.json({
                success: true,
                revalidated: true,
                paths,
                tags,
                timestamp: new Date().toISOString(),
            });
        }

        if (!type) {
            return NextResponse.json(
                { error: 'Missing "type" parameter' },
                { status: 400 }
            );
        }

        // 3. Revalidate based on type
        switch (type) {
            case 'article':
            case 'news':
            case 'review':
            case 'tech':
            case 'guide':
                if (!slug || !category) {
                    return NextResponse.json(
                        { error: 'Missing "slug" or "category" for article revalidation' },
                        { status: 400 }
                    );
                }

                // Revalidate cache tags (critical for data fetching)
                // Map category to tag format (some use singular form)
                // The hardware pages tag their data as `tech-*`, and the
                // observer sends category 'hardware', so the tag purge missed.
                const tagPrefix = category === 'reviews' ? 'review'
                                : category === 'guides' ? 'guide'
                                : category === 'hardware' ? 'tech'
                                : category; // news/tech use plural

                // Map category to path (tech uses hardware route)
                const pathPrefix = category === 'tech' ? 'hardware' : category;
                const tagCategory = category === 'hardware' ? 'tech' : category;

                revalidateTag(`${tagPrefix}-${slug}`, { expire: 0 });
                revalidateTag(tagCategory, { expire: 0 });

                // Also revalidate paths (for page-level cache)
                revalidatePath(`/${pathPrefix}/${slug}`);
                revalidatePath(`/${pathPrefix}`);
                revalidatePath('/');

                // Purge Cloudflare cache AFTER response is sent and Next.js cache is settled
                // Using after() to avoid race condition where CF re-caches stale content
                // before executeRevalidates() has finished updating the data cache
                const cloudflareToken = process.env.CLOUDFLARE_API_TOKEN;
                const cloudflareZoneId = process.env.CLOUDFLARE_ZONE_ID;

                if (cloudflareToken && cloudflareZoneId) {
                    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://techplay.gg';
                    const urlsToPurge = [
                        `${baseUrl}/${pathPrefix}/${slug}`,
                        `${baseUrl}/${pathPrefix}`,
                    ];

                    after(async () => {
                        try {
                            const cfRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${cloudflareZoneId}/purge_cache`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${cloudflareToken}`,
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ files: urlsToPurge }),
                            });
                            const cfBody = await cfRes.json();
                            console.log('Cloudflare purge (after):', cfRes.status, JSON.stringify(cfBody));
                        } catch (error) {
                            console.error('Cloudflare cache purge failed:', error);
                        }
                    });
                }

                return NextResponse.json({
                    success: true,
                    revalidated: true,
                    paths: [`/${category}/${slug}`, `/${category}`, '/'],
                    tags: [`${tagPrefix}-${slug}`, category],
                    timestamp: new Date().toISOString(),
                });

            case 'game': {
                if (!slug) {
                    return NextResponse.json(
                        { error: 'Missing "slug" for game revalidation' },
                        { status: 400 }
                    );
                }

                revalidatePath(`/games/${slug}`);
                revalidatePath('/games');

                // /games/[slug] is force-dynamic — the effective cache is Cloudflare,
                // so the edge purge below is what actually makes edits visible.
                const cfToken = process.env.CLOUDFLARE_API_TOKEN;
                const cfZoneId = process.env.CLOUDFLARE_ZONE_ID;

                if (cfToken && cfZoneId) {
                    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://techplay.gg';
                    after(async () => {
                        try {
                            const cfRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${cfZoneId}/purge_cache`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${cfToken}`,
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ files: [`${baseUrl}/games/${slug}`] }),
                            });
                            const cfBody = await cfRes.json();
                            console.log('Cloudflare purge game (after):', cfRes.status, JSON.stringify(cfBody));
                        } catch (error) {
                            console.error('Cloudflare game cache purge failed:', error);
                        }
                    });
                }

                return NextResponse.json({
                    success: true,
                    revalidated: true,
                    paths: [`/games/${slug}`, '/games'],
                    timestamp: new Date().toISOString(),
                });
            }

            case 'home':
            case 'homepage':
                revalidatePath('/');
                return NextResponse.json({
                    success: true,
                    revalidated: true,
                    paths: ['/'],
                    timestamp: new Date().toISOString(),
                });

            case 'navigation':
            case 'category':
                // A navigation purge carries no category of its own: the menus
                // live on every page, so the root layout is what must refresh.
                if (!category) {
                    revalidatePath('/', 'layout');

                    return NextResponse.json({
                        success: true,
                        revalidated: true,
                        paths: ['/'],
                        timestamp: new Date().toISOString(),
                    });
                }
                revalidatePath(`/${category}`);
                return NextResponse.json({
                    success: true,
                    revalidated: true,
                    paths: [`/${category}`],
                    timestamp: new Date().toISOString(),
                });

            default:
                return NextResponse.json(
                    { error: `Unknown revalidation type: ${type}` },
                    { status: 400 }
                );
        }
    } catch (error: any) {
        console.error('Revalidation error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}

// Optional: Allow GET requests to check if the endpoint is working
export async function GET() {
    return NextResponse.json({
        message: 'Revalidate endpoint is active',
        note: 'Use POST with valid token to trigger revalidation',
    });
}
