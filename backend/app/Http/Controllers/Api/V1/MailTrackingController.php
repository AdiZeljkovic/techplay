<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\MailCampaignClick;
use App\Models\MailCampaignRecipient;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

/**
 * The two routes an email talks back through.
 *
 * One rule governs both, and it is the reason this class is dull: measurement
 * must never be able to break the message. A reader who clicks a link reaches
 * the page whether or not we manage to record the click — unknown token,
 * deleted campaign, database refusing writes, it does not matter. The redirect
 * happens either way. A tracker that can swallow a click is worse than no
 * tracker, because it fails on exactly the readers you most wanted to keep.
 */
class MailTrackingController extends Controller
{
    /** 1x1 transparent GIF, 43 bytes, no file to read from disk. */
    private const PIXEL = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    /**
     * The message was opened — probably.
     *
     * Worth saying plainly because the number gets quoted: Apple Mail Privacy
     * Protection fetches this on the reader's behalf whether they looked or
     * not, and Gmail fetches it through a proxy. An open is a floor and a mood,
     * not a measurement, which is why the admin screen labels it as such.
     */
    public function open(string $token): Response
    {
        $recipient = MailCampaignRecipient::query()->where('token', $token)->first();

        if ($recipient) {
            $first = $recipient->opened_at === null;

            $recipient->forceFill([
                'opened_at' => $recipient->opened_at ?? now(),
                'open_count' => $recipient->open_count + 1,
            ])->save();

            // The campaign counts people, not openings, so only the first one
            // from each reader moves it.
            if ($first) {
                DB::table('mail_campaigns')->where('id', $recipient->campaign_id)->increment('opened_count');
            }
        }

        return response(base64_decode(self::PIXEL), 200, [
            'Content-Type' => 'image/gif',
            'Content-Length' => '43',
            // Without this the client caches the pixel and a second open never
            // reaches us — and, worse, some proxies would serve it to another
            // reader entirely.
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
        ]);
    }

    /**
     * A link was followed. Count it, then get out of the way.
     *
     * The signature is not decoration. Without it this is an open redirect
     * wearing our domain's name: anybody could hand out an api-beta.techplay.gg
     * link pointing anywhere they liked, and it would carry whatever trust our
     * address has — which is exactly the shape of a phishing link. Laravel
     * signs the whole URL including the destination, so a target that has been
     * edited no longer verifies.
     */
    public function click(Request $request, string $token)
    {
        $target = (string) $request->query('u', '');

        if (! $request->hasValidSignature() || ! preg_match('#^https?://#i', $target)) {
            // Not a link we minted. Send them somewhere real rather than
            // showing an error for something they did nothing wrong in.
            return redirect()->away(rtrim((string) config('app.site_url'), '/'));
        }

        $recipient = MailCampaignRecipient::query()->where('token', $token)->first();

        if ($recipient) {
            $first = $recipient->clicked_at === null;

            $recipient->forceFill([
                'clicked_at' => $recipient->clicked_at ?? now(),
                'click_count' => $recipient->click_count + 1,
            ])->save();

            MailCampaignClick::create([
                'recipient_id' => $recipient->id,
                'url' => mb_substr($target, 0, 1000),
                'clicked_at' => now(),
            ]);

            if ($first) {
                DB::table('mail_campaigns')->where('id', $recipient->campaign_id)->increment('clicked_count');
            }

            /*
             * A click is proof of an open, and a better one than the pixel.
             *
             * Somebody with images off never trips the pixel, so a reader who
             * clicked through would otherwise be counted as never having looked
             * — which is the one reading of the numbers that is definitely wrong.
             */
            if ($recipient->opened_at === null) {
                $recipient->forceFill(['opened_at' => now()])->save();
                DB::table('mail_campaigns')->where('id', $recipient->campaign_id)->increment('opened_count');
            }
        }

        return redirect()->away($target, 302);
    }
}
