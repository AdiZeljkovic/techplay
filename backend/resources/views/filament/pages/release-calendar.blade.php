@php
    $pending = $this->pending();
    $inventory = $this->inventory();
    $months = $this->upcomingByMonth();
    $decisions = $this->decisions();
@endphp

<x-filament-panels::page>

    {{-- What the calendar currently holds, per store. --}}
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Calendar entries</p>
            <p class="mt-1 text-2xl font-bold tabular-nums text-gray-950 dark:text-white">{{ number_format($this->entriesTotal()) }}</p>
        </div>

        @foreach ($inventory as $store)
            <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ ucfirst($store['store']) }}</p>
                <p class="mt-1 text-2xl font-bold tabular-nums text-gray-950 dark:text-white">{{ number_format($store['listed']) }}</p>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    of {{ number_format($store['seen']) }} seen
                    @if ($store['synced'])
                        · {{ \Illuminate\Support\Carbon::parse($store['synced'])->diffForHumans() }}
                    @endif
                </p>
            </div>
        @endforeach
    </div>

    @if ($months)
        <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
            <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Releases per month</p>
            <div class="flex flex-wrap gap-6">
                @foreach ($months as $month)
                    <div>
                        <p class="text-lg font-bold tabular-nums text-gray-950 dark:text-white">{{ $month['tally'] }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ \Illuminate\Support\Carbon::parse($month['month'].'-01')->format('M Y') }}</p>
                    </div>
                @endforeach
            </div>
        </div>
    @endif

    {{-- The queue. This is the reason the page exists. --}}
    <div class="rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5">
        <div class="border-b border-gray-200 px-4 py-3 dark:border-white/10">
            <h2 class="text-sm font-semibold text-gray-950 dark:text-white">Waiting on a decision</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                These came from different stores with almost the same title. Close enough to ask about, never close
                enough to merge on their own — an unmerged duplicate is visible, a wrong merge is not.
            </p>
        </div>

        @if (empty($pending))
            <p class="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">Nothing is waiting. Every pair the syncs found was clear enough to settle.</p>
        @else
            <div class="divide-y divide-gray-200 dark:divide-white/10">
                @foreach ($pending as $pair)
                    @php
                        $left = $pair['left'];
                        $right = $pair['right'];
                    @endphp

                    <div class="grid gap-4 p-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                        @foreach ([$left, $right] as $index => $game)
                            @if ($index === 1)
                                <div class="flex flex-col items-center gap-2">
                                    <x-filament::button size="xs" color="success"
                                        wire:click="same({{ $left->id }}, {{ $right->id }})"
                                        wire:confirm="Merge these into one calendar entry?">
                                        Same game
                                    </x-filament::button>
                                    <x-filament::button size="xs" color="gray"
                                        wire:click="different({{ $left->id }}, {{ $right->id }})">
                                        Different
                                    </x-filament::button>
                                </div>
                            @endif

                            <div class="flex gap-3">
                                @if ($game->background_image)
                                    <img src="{{ $game->background_image }}" alt="" class="h-14 w-24 shrink-0 rounded-lg object-cover" loading="lazy">
                                @else
                                    <span class="h-14 w-24 shrink-0 rounded-lg bg-gray-100 dark:bg-white/10"></span>
                                @endif

                                <div class="min-w-0">
                                    <p class="truncate text-sm font-semibold text-gray-950 dark:text-white">{{ $game->name }}</p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">
                                        {{ $game->released?->format('j M Y') ?? 'undated' }}
                                        @if ($publisher = data_get($game->details_data, 'publisher'))
                                            · {{ $publisher }}
                                        @endif
                                    </p>
                                    <p class="mt-1 flex flex-wrap gap-1">
                                        @foreach ($game->storeLinks as $link)
                                            <span class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600 dark:bg-white/10 dark:text-gray-300">{{ $link->store }}</span>
                                        @endforeach
                                        @foreach (($game->platform_names ?? []) as $platform)
                                            <span class="rounded bg-primary-50 px-1.5 py-0.5 text-[10px] font-medium text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">{{ $platform }}</span>
                                        @endforeach
                                    </p>
                                </div>
                            </div>
                        @endforeach
                    </div>
                @endforeach
            </div>
        @endif
    </div>

    {{-- Rulings are permanent, so they have to be visible and undoable. --}}
    @if ($decisions)
        <div class="rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5">
            <div class="border-b border-gray-200 px-4 py-3 dark:border-white/10">
                <h2 class="text-sm font-semibold text-gray-950 dark:text-white">Rulings already made</h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Every sync obeys these without asking again. Withdraw one and the pair comes back to the queue.
                </p>
            </div>

            <div class="divide-y divide-gray-200 dark:divide-white/10">
                @foreach ($decisions as $decision)
                    <div class="flex items-center justify-between gap-4 px-4 py-2.5">
                        <div class="min-w-0">
                            <p class="truncate text-sm text-gray-950 dark:text-white">
                                <span class="font-medium">{{ $decision->left_key }}</span>
                                <span class="text-gray-400">{{ $decision->same_game ? 'is' : 'is not' }}</span>
                                <span class="font-medium">{{ $decision->right_key }}</span>
                            </p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">
                                {{ $decision->decidedBy?->name ?? 'automatic' }} · {{ $decision->created_at?->diffForHumans() }}
                            </p>
                        </div>

                        <x-filament::button size="xs" color="gray" wire:click="undo({{ $decision->id }})">
                            Withdraw
                        </x-filament::button>
                    </div>
                @endforeach
            </div>
        </div>
    @endif

</x-filament-panels::page>
