<?php

namespace App\Services;

use App\Models\MailCampaignRecipient;

/**
 * The written body, prepared for one reader.
 *
 * Two jobs, both done here rather than asked of the person writing the mail:
 * every link is pointed through the counter, and the open pixel is appended.
 * An editor should be able to paste a link and have it counted without knowing
 * that counting exists.
 *
 * What is deliberately left alone:
 *
 *   mailto: and tel:      not pages, nothing to count, and rewriting them
 *                         breaks the client's handler
 *   #anchors              there is no page to arrive at
 *   the unsubscribe link  it must work when everything else has failed. If our
 *                         tracking route is down or the token is stale, the way
 *                         out has to keep working, because "I could not
 *                         unsubscribe" is a spam complaint and a spam complaint
 *                         is what a small sender cannot afford
 *   images                the pixel is ours; theirs are not clicks
 */
class CampaignBody
{
    /** Marks a link the editor wants left exactly as written. */
    public const NO_TRACK_ATTRIBUTE = 'data-no-track';

    public function forRecipient(string $html, MailCampaignRecipient $recipient): string
    {
        return $this->pixel($this->trackLinks($html, $recipient), $recipient);
    }

    /**
     * Turn the editor's image paths into addresses a mail client can reach.
     *
     * The rich editor stores an upload and writes `src="/storage/…"`, which is
     * correct on the site and meaningless in an inbox: there is no page for a
     * relative path to be relative to, so every picture arrives broken. Nothing
     * warns about it, because the preview and the admin are both on a domain
     * where the path happens to resolve.
     */
    public function absoluteImages(string $html): string
    {
        $base = rtrim((string) config('app.url'), '/');

        return (string) preg_replace_callback(
            '/(<img\s[^>]*?src=)(["\'])(\/[^"\']*)\2/i',
            fn (array $m) => $m[1].$m[2].$base.$m[3].$m[2],
            $html
        );
    }

    /**
     * Point every outbound link through the click counter.
     */
    public function trackLinks(string $html, MailCampaignRecipient $recipient): string
    {
        $unsubscribe = $recipient->unsubscribeUrl();

        return (string) preg_replace_callback(
            '/<a\s([^>]*?)href=(["\'])(.*?)\2([^>]*)>/i',
            function (array $m) use ($recipient, $unsubscribe): string {
                [$whole, $before, $quote, $href, $after] = $m;

                $skip = str_contains($before.$after, self::NO_TRACK_ATTRIBUTE)
                    || $href === $unsubscribe
                    || ! preg_match('#^https?://#i', $href);

                if ($skip) {
                    return $whole;
                }

                return sprintf(
                    '<a %shref=%s%s%s%s>',
                    $before,
                    $quote,
                    e($recipient->clickUrl($href)),
                    $quote,
                    $after
                );
            },
            $html
        );
    }

    /**
     * The 1x1 that reports the message was opened.
     *
     * Worth being honest about in the admin, and the reason the number gets a
     * footnote there: Apple Mail Privacy Protection fetches this on the
     * reader's behalf whether or not they looked, and Gmail proxies it. The
     * open rate is a floor and a mood, not a measurement.
     */
    public function pixel(string $html, MailCampaignRecipient $recipient): string
    {
        $img = sprintf(
            '<img src="%s" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />',
            e($recipient->openUrl())
        );

        // Inside the body if there is one, so a client that trims after
        // </body> does not trim the pixel with it.
        if (stripos($html, '</body>') !== false) {
            return preg_replace('#</body>#i', $img.'</body>', $html, 1) ?? $html.$img;
        }

        return $html.$img;
    }
}
