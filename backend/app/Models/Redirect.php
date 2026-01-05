<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Redirect extends Model
{
    protected $fillable = [
        'source_url',
        'target_url',
        'status_code',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'status_code' => 'integer',
    ];

    // Auto-format source_url to start with / and remove trailing slash
    public function setSourceUrlAttribute($value)
    {
        $this->attributes['source_url'] = '/' . ltrim(rtrim($value, '/'), '/');
    }

    // Auto-format target_url to start with / if it's relative
    public function setTargetUrlAttribute($value)
    {
        if (Str::startsWith($value, 'http')) {
            $this->attributes['target_url'] = $value;
        } else {
            $this->attributes['target_url'] = '/' . ltrim(rtrim($value, '/'), '/');
        }
    }
}
