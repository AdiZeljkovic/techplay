<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Services\InternalLinkService;
use App\Services\SchemaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SeoController extends Controller
{
    /**
     * SEO tools are staff-only; auth:sanctum alone is not enough.
     */
    private function authorizeStaff(): ?JsonResponse
    {
        $user = Auth::user();

        if (! $user || ! $user->isStaff()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return null;
    }

    /**
     * Get internal link suggestions for content
     */
    public function suggestLinks(Request $request)
    {
        if ($forbidden = $this->authorizeStaff()) {
            return $forbidden;
        }

        $request->validate([
            'content' => 'required|string|min:50',
            'exclude_id' => 'nullable|integer',
        ]);

        $suggestions = InternalLinkService::suggestLinks(
            $request->content,
            $request->exclude_id,
            5
        );

        $gameSuggestions = InternalLinkService::suggestGameLinks($request->content, 5);

        return response()->json([
            'data' => array_merge($suggestions, $gameSuggestions),
            'count' => count($suggestions) + count($gameSuggestions),
        ]);
    }

    /**
     * Get schemas for an article
     */
    public function getSchemas(Article $article)
    {
        if ($forbidden = $this->authorizeStaff()) {
            return $forbidden;
        }

        return response()->json([
            'data' => SchemaService::getAllSchemas($article),
        ]);
    }

    /**
     * Get orphan pages (no inbound links)
     */
    public function getOrphanPages()
    {
        if ($forbidden = $this->authorizeStaff()) {
            return $forbidden;
        }

        $orphans = InternalLinkService::findOrphanPages();

        return response()->json([
            'data' => $orphans,
            'count' => count($orphans),
        ]);
    }

    /**
     * Get inbound links for an article
     */
    public function getInboundLinks(Article $article)
    {
        if ($forbidden = $this->authorizeStaff()) {
            return $forbidden;
        }

        $links = InternalLinkService::findInboundLinks($article->id);

        return response()->json([
            'data' => $links,
            'count' => count($links),
        ]);
    }
}
