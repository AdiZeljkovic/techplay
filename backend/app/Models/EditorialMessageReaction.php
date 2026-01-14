<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EditorialMessageReaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'editorial_message_id',
        'user_id',
        'emoji',
    ];

    public function message()
    {
        return $this->belongsTo(EditorialMessage::class, 'editorial_message_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
