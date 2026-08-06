<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Achievement extends Model
{
    protected $fillable = [
        'name',
        'description',
        'icon_path',
        'points',
        'criteria_type',
        'criteria_value',
        'is_hidden',
    ];

    protected $casts = [
        'is_hidden' => 'boolean',
    ];

    /**
     * The icon path a client should request, stamped with the artwork's own
     * version.
     *
     * Badge art gets replaced in place — same achievement, same filename — so
     * nothing in the URL changes and every cache in the chain keeps serving
     * what it already has. Cloudflare holds these for four hours and does it
     * per datacentre, so clearing one browser is not enough: another visitor's
     * edge can still be on the old file.
     *
     * The stamp is the file's own mtime, not the row's updated_at, so it moves
     * the moment the art is swapped. Tying it to the row would mean somebody
     * has to remember to touch the record every time a PNG is replaced, and
     * that is exactly the step that gets forgotten.
     *
     * Deliberately not an accessor on icon_path itself: that attribute is also
     * used to build filesystem paths, and a query string breaks file_exists.
     */
    public function versionedIconPath(): ?string
    {
        return self::stampPath($this->icon_path, $this->updated_at?->timestamp);
    }

    /**
     * @param  int|null  $fallback  used when the file cannot be reached
     */
    public static function stampPath(?string $path, ?int $fallback = null): ?string
    {
        if (! $path) {
            return null;
        }

        return $path.'?v='.(self::artworkVersion($path) ?? $fallback ?? 0);
    }

    /** mtime of the artwork, remembered for the request so a page of badges is one stat each. */
    protected static function artworkVersion(string $path): ?int
    {
        static $seen = [];

        if (! array_key_exists($path, $seen)) {
            $full = storage_path('app/public/'.$path);
            $seen[$path] = is_file($full) ? filemtime($full) : null;
        }

        return $seen[$path];
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_achievements')
            ->withPivot('unlocked_at')
            ->withTimestamps();
    }
}
