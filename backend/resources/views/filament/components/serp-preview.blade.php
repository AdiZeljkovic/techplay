<div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 max-w-xl">
    {{-- Google SERP Preview --}}
    <div class="space-y-1">
        {{-- Title --}}
        <div class="text-[#1a0dab] dark:text-blue-400 text-lg font-medium hover:underline cursor-pointer truncate">
            {{ Str::limit($title ?? 'Page Title', 60) }}
        </div>

        {{-- URL --}}
        <div class="text-[#006621] dark:text-green-400 text-sm truncate">
            {{ $url ?? 'https://techplay.gg/example' }}
        </div>

        {{-- Description --}}
        <div class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            {{ Str::limit($description ?? 'Meta description will appear here...', 160) }}
        </div>
    </div>

    {{-- Character counts --}}
    <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-4 text-xs">
        <span class="{{ strlen($title ?? '') > 60 ? 'text-orange-500' : 'text-gray-500' }}">
            Title: {{ strlen($title ?? '') }}/60
        </span>
        <span class="{{ strlen($description ?? '') > 160 ? 'text-orange-500' : 'text-gray-500' }}">
            Desc: {{ strlen($description ?? '') }}/160
        </span>
    </div>
</div>