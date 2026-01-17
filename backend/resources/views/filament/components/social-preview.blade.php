<div class="space-y-6">
    {{-- Facebook Preview --}}
    <div>
        <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                    d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook Preview
        </div>
        <div
            class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden max-w-lg">
            @if($image)
                <div class="aspect-[1.91/1] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <img src="{{ $image }}" alt="Preview" class="w-full h-full object-cover">
                </div>
            @else
                <div class="aspect-[1.91/1] bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <span class="text-gray-400">No image</span>
                </div>
            @endif
            <div class="p-3 bg-[#f2f3f5] dark:bg-gray-700">
                <div class="text-[11px] text-gray-500 uppercase tracking-wide">
                    {{ parse_url($url ?? '', PHP_URL_HOST) ?: 'techplay.gg' }}</div>
                <div class="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight mt-1">
                    {{ Str::limit($title ?? 'Title', 65) }}</div>
                <div class="text-[13px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {{ Str::limit($description ?? '', 100) }}</div>
            </div>
        </div>
    </div>

    {{-- Twitter Preview --}}
    <div>
        <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                    d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Twitter / X Preview
        </div>
        <div
            class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-w-lg">
            @if($image)
                <div class="aspect-[2/1] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <img src="{{ $image }}" alt="Preview" class="w-full h-full object-cover">
                </div>
            @endif
            <div class="p-3">
                <div class="text-[15px] font-bold text-gray-900 dark:text-white leading-tight">
                    {{ Str::limit($title ?? 'Title', 70) }}</div>
                <div class="text-[13px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {{ Str::limit($description ?? '', 120) }}</div>
                <div class="text-[13px] text-gray-500 mt-2 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    {{ parse_url($url ?? '', PHP_URL_HOST) ?: 'techplay.gg' }}
                </div>
            </div>
        </div>
    </div>

    {{-- LinkedIn Preview --}}
    <div>
        <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                    d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn Preview
        </div>
        <div
            class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden max-w-lg">
            @if($image)
                <div class="aspect-[1.91/1] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <img src="{{ $image }}" alt="Preview" class="w-full h-full object-cover">
                </div>
            @endif
            <div class="p-3">
                <div class="text-[14px] font-semibold text-gray-900 dark:text-white leading-tight">
                    {{ Str::limit($title ?? 'Title', 70) }}</div>
                <div class="text-[12px] text-gray-500 mt-1">{{ parse_url($url ?? '', PHP_URL_HOST) ?: 'techplay.gg' }}
                </div>
            </div>
        </div>
    </div>
</div>