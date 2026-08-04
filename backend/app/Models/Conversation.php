<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    public const TYPES = ['direct', 'group', 'clan'];

    protected $fillable = ['type', 'name', 'image', 'clan_id', 'created_by', 'last_message_at'];

    protected $casts = ['last_message_at' => 'datetime'];

    public function participants(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function clan(): BelongsTo
    {
        return $this->belongsTo(Clan::class);
    }

    public function hasParticipant(int $userId): bool
    {
        return $this->participants()->where('user_id', $userId)->exists();
    }

    /** A direct conversation is named by whoever you are talking to. */
    public function isDirect(): bool
    {
        return $this->type === 'direct';
    }
}
