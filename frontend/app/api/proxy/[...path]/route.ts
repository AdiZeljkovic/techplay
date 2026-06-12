import { NextRequest, NextResponse } from 'next/server';
import { getServerApiUrl } from '@/lib/api';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    const apiPath = path.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${getServerApiUrl()}/${apiPath}${searchParams ? `?${searchParams}` : ''}`;

    try {
        const res = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 60 },
        });
        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
