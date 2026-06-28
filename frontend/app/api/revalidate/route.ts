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
        // Accept both x-revalidate-token (RevalidationService) and Authorization: Bearer (CacheRevalidationService)
        const headerToken = request.headers.get('x-revalidate-token')
            ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null;
        const expectedToken = process.env.REVALIDATE_SECRET_TOKEN;

        if (!expectedToken || headerToken !== expectedToken) {
            return NextResponse.json(
                { error: 'Invalid or missing revalidate token' },
                { status: 401 }
            );
        }

        // 2. Parse request body
        const body = await request.json();
        const { type, slug, category } = body;

        // Handle paths array (sent by CacheRevalidationService::revalidatePaths for GTA6 content)
        if (body.paths && Array.isArray(body.paths)) {
            const paths: string[] = body.paths.filter((p: unknown) => typeof p === 'string');
            for (const path of paths) {
                revalidatePath(path);
            }
            return NextResponse.json({
                success: true,
                revalidated: true,
                paths,
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
                const tagPrefix = category === 'reviews' ? 'review'
                                : category === 'guides' ? 'guide'
                                : category; // news/tech use plural

                // Map category to path (tech uses hardware route)
                const pathPrefix = category === 'tech' ? 'hardware' : category;

                revalidateTag(`${tagPrefix}-${slug}`, { expire: 0 });
                revalidateTag(category, { expire: 0 });

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

            case 'homepage':
                revalidatePath('/');
                return NextResponse.json({
                    success: true,
                    revalidated: true,
                    paths: ['/'],
                    timestamp: new Date().toISOString(),
                });

            case 'category':
                if (!category) {
                    return NextResponse.json(
                        { error: 'Missing "category" parameter' },
                        { status: 400 }
                    );
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
