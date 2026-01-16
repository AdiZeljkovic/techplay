<x-filament-panels::page>
    {{-- Stats Cards --}}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        @php $stats = $this->getStats(); @endphp

        <div class="bg-white/5 rounded-xl p-4 border border-white/10">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <x-heroicon-o-document-text class="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <p class="text-2xl font-bold text-white">{{ $stats['articles'] }}</p>
                    <p class="text-sm text-gray-400">Articles</p>
                </div>
            </div>
        </div>

        <div class="bg-white/5 rounded-xl p-4 border border-white/10">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <x-heroicon-o-folder class="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <p class="text-2xl font-bold text-white">{{ $stats['categories'] }}</p>
                    <p class="text-sm text-gray-400">Categories</p>
                </div>
            </div>
        </div>

        <div class="bg-white/5 rounded-xl p-4 border border-white/10">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <x-heroicon-o-arrow-path class="w-5 h-5 text-green-400" />
                </div>
                <div>
                    <p class="text-2xl font-bold text-white">{{ $stats['redirects'] }}</p>
                    <p class="text-sm text-gray-400">Active Redirects</p>
                </div>
            </div>
        </div>

        <div
            class="bg-white/5 rounded-xl p-4 border border-white/10 {{ $stats['missing_meta'] > 0 ? 'border-orange-500/50' : '' }}">
            <div class="flex items-center gap-3">
                <div
                    class="w-10 h-10 rounded-lg {{ $stats['missing_meta'] > 0 ? 'bg-orange-500/20' : 'bg-gray-500/20' }} flex items-center justify-center">
                    <x-heroicon-o-exclamation-triangle
                        class="w-5 h-5 {{ $stats['missing_meta'] > 0 ? 'text-orange-400' : 'text-gray-400' }}" />
                </div>
                <div>
                    <p class="text-2xl font-bold {{ $stats['missing_meta'] > 0 ? 'text-orange-400' : 'text-white' }}">
                        {{ $stats['missing_meta'] }}</p>
                    <p class="text-sm text-gray-400">Missing Meta</p>
                </div>
            </div>
        </div>
    </div>

    {{-- Quick Links --}}
    <div class="flex flex-wrap gap-2 mb-6">
        <a href="{{ route('filament.admin.resources.redirects.index') }}"
            class="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-gray-300 border border-white/10 transition-all">
            <x-heroicon-o-arrow-path class="w-4 h-4" />
            Manage Redirects
        </a>
        <a href="{{ config('app.url') }}/sitemap.xml" target="_blank"
            class="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-gray-300 border border-white/10 transition-all">
            <x-heroicon-o-map class="w-4 h-4" />
            View Sitemap
        </a>
        <a href="https://search.google.com/search-console" target="_blank"
            class="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-gray-300 border border-white/10 transition-all">
            <x-heroicon-o-magnifying-glass class="w-4 h-4" />
            Google Search Console
        </a>
    </div>

    {{-- Main Form with Tabs --}}
    <form wire:submit="save">
        {{ $this->form }}

        <div class="mt-6 flex justify-end">
            <x-filament::button type="submit" size="lg">
                Save All SEO Settings
            </x-filament::button>
        </div>
    </form>
</x-filament-panels::page>