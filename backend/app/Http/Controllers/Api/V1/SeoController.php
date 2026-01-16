<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\InternalLinkService;
use App\Services\SchemaService;
use App\Models\Article;
use Illuminate\Http\Request;

class SeoController extends Controller
{
    /**
     * Get internal link suggestions for content
     */
    public function suggestLinks(Request $request)
    {
        $request->validate([
            'content' => 'required|string|min:50',
            'exclude_id' => 'nullable|integer',
        ]);

        $suggestions = InternalLinkService::suggestLinks(
            $request->content,
            $request->exclude_id,
            5
        );

        return response()->json([
            'data' => $suggestions,
            'count' => count($suggestions),
        ]);
    }

    /**
     * Get schemas for an article
     */
    public function getSchemas(Article $article)
    {
        return response()->json([
            'data' => SchemaService::getAllSchemas($article),
        ]);
    }

    /**
     * Get orphan pages (no inbound links)
     */
    public function getOrphanPages()
    {
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
        $links = InternalLinkService::findInboundLinks($article->id);

        return response()->json([
            'data' => $links,
            'count' => count($links),
        ]);
    }
}
