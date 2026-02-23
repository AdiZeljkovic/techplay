<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class MediaKitSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'type',
        'section',
        'order',
        'is_visible',
    ];

    protected $casts = [
        'is_visible' => 'boolean',
        'order' => 'integer',
    ];

    /**
     * Get the typed value based on the type column
     */
    protected function typedValue(): Attribute
    {
        return Attribute::make(
            get: function () {
                return match($this->type) {
                    'number' => (int) $this->value,
                    'boolean' => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
                    'json' => json_decode($this->value, true),
                    default => $this->value,
                };
            }
        );
    }

    /**
     * Scope query to specific section
     */
    public function scopeSection($query, string $section)
    {
        return $query->where('section', $section);
    }

    /**
     * Scope query to visible items only
     */
    public function scopeVisible($query)
    {
        return $query->where('is_visible', true);
    }

    /**
     * Scope query to ordered items
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order');
    }
}
