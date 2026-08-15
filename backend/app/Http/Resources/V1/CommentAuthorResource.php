<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The author of a comment, and nothing else about them.
 *
 * Comments used the general UserResource, which answers "tell me about this
 * person" — twenty fields, including their cover image, bio, tagline, location,
 * author slug, social links, post colour, forum reputation, post count, level,
 * XP, roles and join date. A comment thread renders a name, a picture and a
 * rank badge. Everything else rode along on every comment *and every reply*,
 * and the endpoint loads up to a hundred replies per comment, ten comments to
 * the page.
 *
 * `is_staff` is here because the comment list draws staff differently. The
 * client was reading `user.role`, which UserResource has never sent, so the
 * accent ring and the Staff badge could not fire for anybody.
 */
class CommentAuthorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'username' => $this->username,
            'name' => $this->name,
            'avatar_url' => $this->avatar_url,

            // Name and colour only: the badge draws no icon and links nowhere.
            'rank' => $this->whenLoaded('rank', fn () => [
                'name' => $this->rank->name,
                'color' => $this->rank->color,
            ]),

            'is_staff' => $this->isEditorialStaff(),
        ];
    }
}
