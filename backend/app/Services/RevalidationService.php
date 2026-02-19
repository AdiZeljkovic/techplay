<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RevalidationService
{
    protected ?string $frontendUrl;
    protected ?string $revalidateToken;

    public function __construct()
    {
        $this->frontendUrl = config('app.frontend_url');
        $this->revalidateToken = config('services.revalidate.secret_token');
    }

    /**
     * Trigger Next.js on-demand revalidation for an article
     *
     * @param string $slug Article slug
     * @param string $category Category (news, reviews, tech, guides)
     * @return bool Success status
     */
    public function revalidateArticle(string $slug, string $category): bool
    {
        if (!$this->revalidateToken || !$this->frontendUrl) {
            Log::warning('Revalidation skipped: Missing REVALIDATE_SECRET_TOKEN or FRONTEND_URL');
            return false;
        }

        try {
            $response = Http::timeout(5)
                ->withHeaders([
                    'x-revalidate-token' => $this->revalidateToken,
                    'Content-Type' => 'application/json',
                ])
                ->post("{$this->frontendUrl}/api/revalidate", [
                    'type' => 'article',
                    'slug' => $slug,
                    'category' => $category,
                ]);

            if ($response->successful()) {
                Log::info("Revalidated article: {$category}/{$slug}");
                return true;
            }

            Log::error('Revalidation failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return false;
        } catch (\Exception $e) {
            Log::error('Revalidation exception: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Revalidate homepage
     */
    public function revalidateHomepage(): bool
    {
        if (!$this->revalidateToken || !$this->frontendUrl) {
            return false;
        }

        try {
            $response = Http::timeout(5)
                ->withHeaders([
                    'x-revalidate-token' => $this->revalidateToken,
                ])
                ->post("{$this->frontendUrl}/api/revalidate", [
                    'type' => 'homepage',
                ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('Homepage revalidation exception: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Revalidate category listing page
     */
    public function revalidateCategory(string $category): bool
    {
        if (!$this->revalidateToken || !$this->frontendUrl) {
            return false;
        }

        try {
            $response = Http::timeout(5)
                ->withHeaders([
                    'x-revalidate-token' => $this->revalidateToken,
                ])
                ->post("{$this->frontendUrl}/api/revalidate", [
                    'type' => 'category',
                    'category' => $category,
                ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('Category revalidation exception: ' . $e->getMessage());
            return false;
        }
    }
}
