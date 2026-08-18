<?php

namespace App\Filament\Widgets;

use App\Models\Article;
use Illuminate\Support\Carbon;

/**
 * The strip above News, Reviews and Tech.
 *
 * All three are `Article` rows separated by their category type, so they share
 * everything except that type and one extra figure apiece.
 */
abstract class DeskPulse extends ListPulse
{
    /** Value of `categories.type` this desk files under. */
    protected static string $type = 'news';

    /** What one of these is called in the lead label. */
    protected static string $noun = 'story';

    /**
     * A figure only this desk has — Reviews carry a score, the others do not.
     *
     * @return array<int, array{label: string, value: string, tone?: string}>
     */
    protected function extraFigures(): array
    {
        return [];
    }

    protected function query()
    {
        return Article::whereHas('category', fn ($q) => $q->where('type', static::$type));
    }

    protected function pulse(): array
    {
        $last = $this->query()->max('published_at');
        $daysSince = $last ? (float) abs(now()->diffInDays(Carbon::parse($last))) : null;

        $median = static::medianGap(
            $this->query()->where('published_at', '>=', now()->subYear())->pluck('published_at')
        );

        $tone = static::lateness($daysSince, $median);

        $inThirty = $this->query()->where('published_at', '>=', now()->subDays(30))->count();
        $views = (int) $this->query()->where('published_at', '>=', now()->subDays(30))->sum('views');
        $unfinished = $this->query()->where('status', '<>', 'published')->count();

        $figures = array_merge([
            ['label' => 'Published, 30 days', 'value' => (string) $inThirty],
            ['label' => 'Views on those', 'value' => static::compact($views)],
        ], $this->extraFigures());

        /*
         * Only when there is something unfinished. A row reading "Drafts 0"
         * is space the eye learns to skip, and then it skips it on the day it
         * says three.
         */
        if ($unfinished > 0) {
            $figures[] = ['label' => 'Not published yet', 'value' => (string) $unfinished, 'tone' => 'warn'];
        }

        return [
            'lead' => [
                'label' => 'Since the last '.static::$noun,
                'value' => $daysSince === null ? '—' : (string) (int) $daysSince,
                'unit' => $daysSince === null ? '' : ((int) $daysSince === 1 ? 'day' : 'days'),
                'tone' => $tone,
            ],
            'figures' => $figures,
            /*
             * The sentence exists so the lead figure means something on its own.
             * "41 days" is only alarming next to "normally every 5".
             */
            'note' => $median === null
                ? null
                : ($median < 1
                    ? 'Normally several a day.'
                    : 'Normally one every '.round($median).' '.(round($median) === 1.0 ? 'day' : 'days').'.'),
        ];
    }
}
