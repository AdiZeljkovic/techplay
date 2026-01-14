<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EditorialMessage extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'content',
        'attachment_url',
        'channel',
        'recipient_id',
        'mentioned_user_ids',
        'is_pinned',
        'read_at',
        'edited_at',
    ];

    protected $casts = [
        'mentioned_user_ids' => 'array',
        'is_pinned' => 'boolean',
        'read_at' => 'datetime',
        'edited_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reactions()
    {
        return $this->hasMany(EditorialMessageReaction::class);
    }

    public function bookmarks()
    {
        return $this->belongsToMany(User::class, 'editorial_message_bookmarks')->withTimestamps();
    }

    public function isBookmarkedBy(User $user): bool
    {
        return $this->bookmarks()->where('user_id', $user->id)->exists();
    }

    public function parent()
    {
        return $this->belongsTo(EditorialMessage::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(EditorialMessage::class, 'parent_id');
    }

    /**
     * Check if the message can be edited (within 15 minutes)
     */
    public function canEdit(): bool
    {
        return $this->user_id === auth()->id()
            && $this->created_at->diffInMinutes(now()) <= 15;
    }

    /**
     * Check if the message can be deleted
     */
    public function canDelete(): bool
    {
        return $this->user_id === auth()->id();
    }
}
