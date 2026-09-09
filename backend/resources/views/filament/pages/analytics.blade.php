{{--
    The site's own traffic, counted without consent because it stores no
    identifier. See App\Filament\Pages\Analytics for why this exists at all
    and why it does not agree with Google Analytics.

    The chart is inline SVG rather than a charting package: the shape here is
    bars over days, the panel already ships a CSP, and a dependency that draws
    one bar chart is a dependency to keep alive.
--}}
<x-filament-panels::page>
    @php
        $max = max(1, $days->max('pageviews'));
        $bar = fn ($value) => max(1, (int) round(($value / $max) * 100));
        $pct = fn (?float $c) => $c === null ? null : ($c > 0 ? '+' : '') . number_format($c, 1) . '%';
    @endphp

    {{-- Range --}}
    <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-white/5">
            @foreach ([7 => '7 dana', 30 => '30 dana', 90 => '90 dana'] as $days_ => $label)
                <button
                    wire:click="setRange({{ $days_ }})"
                    @class([
                        'rounded-md px-3 py-1.5 text-sm font-medium transition',
                        'bg-white text-gray-950 shadow-sm dark:bg-white/10 dark:text-white' => $range === $days_,
                        'text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white' => $range !== $days_,
                    ])
                >{{ $label }}</button>
            @endforeach
        </div>

        <p class="text-xs text-gray-500 dark:text-gray-400">
            @if ($since)
                {{-- The range asked for more than we have. Saying so beats
                     letting two hours read as a month. --}}
                mjerimo tek od {{ $since->format('d.m.Y') }}
            @else
                od {{ $from->format('d.m.Y') }}
            @endif
        </p>
    </div>

    {{-- The four figures --}}
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        @foreach ([
            ['Posjetioci', number_format($totals['visitors']), $change['visitors'], 'zbir dnevnih'],
            ['Pregledi stranica', number_format($totals['pageviews']), $change['pageviews'], number_format($totals['sessions']) . ' sesija'],
            ['Prosječno na sesiji', $totals['engagement'] . ' s', null, number_format($totals['engaged']) . ' angažovanih sesija'],
            ['Botovi, izuzeti', number_format($totals['bots']), null, 'ne ulaze ni u jednu brojku iznad'],
        ] as [$label, $value, $delta, $note])
            <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ $label }}</p>
                <p class="mt-1 text-2xl font-bold tabular-nums text-gray-950 dark:text-white">{{ $value }}</p>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    @if ($delta !== null)
                        <span @class([
                            'font-semibold',
                            'text-success-600 dark:text-success-400' => $delta > 0,
                            'text-danger-600 dark:text-danger-400' => $delta < 0,
                        ])>{{ $pct($delta) }}</span>
                        <span class="mx-1">·</span>
                    @endif
                    {{ $note }}
                </p>
            </div>
        @endforeach
    </div>

    {{-- Days --}}
    <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
        <p class="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Pregledi po danima
        </p>

        <div class="flex h-32 items-end gap-px">
            @foreach ($days as $day)
                <div
                    class="group relative flex-1 rounded-t bg-primary-500/80 transition hover:bg-primary-500"
                    style="height: {{ $bar($day->pageviews) }}%"
                    title="{{ $day->day->format('d.m.') }} — {{ number_format($day->pageviews) }} pregleda, {{ number_format($day->visitors) }} posjetilaca"
                ></div>
            @endforeach
        </div>

        <div class="mt-2 flex justify-between text-[10px] tabular-nums text-gray-400">
            <span>{{ $days->first()?->day->format('d.m.') }}</span>
            <span>{{ $days->last()?->day->format('d.m.') }}</span>
        </div>
    </div>

    {{-- Breakdowns --}}
    <div class="grid gap-4 lg:grid-cols-2">
        @foreach ([
            ['Najčitanije stranice', $pages, true],
            ['Odakle dolaze', $referrers, false],
            ['Države', $countries, false],
            ['Uređaji', $devices, false],
            ['Pregledači', $browsers, false],
        ] as [$title, $rows, $showLabel])
            <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                <p class="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {{ $title }}
                </p>

                @if ($rows->isEmpty())
                    <p class="py-6 text-center text-sm text-gray-400">Još nema podataka za ovaj period.</p>
                @else
                    @php $top = max(1, $rows->max('visitors')); @endphp

                    <ul class="space-y-1">
                        @foreach ($rows as $row)
                            <li class="relative flex items-center justify-between gap-3 rounded px-2 py-1.5 text-sm">
                                {{-- The bar is the background of its own row: a
                                     proportion read without a second column. --}}
                                <span
                                    class="absolute inset-y-0 left-0 rounded bg-primary-500/10"
                                    style="width: {{ round(($row->visitors / $top) * 100) }}%"
                                    aria-hidden="true"
                                ></span>

                                <span class="relative min-w-0 truncate text-gray-700 dark:text-gray-200"
                                      title="{{ $showLabel && $row->label ? $row->label : $row->value }}">
                                    {{ $showLabel && $row->label ? $row->label : $row->value }}
                                </span>

                                <span class="relative shrink-0 tabular-nums text-gray-500 dark:text-gray-400">
                                    {{ number_format($row->visitors) }}
                                </span>
                            </li>
                        @endforeach
                    </ul>
                @endif
            </div>
        @endforeach
    </div>
</x-filament-panels::page>
