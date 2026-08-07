<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * An OAuth link to an outside platform, with its secrets encrypted at
 * rest. Reading through the model decrypts transparently; reading the
 * table any other way yields ciphertext — which is the point.
 */
class UserIntegration extends Model
{
    protected $fillable = ['user_id', 'provider', 'access_token', 'refresh_token'];

    protected $hidden = ['access_token', 'refresh_token'];

    protected function casts(): array
    {
        return [
            'access_token' => 'encrypted',
            'refresh_token' => 'encrypted',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
