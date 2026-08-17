@php
    use App\Filament\Resources\CommentResource;
    use App\Filament\Resources\MediaResource;
    use App\Filament\Resources\NewsResource;
    use App\Models\Comment;
    use Illuminate\Support\Facades\Cache;

    /*
     * The admin panel's own bottom navigation.
     *
     * Four screens and a way in to the rest. Five is the ceiling: past that the
     * labels stop fitting at 390px and the targets drop under the 44px floor.
     *
     * The four are chosen by what somebody opens the *admin* for from a phone,
     * which is a different list from what a reader opens the site for. Nobody
     * writes a two-thousand word review on a phone. What you do on a phone is
     * check, approve, and post a photo:
     *
     *   Dashboard   is anything waiting, are we still publishing
     *   Articles    read what went out, publish something that is ready
     *   Comments    the moderation queue, with its count on the tab
     *   Media       upload from the camera roll — the one admin job a phone
     *               does better than a desk
     *
     * "More" opens Filament's own drawer. There are thirty-six items in that
     * sidebar and exactly one place they should be listed.
     */
    $pending = Cache::remember(
        'mobilenav.pending.v1',
        60,
        fn () => Comment::where('status', 'pending')->count(),
    );

    $items = [
        [
            'label' => 'Dashboard',
            'url' => \Filament\Facades\Filament::getUrl(),
            'active' => request()->routeIs('filament.admin.pages.dashboard'),
            'badge' => null,
            'path' => 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
        ],
        [
            'label' => 'Articles',
            'url' => NewsResource::getUrl('index'),
            'active' => request()->routeIs('filament.admin.resources.news-articles.*'),
            'badge' => null,
            'path' => 'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z',
        ],
        [
            'label' => 'Comments',
            'url' => CommentResource::getUrl('index'),
            'active' => request()->routeIs('filament.admin.resources.comments.*'),
            'badge' => $pending > 0 ? $pending : null,
            'path' => 'M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z',
        ],
        [
            'label' => 'Media',
            'url' => MediaResource::getUrl('index'),
            'active' => request()->routeIs('filament.admin.resources.media.*'),
            'badge' => null,
            'path' => 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18 6.75h.008v.008H18V6.75zM2.25 19.5V4.5A2.25 2.25 0 014.5 2.25h15A2.25 2.25 0 0121.75 4.5v15a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 19.5z',
        ],
    ];
@endphp

<nav class="tp-tabbar" aria-label="Admin navigation">
    <div class="tp-tabbar__inner">
        @foreach ($items as $item)
            <a href="{{ $item['url'] }}"
               class="tp-tab {{ $item['active'] ? 'is-active' : '' }}"
               @if ($item['active']) aria-current="page" @endif>
                <span class="tp-tab__mark">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="{{ $item['path'] }}" />
                    </svg>
                    @if ($item['badge'])
                        <span class="tp-tab__badge">{{ $item['badge'] > 99 ? '99+' : $item['badge'] }}</span>
                    @endif
                </span>
                <span class="tp-tab__label">{{ $item['label'] }}</span>
            </a>
        @endforeach

        {{-- The rest of the panel, through the drawer Filament already has. --}}
        <button type="button"
                class="tp-tab"
                x-data
                x-on:click="$store.sidebar.open()"
                aria-label="Open the full menu">
            <span class="tp-tab__mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            </span>
            <span class="tp-tab__label">More</span>
        </button>
    </div>
</nav>
