<?php

namespace App\Filament\Widgets;

class ReviewsPulse extends DeskPulse
{
    protected static string $type = 'reviews';

    protected static string $noun = 'review';

    /**
     * The one figure a review desk has that the others do not, and every review
     * carries it — 38 of 38, averaging 7.5. Worth watching for drift: a desk
     * whose average creeps toward nine has stopped being useful to a reader.
     */
    protected function extraFigures(): array
    {
        $average = $this->query()->whereNotNull('review_score')->avg('review_score');

        if ($average === null) {
            return [];
        }

        return [[
            'label' => 'Average score',
            'value' => number_format((float) $average, 1),
        ]];
    }
}
