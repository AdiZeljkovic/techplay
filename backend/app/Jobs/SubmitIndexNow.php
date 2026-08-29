<?php

namespace App\Jobs;

use App\Models\SiteSetting;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class SubmitIndexNow implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Same endpoint, batch form. */
    public int $tries = 3;

    /** Seconds between attempts. */
    public array $backoff = [30, 120, 600];

    /** A queue job that dies quietly is a job nobody knows stopped. */
    public function failed(Throwable $e): void
    {
        Log::error('SubmitIndexNow failed', ['error' => $e->getMessage()]);
    }

    /** @var array<int, string> */
    public array $urls;

    /**
     * Create a new job instance.
     *
     * @param  array<int, string>|string  $urls
     */
    public function __construct(array|string $urls)
    {
        $this->urls = is_array($urls) ? $urls : [$urls];
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if (! SiteSetting::get('seo_indexnow_enabled')) {
            return;
        }

        /*
         * The site's own address, not the API's.
         *
         * IndexNow requires the key file to sit on the same host as the URLs
         * being submitted. The URLs here are frontend URLs — techplay.gg — and
         * both `host` and `keyLocation` were built from `app.url`, which is
         * api-beta.techplay.gg. Every submission since this shipped named a
         * host that does not match the pages it was announcing, and the comment
         * beside the line even said "e.g. techplay.gg" while producing the
         * other one.
         *
         * `site_url` rather than `frontend_url`, because that value doubles as
         * the CORS allow-list and may hold several origins separated by commas.
         * Next serves `/{key}.txt` by proxy from the backend for exactly this
         * reason, so the file is genuinely there.
         */
        $siteUrl = rtrim((string) config('app.site_url'), '/');
        $host = parse_url($siteUrl, PHP_URL_HOST);
        $key = SiteSetting::get('seo_indexnow_key');

        if (! $key) {
            Log::warning('IndexNow: API Key not configured.');

            return;
        }

        $keyLocation = "{$siteUrl}/{$key}.txt";

        // IndexNow Endpoint (Bing acts as a proxy for Yandex/Seznam too)
        $endpoint = 'https://api.indexnow.org/indexnow';

        $payload = [
            'host' => $host,
            'key' => $key,
            'keyLocation' => $keyLocation,
            'urlList' => $this->urls,
        ];

        try {
            // Ten seconds, not the thirty Laravel defaults to. This runs on the
            // `default` queue behind enrichment and library syncs, and with
            // tries=3 an unresponsive endpoint would hold a worker for a minute
            // and a half to tell a search engine about a URL it will crawl
            // anyway.
            $response = Http::timeout(10)->connectTimeout(3)->post($endpoint, $payload);

            if ($response->successful()) {
                Log::info('IndexNow: Submitted '.count($this->urls).' URLs successfully.');
            } else {
                Log::error('IndexNow: Submission failed.', ['status' => $response->status(), 'body' => $response->body()]);
            }
        } catch (\Exception $e) {
            Log::error('IndexNow: Exception during submission.', ['message' => $e->getMessage()]);
        }
    }
}
