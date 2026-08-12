<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LastDiscVote extends Model
{
    protected $fillable = ['user_id', 'choice', 'voter_hash'];

    protected $hidden = ['voter_hash'];
}
