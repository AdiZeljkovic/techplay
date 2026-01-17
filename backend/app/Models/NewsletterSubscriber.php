<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NewsletterSubscriber extends Model
{
    protected $fillable = ['email', 'is_active', 'verification_token', 'email_verified_at'];

    // SECURITY: Never expose verification token in JSON responses
    protected $hidden = ['verification_token'];
}
