<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ForumCategory extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'slug', 'icon', 'color', 'order'];

    public function threads()
    {
        return $this->hasMany(Thread::class, 'category_id')->latest('updated_at');
    }
}
