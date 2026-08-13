<?php

namespace App\Observers;

use App\Events\CommentPosted;
use App\Events\NotificationReceived;
use App\Models\Comment;
use App\Models\User;
use App\Services\QuestService;
use App\Services\XpService;

class CommentObserver
{
    /**
     * Handle the Comment "created" event.
     */
    public function created(Comment $comment): void
    {
        // Only broadcast approved comments
        if ($comment->status === 'approved') {
            broadcast(new CommentPosted($comment))->toOthers();

            // Notify the content owner (if not self-commenting)
            $this->notifyContentOwner($comment);
        }
    }

    /**
     * Handle the Comment "updated" event.
     */
    public function updated(Comment $comment): void
    {
        // If comment was just approved, broadcast it
        if ($comment->isDirty('status') && $comment->status === 'approved') {
            broadcast(new CommentPosted($comment))->toOthers();

            // Approval is when the comment starts existing for other people,
            // so it is also when it earns. Paid once ever: a moderator moving
            // a comment between pending and approved must not pay each time.
            if ($comment->xp_awarded_at === null && strlen((string) $comment->content) >= 10) {
                try {
                    $author = $comment->user;

                    if ($author) {
                        app(XpService::class)->awardXp($author, XpService::XP_COMMENT, 'comment');
                        app(QuestService::class)->progress($author, 'comment_posted');
                        $comment->forceFill(['xp_awarded_at' => now()])->saveQuietly();
                    }
                } catch (\Throwable) {
                }
            }
        }
    }

    /**
     * Notify the original content owner about the new comment.
     */
    private function notifyContentOwner(Comment $comment): void
    {
        $commentable = $comment->commentable;

        if (! $commentable) {
            return;
        }

        // Get content owner (author_id for articles, user_id for other content)
        $ownerId = $commentable->author_id ?? $commentable->user_id ?? null;

        if (! $ownerId || $ownerId === $comment->user_id) {
            return;
        } // Don't notify self

        $owner = User::find($ownerId);
        if (! $owner) {
            return;
        }

        $contentType = class_basename($comment->commentable_type);
        $contentTitle = $commentable->title ?? $commentable->name ?? 'your content';

        broadcast(new NotificationReceived(
            $owner,
            'comment',
            "{$comment->user->name} commented on {$contentTitle}",
            $this->getContentUrl($comment),
            ['comment_id' => $comment->id]
        ));
    }

    private function getContentUrl(Comment $comment): string
    {
        $type = strtolower(class_basename($comment->commentable_type));
        $slug = $comment->commentable->slug ?? $comment->commentable_id;

        return "/{$type}s/{$slug}#comment-{$comment->id}";
    }
}
