<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Media extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory;

    protected $table = 'media';

    protected $fillable = [
        'title',
        'path',
        'webp_path',
        'alt_text',
        'mime_type',
        'size',
        'width',
        'height',
        'collection',
        'uploaded_by',
    ];

    protected $appends = ['url', 'webp_url', 'human_size'];

    /**
     * Get the user who uploaded this media
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getUrlAttribute(): string
    {
        return Storage::url($this->path);
    }

    public function getWebpUrlAttribute(): ?string
    {
        return $this->webp_path
            ? Storage::url($this->webp_path)
            : null;
    }

    /**
     * Get human readable file size
     */
    public function getHumanSizeAttribute(): string
    {
        $bytes = $this->size ?? 0;
        $units = ['B', 'KB', 'MB', 'GB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Check if this is an image
     */
    public function isImage(): bool
    {
        return str_starts_with($this->mime_type ?? '', 'image/');
    }

    /**
     * Scope to filter by collection
     */
    public function scopeCollection($query, string $collection)
    {
        return $query->where('collection', $collection);
    }

    /**
     * Scope to only get images
     */
    public function scopeImages($query)
    {
        return $query->where('mime_type', 'like', 'image/%');
    }

    /**
     * Create media record from an uploaded file path
     */
    public static function createFromPath(string $path, ?string $collection = 'default', ?int $uploadedBy = null): self
    {
        $fullPath = Storage::disk('public')->path($path);
        $fileName = basename($path);

        $media = new self([
            'title' => pathinfo($fileName, PATHINFO_FILENAME),
            'path' => $path,
            'mime_type' => file_exists($fullPath) ? mime_content_type($fullPath) : null,
            'size' => file_exists($fullPath) ? filesize($fullPath) : 0,
            'collection' => $collection,
            'uploaded_by' => $uploadedBy,
        ]);

        // Get image dimensions if it's an image
        if ($media->isImage() && function_exists('getimagesize') && file_exists($fullPath)) {
            $imageInfo = @getimagesize($fullPath);
            if ($imageInfo) {
                $media->width = $imageInfo[0];
                $media->height = $imageInfo[1];
            }
        }

        $media->save();

        return $media;
    }
}
