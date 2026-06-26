<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Gta6Vehicle extends Model
{
    protected $table = 'gta6_vehicles';

    protected $fillable = [
        'slug',
        'name',
        'vehicle_class',
        'real_equivalent',
        'description',
        'image',
        'gallery',
        'status',
        'is_published',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'gallery'      => 'array',
            'is_published' => 'boolean',
            'sort_order'   => 'integer',
        ];
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }
}
