<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdCampaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'format',
        'width',
        'height',
        'platforms',
        'device_targeting',
        'cpm_price',
        'description',
        'image_url',
        'code_block',
        'target_url',
        'position',
        'priority',
        'start_date',
        'end_date',
        'is_active',
        'view_count',
        'click_count',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
        'platforms' => 'array',
        'cpm_price' => 'decimal:2',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('start_date')
                    ->orWhere('start_date', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('end_date')
                    ->orWhere('end_date', '>=', now());
            });
    }

    public function scopeForPosition($query, $position)
    {
        return $query->where('position', $position);
    }

    public function scopeForDevice($query, $device)
    {
        return $query->where(function ($q) use ($device) {
            $q->where('device_targeting', 'all')
                ->orWhere('device_targeting', $device);
        });
    }

    public function scopeForPlatform($query, $platform)
    {
        return $query->where(function ($q) use ($platform) {
            $q->whereNull('platforms')
                ->orWhereJsonContains('platforms', $platform);
        });
    }

    /**
     * Calculate Click Through Rate (CTR)
     */
    public function getCtrAttribute(): float
    {
        if ($this->view_count == 0) {
            return 0.0;
        }

        return round(($this->click_count / $this->view_count) * 100, 2);
    }

    /**
     * Calculate estimated revenue based on CPM
     */
    public function getEstimatedRevenueAttribute(): float
    {
        if (! $this->cpm_price || $this->view_count == 0) {
            return 0.0;
        }

        return round(($this->view_count / 1000) * $this->cpm_price, 2);
    }
}
