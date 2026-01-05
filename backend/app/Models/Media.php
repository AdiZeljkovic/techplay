<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory;

    protected $fillable = [
        'title',
        'path',
        'alt_text',
        'mime_type',
        'size',
    ];

    protected $appends = ['url'];

    public function getUrlAttribute()
    {
        return \Illuminate\Support\Facades\Storage::url($this->path);
    }
}
