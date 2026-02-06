<x-filament-panels::page>
    {{-- Welcome Banner --}}
    <div class="tp-welcome-banner">
        <div>
            <h1 class="tp-welcome-title">
                Welcome back, {{ auth()->user()->name }}
            </h1>
            <p class="tp-welcome-subtitle">
                TechPlay Admin Dashboard &mdash; {{ now()->format('l, F j, Y') }}
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
            <span class="tp-quick-action-icon">+</span>
            New Article
        </a>
        <a href="{{ \App\Filament\Resources\GuideResource::getUrl('create') }}" class="tp-quick-action">
            <span class="tp-quick-action-icon">+</span>
            New Guide
        </a>
        <a href="{{ \App\Filament\Pages\EditorialChat::getUrl() }}" class="tp-quick-action">
            <span class="tp-quick-action-icon">💬</span>
            Editorial Chat
        </a>
        <a href="{{ \App\Filament\Pages\UltimateSeo::getUrl() }}" class="tp-quick-action">
            <span class="tp-quick-action-icon">🔍</span>
            SEO Settings
        </a>
    </div>
</x-filament-panels::page>
