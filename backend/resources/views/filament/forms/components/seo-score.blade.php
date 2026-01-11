@php
    use App\Services\SeoAnalyzerService;

    $formData = $getState() ?? [];

    // Get data from parent form state
    $record = $getRecord();
    $livewire = $getLivewire();
    $allData = method_exists($livewire, 'getState') ? $livewire->getState() : [];

    // Merge form data
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

    // Color based on score
    $scoreColor = match (true) {
        $score >= 75 => 'success',
        $score >= 50 => 'warning',
        default => 'danger',
    };

    $gradientStart = match ($scoreColor) {
        'success' => '#10b981',
        'warning' => '#f59e0b',
        'danger' => '#ef4444',
    };
@endphp

<div class="space-y-4">
    {{-- Score Display --}}
    <div class="flex items-center gap-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
        {{-- Circular Score --}}
        <div class="relative flex-shrink-0" style="width: 80px; height: 80px;">
            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100" width="80" height="80">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="8"
                    class="text-gray-700" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="{{ $gradientStart }}" stroke-width="8"
                    stroke-dasharray="{{ $score * 2.83 }} 283" stroke-linecap="round" />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-2xl font-bold text-white">{{ $score }}</span>
                <span class="text-xs text-gray-400">/ 100</span>
            </div>
        </div>

        {{-- Score Summary --}}
        <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
                <span class="text-lg font-semibold text-white">SEO Score</span>
                <span class="px-2 py-0.5 text-xs font-bold rounded-full
                    {{ $scoreColor === 'success' ? 'bg-green-500/20 text-green-400' : '' }}
                    {{ $scoreColor === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : '' }}
                    {{ $scoreColor === 'danger' ? 'bg-red-500/20 text-red-400' : '' }}">
                    Grade {{ $grade }}
                </span>
            </div>
            <p class="text-sm text-gray-400">
                @if($score >= 75)
                    Great job! Your content is well-optimized for search engines.
                @elseif($score >= 50)
                    Good progress! A few improvements could boost your ranking.
                @else
                    Needs work. Follow the recommendations below to improve.
                @endif
            </p>
        </div>
    </div>

    {{-- Checks Grid --}}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        @foreach($checks as $key => $check)
            @php
                $statusIcon = match ($check['status']) {
                    'pass' => 'heroicon-o-check-circle',
                    'warning' => 'heroicon-o-exclamation-triangle',
                    'fail' => 'heroicon-o-x-circle',
                    default => 'heroicon-o-minus-circle',
                };
                $statusColor = match ($check['status']) {
                    'pass' => 'text-green-400',
                    'warning' => 'text-yellow-400',
                    'fail' => 'text-red-400',
                    default => 'text-gray-500',
                };
            @endphp
            <div class="flex items-center gap-2 p-2 rounded-lg bg-gray-800/30">
                <x-dynamic-component :component="$statusIcon" class="w-5 h-5 {{ $statusColor }} flex-shrink-0" />
                <span class="text-sm text-gray-300 truncate">{{ $check['message'] }}</span>
            </div>
        @endforeach
    </div>

    {{-- Recommendations --}}
    @if(count($recommendations) > 0)
        <div class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <h4 class="flex items-center gap-2 text-sm font-semibold text-amber-400 mb-2">
                <x-heroicon-o-light-bulb class="w-4 h-4" />
                Recommendations
            </h4>
            <ul class="space-y-1">
                @foreach($recommendations as $recommendation)
                    <li class="text-sm text-gray-300 flex items-start gap-2">
                        <span class="text-amber-400 mt-1">•</span>
                        {{ $recommendation }}
                    </li>
                @endforeach
            </ul>
        </div>
    @endif
</div>