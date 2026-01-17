<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory;

    protected $fillable = [
        'title',
        'path',
        'webp_path',
        'alt_text',
        'mime_type',
        'size',
    ];

    protected $appends = ['url', 'webp_url'];

    public function getUrlAttribute()
    {
        return \Illuminate\Support\Facades\Storage::url($this->path);
    }

    public function getWebpUrlAttribute()
    {
        return $this->webp_path
            ? \Illuminate\Support\Facades\Storage::url($this->webp_path)
            : null;
    }
}

