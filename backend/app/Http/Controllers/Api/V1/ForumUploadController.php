<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Screenshots, for the one kind of forum that cannot do without them.
 *
 * The purifier's forum profile stripped every <img>, so a gaming board could
 * not carry a screenshot, a photo of a build, or a benchmark graph — the three
 * things people come to a gaming forum to show each other.
 *
 * Images are allowed now, but only ones we wrote, and that distinction is the
 * security model: an <img> pointing at somebody else's server is a tracking
 * pixel that logs the IP of every reader who opens the thread, and a forum post
 * is exactly where one would be planted. The purifier refuses external hosts,
 * so this endpoint is the only way to get a URL that survives sanitising.
 *
 * No image library is used, on purpose. This installation has none — the one
 * service that imports Intervention refers to a package that is not in
 * composer.json — and the rest of the app stores uploads exactly as received.
 * So the checks here are the ones PHP can make on its own, and they are made
 * on the bytes rather than on anything the client claimed:
 *
 *   - getimagesize() decodes the header. A file that is not really a raster
 *     image fails here whatever its extension or declared MIME says.
 *   - the stored extension comes from the detected type, never from the name
 *     the client sent, so `shell.php` cannot arrive as `shell.php`.
 *   - JPEG metadata is stripped by walking the segments, which removes the GPS
 *     coordinates a phone writes into a photo of somebody's desk.
 *
 * Known limit, stated rather than papered over: PNG and WebP metadata chunks
 * are not stripped, because doing that properly needs a decoder. If
 * intervention/image is ever added (it needs ext-gd on the server), re-encoding
 * everything here would be the better answer.
 */
class ForumUploadController extends Controller
{
    private const MAX_BYTES = 8 * 1024 * 1024;

    /** Detected type => the extension it will be stored under. */
    private const ALLOWED = [
        IMAGETYPE_JPEG => 'jpg',
        IMAGETYPE_PNG => 'png',
        IMAGETYPE_GIF => 'gif',
        IMAGETYPE_WEBP => 'webp',
    ];

    public function store(Request $request)
    {
        $request->validate([
            'image' => ['required', 'file', 'max:8192'],
        ]);

        $user = Auth::user();
        $file = $request->file('image');

        // The real test: can PHP decode a header out of these bytes at all.
        $info = @getimagesize($file->getPathname());

        if ($info === false || ! isset(self::ALLOWED[$info[2]])) {
            return response()->json([
                'message' => 'That file is not an image we accept. Use JPG, PNG, GIF or WebP.',
            ], 422);
        }

        [$width, $height] = $info;
        $extension = self::ALLOWED[$info[2]];

        try {
            $bytes = file_get_contents($file->getPathname());

            if ($bytes === false || strlen($bytes) > self::MAX_BYTES) {
                return response()->json(['message' => 'That image is too large. The limit is 8 MB.'], 422);
            }

            if ($info[2] === IMAGETYPE_JPEG) {
                $bytes = $this->stripJpegMetadata($bytes);
            }

            // Name and folder are ours. A per-user folder keeps one member's
            // uploads countable, and the uuid means no filename collides and
            // none can be guessed.
            $path = 'forum/'.$user->id.'/'.Str::uuid().'.'.$extension;
            Storage::disk('public')->put($path, $bytes);

            return response()->json([
                'url' => Storage::disk('public')->url($path),
                'width' => $width,
                'height' => $height,
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Forum image upload failed', ['user' => $user->id, 'exception' => $e]);

            return response()->json(['message' => 'That image could not be stored. Try again in a moment.'], 422);
        }
    }

    /**
     * Drop every APPn segment from a JPEG, keeping the image itself.
     *
     * APP1 is where EXIF lives, and EXIF is where a phone writes the GPS
     * coordinates of the room the photo was taken in. Someone posting a picture
     * of their desk should not be posting their address with it.
     *
     * Walks the segment table rather than pattern-matching: markers between
     * D0 and D9 carry no length field, and the scan data after SOS is copied
     * wholesale because it is not segmented at all.
     */
    private function stripJpegMetadata(string $jpeg): string
    {
        if (substr($jpeg, 0, 2) !== "\xFF\xD8") {
            return $jpeg;
        }

        $out = "\xFF\xD8";
        $at = 2;
        $length = strlen($jpeg);

        while ($at < $length - 1) {
            if ($jpeg[$at] !== "\xFF") {
                // Not where a marker should be; keep the rest verbatim rather
                // than risk corrupting an image we did not understand.
                return $out.substr($jpeg, $at);
            }

            $marker = ord($jpeg[$at + 1]);

            // Start of scan: everything after it is compressed data.
            if ($marker === 0xDA) {
                return $out.substr($jpeg, $at);
            }

            // Standalone markers carry no payload.
            if ($marker === 0xD8 || ($marker >= 0xD0 && $marker <= 0xD9) || $marker === 0x01) {
                $out .= substr($jpeg, $at, 2);
                $at += 2;

                continue;
            }

            if ($at + 4 > $length) {
                return $out.substr($jpeg, $at);
            }

            $segmentLength = unpack('n', substr($jpeg, $at + 2, 2))[1];
            $segment = substr($jpeg, $at, 2 + $segmentLength);

            // APP0..APPF and the comment segment go; quantisation tables,
            // Huffman tables and the frame header stay, or there is no image.
            $isMetadata = ($marker >= 0xE0 && $marker <= 0xEF) || $marker === 0xFE;

            if (! $isMetadata) {
                $out .= $segment;
            }

            $at += 2 + $segmentLength;
        }

        return $out;
    }
}
