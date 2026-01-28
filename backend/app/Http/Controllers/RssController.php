<?php

namespace App\Http\Controllers;

use App\Models\Article;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\URL;

class RssController extends Controller
{
    public function index(): Response
    {
        $articles = Article::where('status', 'published')
            ->with(['category', 'author'])
            ->orderBy('published_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL')), '/');
        $siteTitle = config('app.name', 'TechPlay');
        $feedUrl = URL::to('/feed');

        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">';
        $xml .= '<channel>';
        $xml .= "<title>{$siteTitle}</title>";
        $xml .= "<link>{$frontendUrl}</link>";
        $xml .= "<description>Your daily dose of tech and gaming news.</description>";
        $xml .= "<language>en-us</language>";
        $xml .= "<atom:link href=\"{$feedUrl}\" rel=\"self\" type=\"application/rss+xml\" />";

        foreach ($articles as $article) {
            $categoryType = $article->category->type ?? 'news';
            $typePath = $this->getArticleTypePath($categoryType);

            // Build frontend URL
            $link = "{$frontendUrl}/{$typePath}/{$article->slug}";

            // Dates
            $pubDate = $article->published_at
                ? $article->published_at->toRssString()
                : $article->created_at->toRssString();

            // Image
            $imageTag = '';
            if ($article->featured_image_url) {
                // Ensure absolute URL
                $imgUrl = $article->featured_image_url;
                // Basic check for extension to set mimetype
                $ext = pathinfo(parse_url($imgUrl, PHP_URL_PATH), PATHINFO_EXTENSION);
                $mime = match (strtolower($ext)) {
                    'png' => 'image/png',
                    'webp' => 'image/webp',
                    'gif' => 'image/gif',
                    default => 'image/jpeg',
                };

                $imageTag = "<enclosure url=\"{$imgUrl}\" length=\"0\" type=\"{$mime}\" />";
            }

            // Clean strings
            $title = htmlspecialchars($article->title);
            $description = htmlspecialchars($article->excerpt);

            $xml .= '<item>';
            $xml .= "<title>{$title}</title>";
            $xml .= "<link>{$link}</link>";
            $xml .= "<guid isPermaLink=\"true\">{$link}</guid>";
            $xml .= "<description>{$description}</description>";
            $xml .= "<pubDate>{$pubDate}</pubDate>";
            $xml .= $imageTag;
            $xml .= '</item>';
        }

        $xml .= '</channel>';
        $xml .= '</rss>';

        return response($xml, 200)
            ->header('Content-Type', 'text/xml; charset=UTF-8');
    }

    private function getArticleTypePath(string $type): string
    {
        return match ($type) {
            'review' => 'reviews',
            'hardware' => 'hardware',
            'tech' => 'tech', // Explicitly handle 'tech' just in case, though usually defaults to news or separate
            default => 'news',
        };
    }
}
