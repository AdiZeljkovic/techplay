<?php

namespace App\Http\Controllers;

use App\Models\MailCampaign;
use App\Models\MailCampaignRecipient;
use App\Services\CampaignBody;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * The campaign as it will actually arrive.
 *
 * Rendered from the same Blade file the mailable uses, because a preview built
 * from anything else is a drawing of an email rather than the email — and the
 * one thing worth checking before a send is precisely the part that differs
 * between the two.
 *
 * Nothing here writes. The recipient is made in memory and never saved: a
 * preview that left a row behind would put the editor's own address in the
 * campaign log and, worse, occupy the (campaign, email) slot so the real send
 * would skip them as already written to. The tokens are real enough to render
 * and belong to nothing.
 */
class CampaignPreviewController extends Controller
{
    public function show(Request $request, MailCampaign $campaign)
    {
        // The panel gates on this permission and so does the preview: the URL
        // is guessable and a campaign is unpublished writing.
        if (! Auth::user()?->can('view admin panel')) {
            throw new AccessDeniedHttpException;
        }

        $recipient = new MailCampaignRecipient([
            'campaign_id' => $campaign->id,
            'email' => (string) Auth::user()->email,
            'source' => (string) $request->query('as', 'account') === 'form' ? 'form' : 'account',
        ]);
        $recipient->token = 'preview';
        $recipient->setRelation('campaign', $campaign);

        $body = app(CampaignBody::class);

        return response()->view('emails.campaign', [
            'appUrl' => rtrim((string) config('app.site_url'), '/'),
            'subject' => $campaign->subject,
            'campaign' => $campaign,
            'bodyHtml' => $body->trackLinks($body->absoluteImages((string) $campaign->body), $recipient),
            'heroCtaUrl' => $campaign->hero_cta_url
                ? $recipient->clickUrl($campaign->hero_cta_url)
                : null,
            /*
             * A transparent pixel rather than the real one. Loading the preview
             * ten times while writing would otherwise record ten opens against
             * a campaign that has not been sent, and the first number anybody
             * looks at after a send would already be wrong.
             */
            'pixelUrl' => 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            'unsubscribeUrl' => '#',
            'recipient' => $recipient,
        ]);
    }
}
