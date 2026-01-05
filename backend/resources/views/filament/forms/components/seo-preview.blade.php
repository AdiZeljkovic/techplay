<div x-data="{
    state: $wire.entangle('{{ $getStatePath() }}'),
    title: $wire.entangle('data.seo_title'),
    defaultTitle: $wire.entangle('data.title'),
    description: $wire.entangle('data.seo_description'),
    defaultDescription: $wire.entangle('data.excerpt'),
    url: 'https://techplay.gg/news/example-slug',
    
    get displayTitle() {
        return this.title || this.defaultTitle || 'Page Title';
    },
    get displayDescription() {
        return this.description || this.defaultDescription || 'Start writing to see how your page will look in search engine results. This snippet preview updates in real-time.';
    }
}" class="mt-4 p-4 border rounded-lg bg-white dark:bg-gray-800">
    <div class="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Google Search Preview</div>

    <div class="font-sans">
        <div class="flex items-center gap-2 text-sm text-[#202124] dark:text-[#dadce0]">
            <div class="bg-gray-200 dark:bg-gray-700 rounded-full w-4 h-4 overflow-hidden">
                <img src="/favicon.ico" class="w-full h-full object-cover opacity-60" alt=""
                    onerror="this.style.display='none'">
            </div>
            <div class="flex flex-col leading-tight">
                <span class="text-xs">TechPlay.gg</span>
                <span class="text-xs text-gray-500 dark:text-gray-400" x-text="url"></span>
            </div>
        </div>

        <h3 class="text-xl text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer truncate mt-1"
            x-text="displayTitle">
        </h3>

        <div class="text-sm text-[#4d5156] dark:text-[#bdc1c6] mt-1 max-w-2xl break-words" x-text="displayDescription">
        </div>
    </div>
</div>