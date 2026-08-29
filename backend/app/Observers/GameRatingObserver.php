<?php

namespace App\Observers;

use App\Models\GameRating;
use App\Services\SanitizationService;

/**
 * A reader's review is user content, wherever it is edited from.
 *
 * `GameRatingController::upsert` ran `strip_tags` on the review before saving —
 * on that one path. The admin panel exposes the same column as an editable
 * field, and an edit there went in raw. Sanitising in the observer covers both
 * doors, and does it with the service the rest of the site uses rather than a
 * bare `strip_tags`, which leaves entities and javascript: URLs alone.
 */
class GameRatingObserver
{
    public function saving(GameRating $rating): void
    {
        if ($rating->isDirty('review') && is_string($rating->review)) {
            $rating->review = app(SanitizationService::class)->sanitizePlainText($rating->review);
        }
    }
}
