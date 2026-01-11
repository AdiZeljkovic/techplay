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
        'success' => '#10b981', // emerald-500
        'warning' => '#f59e0b', // amber-500
        'danger' => '#ef4444', // red-500
    };
@endphp

<div class="space-y-6">
    {{-- Score Header --}}
    <div
        class="flex flex-col sm:flex-row items-center gap-6 p-5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
        {{-- Circular Gauge --}}
        <div class="relative flex-shrink-0" style="width: 100px; height: 100px;">
            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <!-- Background Circle -->
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="8"
                    class="text-gray-200 dark:text-gray-700" />
                <!-- Score Arc -->
                <circle cx="50" cy="50" r="45" fill="none" stroke="{{ $colorHex }}" stroke-width="8"
                    stroke-dasharray="{{ $score * 2.83 }} 283" stroke-linecap="round"
                    style="transition: stroke-dasharray 1s ease-in-out;" />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-3xl font-bold dark:text-white" style="color: {{ $colorHex }}">{{ $score }}</span>
                <span class="text-xs font-medium text-gray-500 dark:text-gray-400">SEO SCORE</span>
            </div>
        </div>

        {{-- Text Summary --}}
        <div class="flex-1 text-center sm:text-left">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Optimization Grade: <span style="color: {{ $colorHex }}">{{ $grade }}</span>
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
                @if($score >= 80)
                    Excellent! Your content is optimized for high visibility.
                @elseif($score >= 50)
                    Good start. Address the warnings below to improve ranking potential.
                @else
                    Needs Improvement. Critical SEO elements are missing or weak.
                @endif
            </p>
        </div>
    </div>

    {{-- Checks Grid --}}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        @foreach($checks as $check)
            @php
                $statusColor = match ($check['status']) {
                    'pass' => 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
                    'warning' => 'text-amber-500 bg-amber-500/10 border-amber-500/20',
                    'fail' => 'text-red-500 bg-red-500/10 border-red-500/20',
                    default => 'text-gray-500 bg-gray-500/10 border-gray-500/20',
                };

                $icon = match ($check['status']) {
                    'pass' => 'heroicon-m-check-circle',
                    'warning' => 'heroicon-m-exclamation-triangle',
                    'fail' => 'heroicon-m-x-circle',
                    default => 'heroicon-m-minus-circle',
                };
            @endphp
            <div class="flex items-start gap-3 p-3 rounded-lg border {{ $statusColor }}">
                <div class="flex-shrink-0 mt-0.5">
                    <x-dynamic-component :component="$icon" class="w-5 h-5 block" style="width: 20px; height: 20px;" />
                </div>
                <span class="text-sm font-medium dark:text-gray-200">{{ $check['message'] }}</span>
            </div>
        @endforeach
    </div>

    {{-- Recommendations --}}
    @if(count($recommendations) > 0)
        <div class="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/50">
            <h4 class="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 mb-3">
                <x-heroicon-m-light-bulb class="w-5 h-5" style="width: 20px; height: 20px;" />
                Actionable Recommendations
            </h4>
            <ul class="space-y-2">
                @foreach($recommendations as $rec)
                    <li class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                        <span>{{ $rec }}</span>
                    </li>
                @endforeach
            </ul>
        </div>
    @endif
</div>