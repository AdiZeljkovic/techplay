<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'parent_id',
        'sender_id',
        'receiver_id',
        'subject',
        'body',
        'is_read',
        'deleted_by_sender',
        'deleted_by_receiver',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'deleted_by_sender' => 'boolean',
        'deleted_by_receiver' => 'boolean',
    ];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
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
