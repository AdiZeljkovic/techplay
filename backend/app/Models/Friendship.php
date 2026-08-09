<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Friendship extends Model
{
    use HasFactory;

    protected $fillable = [
        'sender_id',
        'receiver_id',
        'status',
    ];

    /**
     * Has either of these two blocked the other?
     *
     * Blocking wrote a row and rendered a "blocked" list, but nothing ever
     * read it — the block was cosmetic and the blocked party kept messaging.
     */
    public static function blockExistsBetween(int $a, int $b): bool
    {
        return static::where('status', 'blocked')
            ->where(function ($q) use ($a, $b) {
                $q->where(fn ($i) => $i->where('sender_id', $a)->where('receiver_id', $b))
                    ->orWhere(fn ($i) => $i->where('sender_id', $b)->where('receiver_id', $a));
            })
            ->exists();
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }
}
