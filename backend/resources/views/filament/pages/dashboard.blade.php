<x-filament-panels::page>
    <style>
        .db-welcome {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            padding: 1.25rem 1.5rem;
            background: var(--color-white, #fff);
            border: 2px solid #000;
            border-radius: 0.75rem;
            box-shadow: 4px 4px 0 0 #000;
            margin-bottom: 0.75rem;
        }
        .dark .db-welcome {
            background: var(--color-gray-900, #111827);
            border-color: #4b5563;
            box-shadow: 4px 4px 0 0 rgba(255,255,255,0.15);
        }
        .db-welcome-title {
            font-size: 1.375rem;
            font-weight: 900;
            letter-spacing: -0.02em;
            color: #111;
            margin: 0;
        }
        .dark .db-welcome-title { color: #f9fafb; }
        .db-welcome-subtitle {
            font-size: 0.8125rem;
            color: #6b7280;
            margin-top: 0.2rem;
        }
        .db-stats {
            display: flex;
            flex-wrap: wrap;
            gap: 0.625rem;
        }
        .db-stat {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0.375rem 0.875rem;
            background: #ede9fe;
            border: 2px solid #000;
            border-radius: 0.5rem;
            min-width: 56px;
        }
        .dark .db-stat {
            background: #2e1065;
            border-color: #7c3aed;
        }
        .db-stat-value {
            font-size: 1.25rem;
            font-weight: 900;
            color: #6d28d9;
            line-height: 1.2;
        }
        .dark .db-stat-value { color: #a78bfa; }
        .db-stat-label {
            font-size: 0.6875rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6b7280;
        }
        .db-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 0.625rem;
            margin-bottom: 0.75rem;
        }
        .db-action {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.4rem 0.9rem;
            font-size: 0.8125rem;
            font-weight: 700;
            color: #111;
            text-decoration: none;
            background: #fff;
            border: 2px solid #000;
            border-radius: 0.5rem;
            box-shadow: 3px 3px 0 0 #000;
            transition: all 0.1s ease;
        }
        .dark .db-action {
            color: #f9fafb;
            background: #1f2937;
            border-color: #6b7280;
            box-shadow: 3px 3px 0 0 rgba(255,255,255,0.2);
        }
        .db-action:hover {
            box-shadow: none;
            transform: translate(3px, 3px);
        }
    </style>

    {{-- Welcome Banner --}}
    <div class="db-welcome">
        <div>
            <h1 class="db-welcome-title">Welcome back, {{ auth()->user()->name }}</h1>
            <p class="db-welcome-subtitle">TechPlay Command Center &mdash; {{ now()->format('l, F j, Y') }}</p>
        </div>
        <div class="db-stats">
            <div class="db-stat">
                <span class="db-stat-value">{{ $this->getDraftCount() }}</span>
                <span class="db-stat-label">Drafts</span>
            </div>
            <div class="db-stat">
                <span class="db-stat-value">{{ $this->getPendingCount() }}</span>
                <span class="db-stat-label">Pending</span>
            </div>
            <div class="db-stat">
                <span class="db-stat-value">{{ $this->getTodayCount() }}</span>
                <span class="db-stat-label">Today</span>
            </div>
            <div class="db-stat">
                <span class="db-stat-value">{{ $this->getTotalUsers() }}</span>
                <span class="db-stat-label">Users</span>
            </div>
        </div>
    </div>

    {{-- Quick Actions --}}
    <div class="db-actions">
        <a href="{{ \App\Filament\Resources\NewsResource::getUrl('create') }}" class="db-action">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            New Article
        </a>
        <a href="{{ \App\Filament\Resources\GuideResource::getUrl('create') }}" class="db-action">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            New Guide
        </a>
        <a href="{{ \App\Filament\Pages\UltimateSeo::getUrl() }}" class="db-action">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            SEO Settings
        </a>
    </div>
</x-filament-panels::page>
