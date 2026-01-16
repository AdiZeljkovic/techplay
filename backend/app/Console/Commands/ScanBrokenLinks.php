<?php

namespace App\Console\Commands;

use App\Models\Article;
use App\Models\BrokenLink;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class ScanBrokenLinks extends Command
{
    protected $signature = 'seo:scan-links {--limit=100 : Max articles to scan}';
    protected $description = 'Scan articles for broken links';

    public function handle()
    {
        $this->info('🔍 Scanning articles for broken links...');

        $limit = (int) $this->option('limit');
        $articles = Article::where('status', 'published')
            ->orderBy('updated_at', 'desc')
            ->limit($limit)
            ->get();

        $this->output->progressStart($articles->count());

        $totalLinks = 0;
        $brokenCount = 0;

        foreach ($articles as $article) {
            $links = $this->extractLinks($article->content);
            $totalLinks += count($links);

            foreach ($links as $url) {
                $result = $this->checkLink($url);

                if (!$result['ok']) {
                    $brokenCount++;
                    $this->recordBrokenLink($article->id, $url, $result);
                }
            }

            $this->output->progressAdvance();
        }

        $this->output->progressFinish();

        $this->newLine();
        $this->info("📊 Scan complete!");
        $this->table(
            ['Metric', 'Value'],
            [
                ['Articles scanned', $articles->count()],
                ['Total links checked', $totalLinks],
                ['Broken links found', $brokenCount],
            ]
        );

        return 0;
    }

    /**
     * Extract all links from content
     */
    private function extractLinks(string $content): array
    {
        preg_match_all('/href=["\']([^"\']+)["\']/', $content, $matches);

        $links = [];
        foreach ($matches[1] ?? [] as $url) {
            // Skip internal relative links, anchors, mailto, tel
            if (
                str_starts_with($url, '#') ||
                str_starts_with($url, '/') ||
                str_starts_with($url, 'mailto:') ||
                str_starts_with($url, 'tel:') ||
                str_starts_with($url, 'javascript:')
            ) {
                continue;
            }

            // Only check external HTTP(S) links
            if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://')) {
                $links[] = $url;
            }
        }

        return array_unique($links);
    }

    /**
     * Check if a link is accessible
     */
    private function checkLink(string $url): array
    {
        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'User-Agent' => 'TechPlay Link Checker/1.0',
                ])
                ->head($url);

            $statusCode = $response->status();

            return [
                'ok' => $statusCode >= 200 && $statusCode < 400,
                'status_code' => $statusCode,
                'error_message' => null,
            ];
        } catch (\Exception $e) {
            return [
                'ok' => false,
                'status_code' => 0,
                'error_message' => substr($e->getMessage(), 0, 255),
            ];
        }
    }

    /**
     * Record a broken link in the database
     */
    private function recordBrokenLink(int $articleId, string $url, array $result): void
    {
        BrokenLink::updateOrCreate(
            [
                'article_id' => $articleId,
                'url' => substr($url, 0, 500),
            ],
            [
                'status_code' => $result['status_code'],
                'error_message' => $result['error_message'],
                'last_checked_at' => now(),
                'is_fixed' => false,
            ]
        );
    }
}
