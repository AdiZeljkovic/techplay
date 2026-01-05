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

class SubmitIndexNow implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $urls;

    /**
     * Create a new job instance.
     *
     * @param array|string $urls
     */
    public function __construct($urls)
    {
        $this->urls = is_array($urls) ? $urls : [$urls];
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if (!SiteSetting::get('seo_indexnow_enabled')) {
            return;
        }

        $host = parse_url(config('app.url'), PHP_URL_HOST); // e.g. techplay.gg
        $key = SiteSetting::get('seo_indexnow_key');
        $keyLocation = config('app.url') . "/{$key}.txt";

        if (!$key) {
            Log::warning('IndexNow: API Key not configured.');
            return;
        }

        // IndexNow Endpoint (Bing acts as a proxy for Yandex/Seznam too)
        $endpoint = 'https://api.indexnow.org/indexnow';

        $payload = [
            'host' => $host,
            'key' => $key,
            'keyLocation' => $keyLocation,
            'urlList' => $this->urls,
        ];

        try {
            $response = Http::post($endpoint, $payload);

            if ($response->successful()) {
                Log::info('IndexNow: Submitted ' . count($this->urls) . ' URLs successfully.');
            } else {
                Log::error('IndexNow: Submission failed.', ['status' => $response->status(), 'body' => $response->body()]);
            }
        } catch (\Exception $e) {
            Log::error('IndexNow: Exception during submission.', ['message' => $e->getMessage()]);
        }
    }
}
