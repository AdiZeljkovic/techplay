import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * On-Demand Revalidation API Route
 *
 * Called by Laravel backend after content changes (Article publish/update/delete)
 * Triggers Next.js ISR revalidation for instant content updates
 *
 * Authentication: Shared secret token between backend and frontend
 */

export async function POST(request: NextRequest) {
    try {
        // Verify secret token
        const authHeader = request.headers.get('authorization');
        const secret = process.env.REVALIDATION_SECRET || 'your-secret-token';

        if (authHeader !== `Bearer ${secret}`) {
            return NextResponse.json(
                { message: 'Invalid token' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { type, slug, paths, tags } = body;

        console.log('[Revalidation] Received request:', { type, slug, paths, tags });

        // Revalidate by specific paths
        if (paths && Array.isArray(paths)) {
            for (const path of paths) {
                await revalidatePath(path);
                console.log(`[Revalidation] Revalidated path: ${path}`);
            }
        }

        // Revalidate by tags
        if (tags && Array.isArray(tags)) {
            for (const tag of tags) {
                await revalidateTag(tag);
                console.log(`[Revalidation] Revalidated tag: ${tag}`);
            }
        }

        // Type-based revalidation
        switch (type) {
            case 'article':
            case 'news':
                await revalidatePath('/news');
                await revalidatePath(`/news/${slug}`);
                await revalidatePath('/'); // Home page
                await revalidateTag('news');
                break;

            case 'review':
                await revalidatePath('/reviews');
                await revalidatePath(`/reviews/${slug}`);
                await revalidatePath('/');
                await revalidateTag('reviews');
                break;

            case 'tech':
                await revalidatePath('/hardware');
                await revalidatePath(`/hardware/${slug}`);
                await revalidatePath('/');
                await revalidateTag('tech');
                break;

            case 'guide':
                await revalidatePath('/guides');
                await revalidatePath(`/guides/${slug}`);
                await revalidateTag('guides');
                break;

            case 'video':
                await revalidatePath('/videos');
                await revalidatePath(`/videos/${slug}`);
                await revalidateTag('videos');
                break;

            case 'category':
                // Revalidate navigation tree
                await revalidatePath('/');
                await revalidateTag('navigation');
                break;

            case 'home':
                await revalidatePath('/');
                await revalidateTag('home');
                break;

            default:
                console.warn(`[Revalidation] Unknown type: ${type}`);
        }

        return NextResponse.json({
            revalidated: true,
            type,
            slug,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[Revalidation] Error:', error);
        return NextResponse.json(
            { message: 'Error revalidating', error: String(error) },
            { status: 500 }
        );
    }
}

// Health check endpoint
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        service: 'revalidation',
        timestamp: new Date().toISOString()
    });
}
