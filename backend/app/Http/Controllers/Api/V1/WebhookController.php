<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * Handle generic webhooks from the application itself.
     * Use this to trigger Discord notifications manually or from other parts of the app.
     * 
     * Endpoint: POST /api/v1/webhooks/discord/notify
     * Body: { "type": "news", "data": { ... } }
     */
    public function notify(Request $request)
    {
        $type = $request->input('type');
        $data = $request->input('data');

        $webhookUrl = config('services.discord.webhook_url');

        if (!$webhookUrl) {
            return response()->json(['message' => 'Discord Webhook URL not configured'], 500);
        }

        try {
            if ($type === 'news') {
                $this->sendNewsNotification($webhookUrl, $data);
            } elseif ($type === 'forum_thread') {
                $this->sendForumNotification($webhookUrl, $data);
            }

            return response()->json(['message' => 'Notification sent']);
        } catch (\Exception $e) {
            Log::error('Failed to send Discord webhook', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to send notification'], 500);
        }
    }

    private function sendNewsNotification($url, $article)
    {
        Http::post($url, [
            'content' => "📰 **New Article Published!**",
            'embeds' => [
                [
                    'title' => $article['title'],
                    'description' => $article['excerpt'],
                    'url' => config('app.frontend_url') . '/news/' . $article['slug'],
                    'color' => 5814783, // #5865F2
                    'image' => [
                        'url' => $article['featured_image'] ?? null
                    ],
                    'footer' => [
                        'text' => 'TechPlay.gg News'
                    ]
                ]
            ]
        ]);
    }

    private function sendForumNotification($url, $thread)
    {
        Http::post($url, [
            'content' => "💬 **New Forum Discussion!**",
            'embeds' => [
                [
                    'title' => $thread['title'],
                    'description' => "Started by " . ($thread['author_name'] ?? 'Unknown'),
                    'url' => config('app.frontend_url') . '/forum/threads/' . $thread['slug'],
                    'color' => 15158332, // #E74C3C
                    'footer' => [
                        'text' => 'TechPlay.gg Forum'
                    ]
                ]
            ]
        ]);
    }
}
