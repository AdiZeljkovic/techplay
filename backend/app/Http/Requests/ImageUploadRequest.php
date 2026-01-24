<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Image Upload Validation Request
 *
 * SECURITY: Validates image uploads to prevent malicious files
 * - File type validation (MIME type + extension)
 * - File size limits
 * - Image dimension validation
 * - Prevents executable files disguised as images
 */
class ImageUploadRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by route middleware
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'image' => [
                'required',
                'file',
                'image', // Must be image (jpg, jpeg, png, bmp, gif, svg, webp)
                'mimes:jpeg,jpg,png,gif,webp', // Allowed MIME types
                'max:5120', // Max 5MB (5120 KB)
                'dimensions:max_width=4096,max_height=4096', // Max 4K resolution
            ],
        ];
    }

    /**
     * Get custom error messages
     */
    public function messages(): array
    {
        return [
            'image.required' => 'Image file is required.',
            'image.image' => 'File must be a valid image.',
            'image.mimes' => 'Image must be JPEG, PNG, GIF, or WebP format.',
            'image.max' => 'Image size must not exceed 5MB.',
            'image.dimensions' => 'Image dimensions must not exceed 4096x4096 pixels.',
        ];
    }

    /**
     * Validate image after basic validation passes
     *
     * SECURITY: Additional checks to prevent file upload attacks
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->hasFile('image')) {
                $file = $this->file('image');

                // SECURITY: Verify actual file content matches MIME type
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $mimeType = finfo_file($finfo, $file->getPathname());
                finfo_close($finfo);

                $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!in_array($mimeType, $allowedMimes)) {
                    $validator->errors()->add('image', 'File content does not match allowed image types.');
                }

                // SECURITY: Check for executable code in image files
                if ($this->containsExecutableCode($file->getPathname())) {
                    $validator->errors()->add('image', 'Image file contains suspicious content.');
                }
            }
        });
    }

    /**
     * Detect executable code in image files
     *
     * SECURITY: Prevents PHP/JS code injection in image uploads
     */
    private function containsExecutableCode(string $filePath): bool
    {
        $content = file_get_contents($filePath);

        // Check for common exploit patterns
        $patterns = [
            '/<\?php/i',
            '/<script/i',
            '/eval\s*\(/i',
            '/exec\s*\(/i',
            '/system\s*\(/i',
            '/passthru\s*\(/i',
            '/shell_exec/i',
            '/base64_decode\s*\(/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $content)) {
                return true;
            }
        }

        return false;
    }
}
