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
     * What the stylesheet says, written onto the tags themselves.
     *
     * The template styles the written body through a `<style>` block and the
     * `.cbody` classes. That is the right way to write CSS and the wrong way
     * to write mail: plenty of clients strip a stylesheet out of the head
     * before they render, and a rule that never arrives is a rule that never
     * applied. The body then inherits the client's own default colour, which
     * on our near-black ground is dark text on dark — the whole message
     * invisible, while the masthead above it looks perfect because every part
     * of it carries its style inline.
     *
     * Seen on 21 Sep 2026 in a real inbox: hero flawless, not one word of the
     * body legible.
     *
     * The classes stay. A client that does read the stylesheet gets the same
     * answer twice, and an inline style wins over a class in any case, so
     * this can only add.
     *
     * Colours are the template's own, copied rather than invented, so the two
     * cannot drift into disagreeing about what grey the body is.
     */
    private const INLINE = [
        'p' => "margin:0 0 16px 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:15px; line-height:25px; color:#A9A9B4;",
        'ul' => "margin:0 0 16px 0; padding-left:20px; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:15px; line-height:25px; color:#A9A9B4;",
        'ol' => "margin:0 0 16px 0; padding-left:20px; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:15px; line-height:25px; color:#A9A9B4;",
        'li' => 'margin:0 0 8px 0; color:#A9A9B4;',
        'a' => 'color:#FF4D6A; text-decoration:underline;',
        'strong' => 'color:#FFFFFF;',
        'b' => 'color:#FFFFFF;',
        'em' => 'color:#A9A9B4;',
        'h1' => "margin:26px 0 12px 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-weight:700; color:#FFFFFF; letter-spacing:-0.4px; font-size:26px; line-height:32px;",
        'h2' => "margin:26px 0 12px 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-weight:700; color:#FFFFFF; letter-spacing:-0.4px; font-size:21px; line-height:27px;",
        'h3' => "margin:26px 0 12px 0; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-weight:700; color:#FFFFFF; letter-spacing:-0.4px; font-size:17px; line-height:23px;",
        'blockquote' => "margin:0 0 16px 0; padding:2px 0 2px 16px; border-left:3px solid #DC143C; font-family:'Segoe UI',Helvetica,Arial,sans-serif; font-size:15px; line-height:25px; color:#8E8E99;",
    ];

    public function inlineStyles(string $html): string
    {
        foreach (self::INLINE as $tag => $css) {
            $html = (string) preg_replace_callback(
                '/<'.$tag.'(?=[\s>])[^>]*>/i',
                function (array $m) use ($css): string {
                    $tagText = $m[0];

                    /*
                     * An editor who styled one paragraph by hand meant it, so
                     * theirs is written after ours and wins the properties it
                     * names. Ours still supplies everything they left out —
                     * which, for a paragraph they only recoloured, is the font
                     * and the line height.
                     */
                    if (preg_match('/\sstyle=(["\'])(.*?)\1/i', $tagText, $s)) {
                        return str_replace($s[0], ' style="'.$css.' '.$s[2].'"', $tagText);
                    }

                    return substr($tagText, 0, -1).' style="'.$css.'">';
                },
                $html
            );
        }

        return $html;
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
