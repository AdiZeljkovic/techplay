<x-filament-panels::page>
    {{-- Welcome Banner --}}
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white dark:bg-gray-900 border-2 border-black dark:border-gray-600 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] mb-2">
        <div>
            <h1 class="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                Welcome back, {{ auth()->user()->name }}
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                TechPlay Command Center &mdash; {{ now()->format('l, F j, Y') }}
            </p>
        </div>
        <div class="flex flex-wrap gap-3">
            @foreach([
                ['value' => $this->getDraftCount(), 'label' => 'Drafts'],
                ['value' => $this->getPendingCount(), 'label' => 'Pending'],
                ['value' => $this->getTodayCount(), 'label' => 'Today'],
                ['value' => $this->getTotalUsers(), 'label' => 'Users'],
            ] as $stat)
            <div class="flex flex-col items-center px-4 py-2 bg-primary-50 dark:bg-primary-950 border-2 border-black dark:border-primary-400 rounded-lg min-w-[60px]">
                <span class="text-xl font-black text-primary-600 dark:text-primary-400 leading-tight">{{ $stat['value'] }}</span>
                <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{{ $stat['label'] }}</span>
            </div>
            @endforeach
        </div>
    </div>

    {{-- Quick Actions --}}
    <div class="flex flex-wrap gap-3 mb-2">
        <a href="{{ \App\Filament\Resources\NewsResource::getUrl('create') }}"
           class="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white border-2 border-black dark:border-gray-500 rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            New Article
        </a>
        <a href="{{ \App\Filament\Resources\GuideResource::getUrl('create') }}"
           class="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white border-2 border-black dark:border-gray-500 rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            New Guide
        </a>
        <a href="{{ \App\Filament\Pages\EditorialChat::getUrl() }}"
           class="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white border-2 border-black dark:border-gray-500 rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Editorial Chat
        </a>
        <a href="{{ \App\Filament\Pages\UltimateSeo::getUrl() }}"
           class="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white border-2 border-black dark:border-gray-500 rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            SEO Settings
        </a>
    </div>
</x-filament-panels::page>
