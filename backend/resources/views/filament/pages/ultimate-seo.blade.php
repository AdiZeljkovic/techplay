<x-filament-panels::page>
    {{-- Stats Cards --}}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        @php $stats = $this->getStats(); @endphp

        <div class="fi-section rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5 dark:bg-gray-900 dark:ring-white/10">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <x-heroicon-o-document-text class="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <p class="text-2xl font-bold text-gray-950 dark:text-white">{{ $stats['articles'] }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Articles</p>
                </div>
            </div>
        </div>

        <div class="fi-section rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5 dark:bg-gray-900 dark:ring-white/10">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <x-heroicon-o-folder class="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <p class="text-2xl font-bold text-gray-950 dark:text-white">{{ $stats['categories'] }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Categories</p>
                </div>
            </div>
        </div>

        <div class="fi-section rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5 dark:bg-gray-900 dark:ring-white/10">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <x-heroicon-o-arrow-path class="w-5 h-5 text-green-400" />
                </div>
                <div>
                    <p class="text-2xl font-bold text-gray-950 dark:text-white">{{ $stats['redirects'] }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Active Redirects</p>
                </div>
            </div>
        </div>

        <div class="fi-section rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5 dark:bg-gray-900 dark:ring-white/10 {{ $stats['missing_meta'] > 0 ? 'ring-orange-500/50' : '' }}">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg {{ $stats['missing_meta'] > 0 ? 'bg-orange-500/20' : 'bg-gray-500/20' }} flex items-center justify-center">
                    <x-heroicon-o-exclamation-triangle class="w-5 h-5 {{ $stats['missing_meta'] > 0 ? 'text-orange-400' : 'text-gray-400' }}" />
                </div>
                <div>
                    <p class="text-2xl font-bold {{ $stats['missing_meta'] > 0 ? 'text-orange-400' : 'text-gray-950 dark:text-white' }}">{{ $stats['missing_meta'] }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Missing Meta</p>
                </div>
            </div>
        </div>
    </div>

    {{-- Quick Links --}}
    <div class="flex flex-wrap gap-2 mb-6">
        <a href="{{ route('filament.admin.resources.redirects.index') }}" class="fi-btn fi-btn-size-md inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold bg-white text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700 dark:hover:bg-gray-700">
            <x-heroicon-o-arrow-path class="w-4 h-4" />
            Manage Redirects
        </a>
        <a href="{{ config('app.url') }}/sitemap.xml" target="_blank" class="fi-btn fi-btn-size-md inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold bg-white text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700 dark:hover:bg-gray-700">
            <x-heroicon-o-map class="w-4 h-4" />
            View Sitemap
        </a>
        <a href="https://search.google.com/search-console" target="_blank" class="fi-btn fi-btn-size-md inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold bg-white text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700 dark:hover:bg-gray-700">
            <x-heroicon-o-magnifying-glass class="w-4 h-4" />
            Search Console
        </a>
    </div>

    {{-- Main Form --}}
    <form wire:submit="save">
        {{ $this->form }}

        <div class="mt-6 flex justify-end">
            <button type="submit" class="fi-btn fi-btn-size-lg fi-btn-color-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
                Save All SEO Settings
            </button>
        </div>
    </form>
</x-filament-panels::page>