@php
    use App\Services\SeoAnalyzerService;

    $formData = $getState() ?? [];

    // Get record and merge data safely
    $record = $getRecord();
    $livewire = $getLivewire();
    $allData = method_exists($livewire, 'getState') ? $livewire->getState() : [];

    $data = array_merge([
        'title' => $allData['title'] ?? $record?->title ?? '',
        'slug' => $allData['slug'] ?? $record?->slug ?? '',
        'excerpt' => $allData['excerpt'] ?? $record?->excerpt ?? '',
        'content' => $allData['content'] ?? $record?->content ?? '',
        'seo_title' => $allData['seo_title'] ?? $record?->seo_title ?? '',
        'seo_description' => $allData['seo_description'] ?? $record?->seo_description ?? '',
        'focus_keyword' => $allData['focus_keyword'] ?? $record?->focus_keyword ?? '',
        'featured_image_url' => $allData['featured_image_url'] ?? $record?->featured_image_url ?? null,
    ], $formData);

    $analysis = SeoAnalyzerService::analyze($data);
    $score = $analysis['score'];
    $grade = $analysis['grade'];
    $checks = $analysis['checks'];
    $recommendations = $analysis['recommendations'];

    $scoreColor = match (true) {
        $score >= 80 => 'success',
        $score >= 50 => 'warning',
        default => 'danger',
    };

    $colorHex = match ($scoreColor) {
        'success' => '#10b981',
        'warning' => '#f59e0b',
        'danger' => '#ef4444',
    };

    $bgHex = match ($scoreColor) {
        'success' => 'rgba(16, 185, 129, 0.12)',
        'warning' => 'rgba(245, 158, 11, 0.12)',
        'danger' => 'rgba(239, 68, 68, 0.12)',
    };
@endphp

<style>
    .seo-score-wrap {
        border: 2px solid #000;
        border-radius: 0.75rem;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        background: #fff;
        box-shadow: 3px 3px 0 0 #000;
    }
    .dark .seo-score-wrap {
        background: #1e293b;
        border-color: #475569;
        box-shadow: 3px 3px 0 0 rgba(255,255,255,0.15);
    }
    .seo-score-check {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.75rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
    }
    .dark .seo-score-check {
        background: rgba(30, 41, 59, 0.5);
        border-color: rgba(71, 85, 105, 0.5);
    }
    .seo-score-check-text {
        font-size: 0.875rem;
        color: #475569;
        line-height: 1.4;
    }
    .dark .seo-score-check-text {
        color: #cbd5e1;
    }
    .seo-score-title {
        font-size: 1.125rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
    }
    .dark .seo-score-title {
        color: #f1f5f9;
    }
    .seo-score-subtitle {
        font-size: 0.875rem;
        color: #64748b;
        margin: 0;
        line-height: 1.4;
    }
    .dark .seo-score-subtitle {
        color: #94a3b8;
    }
    .seo-score-num {
        font-size: 1.5rem;
        font-weight: 900;
        line-height: 1;
    }
    .seo-score-label-sm {
        font-size: 0.65rem;
        color: #94a3b8;
        text-transform: uppercase;
    }
    .seo-rec-wrap {
        margin-top: 0.25rem;
        padding: 1rem;
        border: 1px solid rgba(245, 158, 11, 0.3);
        border-radius: 0.5rem;
        background: rgba(245, 158, 11, 0.06);
    }
    .dark .seo-rec-wrap {
        background: rgba(245, 158, 11, 0.05);
        border-color: rgba(245, 158, 11, 0.2);
    }
    .seo-rec-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        font-weight: 700;
        color: #d97706;
        margin-bottom: 0.75rem;
        margin-top: 0;
    }
    .seo-rec-item {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        color: #64748b;
    }
    .dark .seo-rec-item {
        color: #94a3b8;
    }
</style>

<div class="seo-score-wrap">

    <!-- Top Section: Score & Summary -->
    <div style="display: flex; align-items: center; gap: 1.5rem;">
        <!-- Gauge -->
        <div style="position: relative; width: 80px; height: 80px; flex-shrink: 0;">
            <svg style="transform: rotate(-90deg); width: 100%; height: 100%;" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" stroke-width="8" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="{{ $colorHex }}" stroke-width="8"
                    stroke-dasharray="{{ $score * 2.83 }} 283"
                    stroke-linecap="round"
                    style="transition: stroke-dasharray 1s ease-in-out;" />
            </svg>
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <span class="seo-score-num" style="color: {{ $colorHex }};">{{ $score }}</span>
                <span class="seo-score-label-sm">SCORE</span>
            </div>
        </div>

        <!-- Text Summary -->
        <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                <h3 class="seo-score-title">Optimization Grade</h3>
                <span style="background-color: {{ $bgHex }}; color: {{ $colorHex }}; border: 1px solid {{ $colorHex }}; padding: 0.125rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700;">
                    {{ $grade }}
                </span>
            </div>
            <p class="seo-score-subtitle">
                @if($score >= 80)
                    Excellent work! Your content is perfectly optimized for search engines.
                @elseif($score >= 50)
                    Good foundation. Address the issues below to improve your ranking.
                @else
                    Needs attention. Critical SEO elements are missing.
                @endif
            </p>
        </div>
    </div>

    <!-- Checks List -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 0.625rem;">
        @foreach($checks as $check)
            @php
                $iconColor = match ($check['status']) {
                    'pass' => '#10b981',
                    'warning' => '#f59e0b',
                    'fail' => '#ef4444',
                    default => '#64748b',
                };
                $iconPath = match ($check['status']) {
                    'pass' => 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z',
                    'warning' => 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z',
                    'fail' => 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z',
                    default => 'M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z',
                };
            @endphp
            <div class="seo-score-check">
                <svg style="width: 20px; height: 20px; color: {{ $iconColor }}; flex-shrink: 0; margin-top: 2px;" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="{{ $iconPath }}" clip-rule="evenodd" />
                </svg>
                <span class="seo-score-check-text">{{ $check['message'] }}</span>
            </div>
        @endforeach
    </div>

    <!-- Recommendations -->
    @if(count($recommendations) > 0)
        <div class="seo-rec-wrap">
            <h4 class="seo-rec-title">
                <svg style="width: 16px; height: 16px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Recommendations
            </h4>
            <ul style="margin: 0; padding: 0; list-style: none;">
                @foreach($recommendations as $rec)
                    <li class="seo-rec-item">
                        <span style="display: block; width: 6px; height: 6px; background-color: #f59e0b; border-radius: 50%; margin-top: 6px; flex-shrink: 0;"></span>
                        <span>{{ $rec }}</span>
                    </li>
                @endforeach
            </ul>
        </div>
    @endif

</div>
