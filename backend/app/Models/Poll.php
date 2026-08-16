<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Poll extends Model
{
    protected $fillable = [
        'thread_id',
        'question',
        'allows_multiple',
        'hide_results_until_voted',
        'closes_at',
    ];

    protected $casts = [
        'allows_multiple' => 'boolean',
        'hide_results_until_voted' => 'boolean',
        'closes_at' => 'datetime',
    ];

    public function thread()
    {
        return $this->belongsTo(Thread::class);
    }

    public function options()
    {
        return $this->hasMany(PollOption::class)->orderBy('position');
    }

    public function votes()
    {
        return $this->hasMany(PollVote::class);
    }

    /** A closed poll still shows its result; it just stops taking votes. */
    public function isClosed(): bool
    {
        return $this->closes_at !== null && $this->closes_at->isPast();
    }
}
