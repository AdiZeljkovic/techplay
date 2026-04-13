<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class GameCompany extends Model
{
    protected $table = 'game_companies';

    protected $fillable = [
        'moby_company_id',
        'name',
        'slug',
        'moby_url',
        'role',
        'games_count',
        'details_crawled_at',
    ];

    protected $casts = [
        'details_crawled_at' => 'datetime',
        'games_count'        => 'integer',
        'moby_company_id'    => 'integer',
    ];

    public function games(): BelongsToMany
    {
        return $this->belongsToMany(Game::class, 'game_company', 'game_company_id', 'game_id')
            ->withPivot('role');
    }
}
