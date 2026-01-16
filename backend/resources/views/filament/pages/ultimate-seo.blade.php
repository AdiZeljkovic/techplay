<x-filament-panels::page>
    {{-- Stats Cards --}}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        @php $stats = $this->getStats(); @endphp

        <x-filament::section class="!p-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <x-heroicon-o-document-text class="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <p class="text-2xl font-bold">{{ $stats['articles'] }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Articles</p>
                </div>
            </div>
        </x-filament::section>

        <x-filament::section class="!p-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <x-heroicon-o-folder class="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <p class="text-2xl font-bold">{{ $stats['categories'] }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Categories</p>
                </div>
            </div>
        </x-filament::section>

        <x-filament::section class="!p-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <x-heroicon-o-arrow-path class="w-5 h-5 text-green-400" />
                </div>
                <div>
                    <p class="text-2xl font-bold">{{ $stats['redirects'] }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Active Redirects</p>
                </div>
            </div>
        </x-filament::section>

        <x-filament::section class="!p-4 {{ $stats['missing_meta'] > 0 ? 'ring-2 ring-orange-500/50' : '' }}">
            <div class="flex items-center gap-3">
                <div
                    class="w-10 h-10 rounded-lg {{ $stats['missing_meta'] > 0 ? 'bg-orange-500/20' : 'bg-gray-500/20' }} flex items-center justify-center">
                    <x-heroicon-o-exclamation-triangle
                        class="w-5 h-5 {{ $stats['missing_meta'] > 0 ? 'text-orange-400' : 'text-gray-400' }}" />
                </div>
                <div>
                    <p class="text-2xl font-bold {{ $stats['missing_meta'] > 0 ? 'text-orange-400' : '' }}">
                        {{ $stats['missing_meta'] }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Missing Meta</p>
                </div>
            </div>
        </x-filament::section>
    </div>

    {{-- Quick Links --}}
    <div class="flex flex-wrap gap-2 mb-6">
        <x-filament::link href="{{ route('filament.admin.resources.redirects.index') }}" icon="heroicon-o-arrow-path">
            Manage Redirects
        </x-filament::link>
        <x-filament::link href="{{ config('app.url') }}/sitemap.xml" target="_blank" icon="heroicon-o-map">
            View Sitemap
        </x-filament::link>
        <x-filament::link href="https://search.google.com/search-console" target="_blank"
            icon="heroicon-o-magnifying-glass">
            Google Search Console
        </x-filament::link>
    </div>

    {{-- Main Form --}}
    <x-filament-panels::form wire:submit="save">
        {{ $this->form }}

        <x-filament-panels::form.actions :actions="[
        \Filament\Actions\Action::make('save')
            ->label('Save All SEO Settings')
            ->submit('save')
            ->color('primary')
            ->size('lg'),
    ]" />
    </x-filament-panels::form>
</x-filament-panels::page>