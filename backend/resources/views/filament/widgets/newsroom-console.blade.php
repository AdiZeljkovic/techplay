@php($d = $this->getData())

<div class="tp-console">

    {{-- ── Lead panel: is the newsroom still moving ──────────────────── --}}
    <section class="tp-panel tp-panel--lead tp-tone-{{ $d['cadence'] }}">
        <div class="tp-lead">
            <div class="tp-lead__figure">
                <span class="tp-eyebrow">Since last publish</span>
                <strong class="tp-huge">
                    @if ($d['daysSince'] === null)
                        —
                    @elseif ($d['daysSince'] === 0)
                        today
                    @else
                        {{ $d['daysSince'] }}<span class="tp-huge__unit">{{ $d['daysSince'] === 1 ? 'day' : 'days' }}</span>
                    @endif
                </strong>
                @if ($d['lastAt'])
                    <span class="tp-sub">{{ $d['lastAt']->format('d.m.Y • H:i') }}</span>
                @endif
            </div>

            <div class="tp-lead__counts">
                <div class="tp-count">
                    <span class="tp-count__n">{{ $d['today'] }}</span>
                    <span class="tp-count__l">today</span>
                </div>
                <div class="tp-count">
                    <span class="tp-count__n">{{ $d['week'] }}</span>
                    <span class="tp-count__l">this week</span>
                </div>
                <div class="tp-count">
                    <span class="tp-count__n">{{ $d['month'] }}</span>
                    <span class="tp-count__l">this month</span>
                </div>
            </div>

            {{-- The fortnight, drawn across the panel rather than squeezed into
                 the forty pixels a stat card allows. --}}
            <div class="tp-spark" role="img"
                 aria-label="Articles published per day over the last fourteen days, peak {{ $d['sparkline']['max'] }}">
                <svg viewBox="0 0 100 28" preserveAspectRatio="none">
                    <path class="tp-spark__area" d="{{ $d['sparkline']['area'] }}" />
                    <path class="tp-spark__line" d="{{ $d['sparkline']['line'] }}" />
                </svg>
                <span class="tp-spark__caption">14 days</span>
            </div>
        </div>

        {{-- Only what is waiting. When nothing is, one quiet line rather than a
             row of zeroes the eye learns to skip. --}}
        <div class="tp-attention">
            <span class="tp-eyebrow">Needs attention</span>
            @forelse ($d['queues'] as $q)
                @if ($q['url'])
                    <a href="{{ $q['url'] }}" class="tp-chip tp-chip--{{ $q['tone'] }}">
                        <span class="tp-chip__n">{{ $q['n'] }}</span>{{ $q['label'] }}
                    </a>
                @else
                    <span class="tp-chip tp-chip--{{ $q['tone'] }}">
                        <span class="tp-chip__n">{{ $q['n'] }}</span>{{ $q['label'] }}
                    </span>
                @endif
            @empty
                <span class="tp-clear">All clear — nothing waiting for approval or repair</span>
            @endforelse
        </div>
    </section>

    {{-- ── Three readouts ────────────────────────────────────────────── --}}
    <div class="tp-grid">

        <section class="tp-panel">
            <h3 class="tp-eyebrow">Reach</h3>

            <div class="tp-metric">
                <strong class="tp-big">{{ number_format($d['views']) }}</strong>
                <span class="tp-sub">article views across {{ number_format($d['articles']) }} published</span>
            </div>

            <div class="tp-row">
                <span class="tp-row__l">Earned this month</span>
                <span class="tp-row__v">{{ number_format($d['monthViews']) }}</span>
            </div>

            @if ($d['bestTitle'])
                <a class="tp-best" @if ($d['bestUrl']) href="{{ $d['bestUrl'] }}" @endif>
                    <span class="tp-eyebrow tp-eyebrow--tight">Best this month</span>
                    <span class="tp-best__n">{{ number_format($d['bestViews']) }}</span>
                    <span class="tp-best__t">{{ Str::limit($d['bestTitle'], 58) }}</span>
                </a>
            @endif
        </section>

        <section class="tp-panel">
            <h3 class="tp-eyebrow">Game catalogue</h3>

            <div class="tp-metric">
                <strong class="tp-big">{{ number_format($d['games']) }}</strong>
                <span class="tp-sub">
                    games
                    @if ($d['gamesWeek'] > 0)
                        · <span class="tp-up">+{{ number_format($d['gamesWeek']) }} this week</span>
                    @endif
                </span>
            </div>

            {{-- A share deserves a bar. "81% in sitemap" printed as text asks
                 the reader to picture the other nineteen. --}}
            @php($pct = $d['sitemapPct'])
            <div class="tp-bar-wrap">
                <div class="tp-bar-head">
                    <span class="tp-row__l">Search engines can see</span>
                    <span class="tp-row__v">{{ $pct }}%</span>
                </div>
                <div class="tp-bar tp-tone-{{ $pct >= 90 ? 'good' : ($pct >= 75 ? 'warn' : 'bad') }}">
                    <span style="width: {{ $pct }}%"></span>
                </div>
                <span class="tp-sub">{{ number_format($d['invisible']) }} have no description, so no page</span>
            </div>

            <div class="tp-row">
                <span class="tp-row__l">Game views</span>
                <span class="tp-row__v">{{ number_format($d['gameViews']) }}</span>
            </div>
        </section>

        <section class="tp-panel">
            <h3 class="tp-eyebrow">Community</h3>

            <div class="tp-metric">
                <strong class="tp-big">{{ number_format($d['active']) }}</strong>
                <span class="tp-sub">active in 7 days, of {{ number_format($d['users']) }} registered</span>
            </div>

            <div class="tp-row">
                <span class="tp-row__l">New this month</span>
                <span class="tp-row__v">{{ $d['newUsers'] }}</span>
            </div>
            <div class="tp-row">
                <span class="tp-row__l">Comments this week</span>
                <span class="tp-row__v">{{ $d['weekComments'] }}</span>
            </div>

            @if ($d['seasonName'])
                <div class="tp-bar-wrap">
                    <div class="tp-bar-head">
                        <span class="tp-row__l">{{ $d['seasonName'] }}</span>
                        <span class="tp-row__v">{{ $d['seasonLeft'] !== null && $d['seasonLeft'] >= 0 ? $d['seasonLeft'].'d left' : 'ended' }}</span>
                    </div>
                    <div class="tp-bar tp-tone-{{ $d['seasonLeft'] !== null && $d['seasonLeft'] < 0 ? 'bad' : ($d['seasonLeft'] !== null && $d['seasonLeft'] <= 7 ? 'warn' : 'good') }}">
                        <span style="width: {{ $d['seasonPct'] ?? 0 }}%"></span>
                    </div>
                    <span class="tp-sub">{{ $d['bounty'] }} bounty transactions this week</span>
                </div>
            @else
                <div class="tp-bar-wrap">
                    <span class="tp-sub tp-warn">No active season — quests belong to nothing</span>
                </div>
            @endif
        </section>

    </div>
</div>
