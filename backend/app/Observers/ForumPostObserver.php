<?php

namespace App\Observers;

use App\Events\ForumReplyPosted;
use App\Models\Post;

class ForumPostObserver
{
    public function created(Post $post): void
    {
        // Only broadcast if it's a forum post (has thread_id)
        if ($post->thread_id) {
            broadcast(new ForumReplyPosted($post))->toOthers();
        }
    }
}
