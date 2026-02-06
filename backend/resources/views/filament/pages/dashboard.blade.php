<x-filament-panels::page>
    {{-- Welcome Banner --}}
    <div class="tp-welcome-banner">
        <div>
            <h1 class="tp-welcome-title">
                Welcome back, {{ auth()->user()->name }}
            </h1>
            <p class="tp-welcome-subtitle">
                TechPlay Command Center &mdash; {{ now()->format('l, F j, Y') }}
            </p>
        </div>
        <div class="tp-welcome-stats">
            <div class="tp-quick-stat">
                <span class="tp-quick-stat-value">{{ $this->getDraftCount() }}</span>
                <span class="tp-quick-stat-label">Drafts</span>
            </div>
            <div class="tp-quick-stat">
                <span class="tp-quick-stat-value">{{ $this->getPendingCount() }}</span>
                <span class="tp-quick-stat-label">Pending</span>
            </div>
            <div class="tp-quick-stat">
                <span class="tp-quick-stat-value">{{ $this->getTodayCount() }}</span>
                <span class="tp-quick-stat-label">Today</span>
            </div>
            <div class="tp-quick-stat">
                <span class="tp-quick-stat-value">{{ $this->getTotalUsers() }}</span>
                <span class="tp-quick-stat-label">Users</span>
            </div>
        </div>
    </div>

    {{-- Quick Actions --}}
    <div class="tp-quick-actions">
        <a href="{{ \App\Filament\Resources\NewsResource::getUrl('create') }}" class="tp-quick-action">
            <span class="tp-quick-action-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            </span>
            New Article
        </a>
        <a href="{{ \App\Filament\Resources\GuideResource::getUrl('create') }}" class="tp-quick-action">
            <span class="tp-quick-action-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            </span>
            New Guide
        </a>
        <a href="{{ \App\Filament\Pages\EditorialChat::getUrl() }}" class="tp-quick-action">
            <span class="tp-quick-action-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </span>
            Editorial Chat
        </a>
        <a href="{{ \App\Filament\Pages\UltimateSeo::getUrl() }}" class="tp-quick-action">
            <span class="tp-quick-action-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </span>
            SEO Settings
        </a>
    </div>
</x-filament-panels::page>
