<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EditorialMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'content',
        'attachment_url',
        'channel',
        'recipient_id',
        'mentioned_user_ids',
        'is_pinned',
        'read_at',
    ];

    protected $casts = [
        'mentioned_user_ids' => 'array',
        'is_pinned' => 'boolean',
        'read_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
