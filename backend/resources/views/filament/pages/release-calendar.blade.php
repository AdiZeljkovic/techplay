@php
    $pending = $this->pending();
    $inventory = $this->inventory();
    $months = $this->upcomingByMonth();
    $decisions = $this->decisions();
    $entries = $this->entriesTotal();
    $peak = max(1, collect($months)->max('tally') ?? 1);
    $staleAfterDays = 3;
@endphp

<x-filament-panels::page>
<div class="tp-console">

    {{--
        The lead panel answers two questions at once: how large the calendar is,
        and whether it is still filling up. The month bars are the second
        answer — three numbers in a row could not show that September is under
        half of August.
    --}}
    <section class="tp-panel tp-panel--lead">
        <div class="tp-cal-lead">
            <div>
                <span class="tp-eyebrow">Calendar entries</span>
                <strong class="tp-huge">{{ number_format($entries) }}</strong>
                <span class="tp-sub">matched across {{ count($inventory) }} stores</span>
            </div>

            @if ($months)
                <div class="tp-months">
                    <span class="tp-eyebrow">Releases per month</span>
                    <div class="tp-months__rows">
                        @foreach ($months as $month)
                            <div class="tp-month">
                                <span class="tp-month__label">{{ \Illuminate\Support\Carbon::parse($month['month'] . '-01')->format('M Y') }}</span>
                                <span class="tp-month__track">
                                    <span class="tp-month__fill" style="width: {{ max(2, round($month['tally'] / $peak * 100)) }}%"></span>
                                </span>
                                <span class="tp-month__n">{{ number_format($month['tally']) }}</span>
                            </div>
                        @endforeach
                    </div>
                </div>
            @endif
        </div>
    </section>

    {{--
        The stores, as one table rather than five cards.

        They share a scale — how much of what a store lists actually reached the
        calendar — and a share is only readable next to the others. Xbox is the
        reason this shape matters: 357 of 42,344 is a different kind of number
        from Steam's 1,978 of 3,162, and five separate boxes hid that completely.
    --}}
    <section class="tp-panel">
        <h3 class="tp-eyebrow">Stores</h3>

        <table class="tp-stores">
            <thead>
                <tr>
                    <th>Store</th>
                    <th class="tp-num">In calendar</th>
                    <th class="tp-num">Seen</th>
                    <th>Share</th>
                    <th class="tp-num">Last sync</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($inventory as $store)
                    @php
                        $share = $store['seen'] > 0 ? $store['listed'] / $store['seen'] * 100 : 0;
                        $synced = $store['synced'] ? \Illuminate\Support\Carbon::parse($store['synced']) : null;
                        $stale = $synced && $synced->diffInDays(now()) >= $staleAfterDays;
                    @endphp
                    <tr>
                        <td class="tp-stores__name">{{ ucfirst($store['store']) }}</td>
                        <td class="tp-num tp-stores__listed">{{ number_format($store['listed']) }}</td>
                        <td class="tp-num tp-sub">{{ number_format($store['seen']) }}</td>
                        <td>
                            <span class="tp-share">
                                <span class="tp-bar tp-tone-{{ $share >= 60 ? 'good' : ($share >= 20 ? 'warn' : 'bad') }}">
                                    <span style="width: {{ max(1, round($share)) }}%"></span>
                                </span>
                                <span class="tp-share__n">{{ $share >= 10 ? round($share) : round($share, 1) }}%</span>
                            </span>
                        </td>
                        <td class="tp-num {{ $stale ? 'tp-warn' : 'tp-sub' }}">
                            {{ $synced?->diffForHumans() ?? 'never' }}
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </section>

    {{-- The queue. This is the reason the page exists, so it says how much work is in it. --}}
    <section class="tp-panel">
        <div class="tp-queue__head">
            <h3 class="tp-eyebrow">
                Waiting on a decision
                @if ($pending)
                    <span class="tp-count-pill">{{ count($pending) }}</span>
                @endif
            </h3>
            <p class="tp-sub">
                These came from different stores with almost the same title. Close enough to ask about, never close
                enough to merge on their own — an unmerged duplicate is visible, a wrong merge is not.
            </p>
        </div>

        @if (empty($pending))
            <p class="tp-clear">Nothing is waiting. Every pair the syncs found was clear enough to settle.</p>
        @else
            <div class="tp-pairs">
                @foreach ($pending as $pair)
                    @php
                        $left = $pair['left'];
                        $right = $pair['right'];
                    @endphp

                    <div class="tp-pair">
                        @foreach ([$left, $right] as $index => $game)
                            @if ($index === 1)
                                <div class="tp-verdict">
                                    <x-filament::button
                                        size="xs"
                                        color="success"
                                        wire:click="same({{ $left->id }}, {{ $right->id }})"
                                        wire:confirm="Merge these into one calendar entry?"
                                    >
                                        Same game
                                    </x-filament::button>

                                    <x-filament::button
                                        size="xs"
                                        color="gray"
                                        wire:click="different({{ $left->id }}, {{ $right->id }})"
                                    >
                                        Different
                                    </x-filament::button>
                                </div>
                            @endif

                            <div class="tp-side">
                                {{--
                                    cover_url, not background_image. That column was renamed in the
                                    catalogue clean-up and this page was never updated, so every
                                    cover here had been a grey rectangle since — on all 2,461
                                    entries, every one of which has an image.
                                --}}
                                @if ($game->cover_url)
                                    <img src="{{ $game->cover_url }}" alt="" class="tp-side__art" loading="lazy">
                                @else
                                    <span class="tp-side__art tp-side__art--empty"></span>
                                @endif

                                <div class="tp-side__body">
                                    <p class="tp-side__title">{{ $game->name }}</p>

                                    <p class="tp-sub">
                                        {{ $game->released?->format('j M Y') ?? 'undated' }}
                                        {{-- publishers, not details_data->publisher: same rename, same silence. --}}
                                        @if ($publisher = ($game->publishers[0] ?? null))
                                            &middot; {{ $publisher }}
                                        @endif
                                    </p>

                                    <p class="tp-tags">
                                        @foreach ($game->storeLinks as $link)
                                            <span class="tp-tag tp-tag--store">{{ $link->store }}</span>
                                        @endforeach

                                        {{-- platforms, not platform_names. --}}
                                        @foreach (array_slice($game->platforms ?? [], 0, 4) as $platform)
                                            <span class="tp-tag">{{ $platform }}</span>
                                        @endforeach
                                    </p>
                                </div>
                            </div>
                        @endforeach
                    </div>
                @endforeach
            </div>
        @endif
    </section>

    {{-- Rulings are permanent, so they have to be visible and undoable. --}}
    @if ($decisions)
        <section class="tp-panel">
            <div class="tp-queue__head">
                <h3 class="tp-eyebrow">Rulings already made</h3>
                <p class="tp-sub">
                    Every sync obeys these without asking again. Withdraw one and the pair comes back to the queue.
                </p>
            </div>

            <div class="tp-rulings">
                @foreach ($decisions as $decision)
                    <div class="tp-ruling">
                        <div class="tp-ruling__text">
                            <p class="tp-ruling__pair">
                                <span>{{ $decision->left_key }}</span>
                                <span class="tp-ruling__verb tp-tone-{{ $decision->same_game ? 'good' : 'idle' }}">
                                    {{ $decision->same_game ? 'is' : 'is not' }}
                                </span>
                                <span>{{ $decision->right_key }}</span>
                            </p>
                            <p class="tp-sub">
                                {{ $decision->decidedBy?->name ?? 'automatic' }} &middot; {{ $decision->created_at?->diffForHumans() }}
                            </p>
                        </div>

                        <x-filament::button size="xs" color="gray" wire:click="undo({{ $decision->id }})">
                            Withdraw
                        </x-filament::button>
                    </div>
                @endforeach
            </div>
        </section>
    @endif

</div>
</x-filament-panels::page>
