<?php

namespace App\Filament\Widgets;

use App\Models\Guide;
use Illuminate\Support\Carbon;

/**
 * Guides are their own model on their own table, so they cannot share
 * `DeskPulse` — but they answer the same question, and against their own
 * cadence they read very differently from the article desks: a median gap of
 * about five weeks means twenty-four days of quiet is early, not late.
 */
class GuidesPulse extends ListPulse
{
    protected function pulse(): array
    {
        $last = Guide::max('published_at');
        $daysSince = $last ? (float) abs(now()->diffInDays(Carbon::parse($last))) : null;

        $median = static::medianGap(Guide::pluck('published_at'));

        $inThirty = Guide::where('published_at', '>=', now()->subDays(30))->count();
        $views = (int) Guide::where('published_at', '>=', now()->subDays(30))->sum('views');
        $unfinished = Guide::where('status', '<>', 'published')->count();

        $figures = [
            ['label' => 'Published, 30 days', 'value' => (string) $inThirty],
            ['label' => 'Views on those', 'value' => static::compact($views)],
            ['label' => 'Guides in all', 'value' => (string) Guide::count()],
        ];

        if ($unfinished > 0) {
            $figures[] = ['label' => 'Not published yet', 'value' => (string) $unfinished, 'tone' => 'warn'];
        }

        return [
            'lead' => [
                'label' => 'Since the last guide',
                'value' => $daysSince === null ? '—' : (string) (int) $daysSince,
                'unit' => $daysSince === null ? '' : ((int) $daysSince === 1 ? 'day' : 'days'),
                'tone' => static::lateness($daysSince, $median),
            ],
            'figures' => $figures,
            'note' => $median === null
                ? 'Too few to know a normal rhythm yet.'
                : 'Normally one every '.round($median).' days.',
        ];
    }
}
