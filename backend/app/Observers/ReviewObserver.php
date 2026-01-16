<?php

namespace App\Observers;

use App\Events\ReviewPublished;
use App\Models\Review;

class ReviewObserver
{
    public function created(Review $review): void
    {
        if ($review->status === 'published') {
            broadcast(new ReviewPublished($review))->toOthers();
        }
    }

    public function updated(Review $review): void
    {
        if ($review->isDirty('status') && $review->status === 'published') {
            broadcast(new ReviewPublished($review))->toOthers();
        }
    }
}
