<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class GtaLocation extends Model
{
    protected $fillable = [
        'gtadb_key',
        'name',
        'game_x',
        'game_y',
        'lat',
        'lng',
        'real_address',
        'categories',
        'is_unconfirmed',
    ];

    protected function casts(): array
    {
        return [
            'categories'     => 'array',
            'is_unconfirmed' => 'boolean',
            'game_x'         => 'float',
            'game_y'         => 'float',
            'lat'            => 'float',
            'lng'            => 'float',
        ];
    }

    public function scopeInCategory(Builder $query, string $category): Builder
    {
        return $query->whereJsonContains('categories', $category);
    }

    public function scopeConfirmed(Builder $query): Builder
    {
        return $query->where('is_unconfirmed', false);
    }
}
