<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Thread extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'content',
        'author_id',
        'category_id',
        'is_pinned',
        'is_locked',
        'view_count'
    ];

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    public function latestPost()
    {
        return $this->hasOne(Post::class)->latestOfMany();
    }
}
