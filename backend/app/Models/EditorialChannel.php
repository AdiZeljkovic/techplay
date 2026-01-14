<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EditorialChannel extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
        'color',
        'sort_order',
        'is_private',
        'allowed_roles',
    ];

    protected $casts = [
        'is_private' => 'boolean',
        'allowed_roles' => 'array',
    ];
}
