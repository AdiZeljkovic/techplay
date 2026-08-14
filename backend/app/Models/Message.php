<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'conversation_id',
        'parent_id',
        'sender_id',
        'receiver_id',
        'subject',
        'body',
        'is_read',
        'attachment_path',
        'attachment_type',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    /**
     * `deleted_by_sender` and `deleted_by_receiver` are gone from here.
     *
     * They were a delete-for-me-only design that never shipped: nothing ever
     * wrote them and nothing ever read them. What did ship is unsend —
     * ChatController::destroyMessage deletes the row for everyone, which is
     * what its own docblock says it is for. Keeping two casts and a $hidden
     * entry for flags that do nothing tells the next reader this model has a
     * per-side soft delete, and it does not.
     *
     * The columns themselves are left in the table; dropping them is a data
     * decision, not a cleanup.
     */

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function reactions()
    {
        return $this->hasMany(MessageReaction::class);
    }

    public function parent()
    {
        return $this->belongsTo(Message::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(Message::class, 'parent_id');
    }
}
