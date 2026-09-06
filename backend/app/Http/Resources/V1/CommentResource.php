<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
{
    /**
     * A comment as the thread draws it.
     *
     * Three fields left here because nothing read them:
     *
     * - `created_at_human` — the client formats the timestamp itself, with
     *   date-fns, so it never looked at the server's version. Two renderings of
     *   one moment, and the server's one goes stale the second it is cached.
     * - `likes_count` — was assigned `$this->score`. The same number twice.
     * - `is_liked_by_user` — was `$this->user_vote === 'up'`, which the client
     *   can see for itself from `user_vote`, and which cannot express a
     *   downvote at all.
     *
     * The author now comes through CommentAuthorResource rather than the full
     * UserResource; see the note there.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'content' => $this->content,
            'created_at' => $this->created_at,
            'user' => new CommentAuthorResource($this->whenLoaded('user')),
            'parent_id' => $this->parent_id,
            'replies' => CommentResource::collection($this->whenLoaded('replies')),
            'score' => (int) ($this->score ?? 0),
            'user_vote' => $this->user_vote,
            /*
             * Whether this one is still waiting for an editor.
             *
             * The thread only ever contains approved comments and the reader's
             * own held ones, so a true here always means "yours, not published
             * yet" — there is no way for it to describe somebody else. It is a
             * boolean rather than the status string for that reason: `status`
             * would invite a screen to render `spam`, which nobody is ever
             * sent.
             */
            'is_pending' => $this->status !== 'approved',
        ];
    }
}
