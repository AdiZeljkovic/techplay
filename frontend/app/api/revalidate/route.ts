import { revalidatePath, revalidateTag } from 'next/cache';
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
        const token = request.headers.get('x-revalidate-token');
        const expectedToken = process.env.REVALIDATE_SECRET_TOKEN;

        if (!expectedToken || token !== expectedToken) {
            return NextResponse.json(
                { error: 'Invalid or missing revalidate token' },
                { status: 401 }
            );
        }

        // 2. Parse request body
        const body = await request.json();
        const { type, slug, category } = body;

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

                // Revalidate specific article page
                revalidatePath(`/${category}/${slug}`);

                // Revalidate category listing
                revalidatePath(`/${category}`);

                // Revalidate homepage (in case article is featured)
                revalidatePath('/');

                // Revalidate by tag (if using tag-based caching)
                revalidateTag(category);
                revalidateTag(`${category}-${slug}`);

                return NextResponse.json({
                    success: true,
                    revalidated: true,
                    paths: [`/${category}/${slug}`, `/${category}`, '/'],
                    tags: [category, `${category}-${slug}`],
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
