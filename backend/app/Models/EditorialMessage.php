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
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
