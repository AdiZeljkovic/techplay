<?php

namespace Tests\Feature;

use App\Jobs\SendCampaign;
use App\Jobs\SendCampaignMessage;
use App\Models\MailCampaign;
use App\Models\MailCampaignRecipient;
use App\Models\MailSuppression;
use App\Models\MailTemplate;
use App\Models\NewsletterSubscriber;
use App\Models\User;
use App\Services\CampaignAudience;
use App\Services\CampaignBody;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

/**
 * The mail desk, and the four ways it must not go wrong.
 *
 * Every one of these is unrecoverable if it fails in production. An email that
 * has gone out cannot be recalled, so the tests here are not about features —
 * they are about the things that would put a message somewhere it must never
 * be, or take one away from somebody who needs it.
 */
class MailDeskTest extends TestCase
{
    use RefreshDatabase;

    private function campaign(array $audience = ['segment' => 'everyone']): MailCampaign
    {
        return MailCampaign::create([
            'name' => 'Test campaign',
            'subject' => 'Something worth reading',
            'body' => '<p>Hello. <a href="https://techplay.gg/news">Read this</a>.</p>',
            'audience' => $audience,
            'status' => MailCampaign::DRAFT,
            'batch_size' => 10,
            'pause_seconds' => 0,
        ]);
    }

    /**
     * The two screens actually render.
     *
     * Everything else in this file tests logic that runs without a browser, and
     * all of it passed while the compose screen answered 500 to every request:
     * a closure was type-hinted `Filament\Forms\Get`, which does not exist in
     * this version of Filament, and nothing finds that until the form is built.
     * A page that cannot be opened is not a feature, however correct the code
     * behind it is.
     */
    public function test_the_admin_screens_open(): void
    {
        $admin = User::factory()->create(['email_verified_at' => now()]);

        // The panel gates on a permission, deliberately — the `role` column
        // used to be a second way in and was taken out. Granting it directly
        // keeps this test about the screens rather than about Spatie.
        \Spatie\Permission\Models\Permission::findOrCreate('view admin panel', 'web');
        $admin->givePermissionTo('view admin panel');

        foreach ([
            '/admin/mail-campaigns',
            '/admin/mail-campaigns/create',
            '/admin/mail-templates',
        ] as $url) {
            $this->actingAs($admin)->get($url)->assertOk();
        }
    }

    public function test_a_campaign_cannot_be_sent_twice(): void
    {
        // The failure this prevents is two newsletters in every inbox, from one
        // double click. Claiming is a single conditional update for that reason.
        $campaign = $this->campaign();

        $this->assertTrue($campaign->claimForSending());
        $this->assertFalse($campaign->fresh()->claimForSending());
        $this->assertSame(MailCampaign::SENDING, $campaign->fresh()->status);
    }

    public function test_somebody_who_leaves_mid_send_is_not_written_to(): void
    {
        /*
         * The audience is drawn when the send starts and a long send takes
         * minutes. Somebody who unsubscribes in between has said no before
         * their message left, and honouring that is the whole difference
         * between a mailing list and a spam run.
         */
        Mail::fake();

        $campaign = $this->campaign();
        $user = User::factory()->create(['email_verified_at' => now()]);

        $recipient = MailCampaignRecipient::create([
            'campaign_id' => $campaign->id,
            'email' => $user->email,
            'source' => 'account',
        ]);

        NewsletterSubscriber::forAddress($user->email, NewsletterSubscriber::FROM_ACCOUNT)
            ->forceFill(['unsubscribed_at' => now(), 'is_active' => false])->save();

        (new SendCampaignMessage($recipient))->handle();

        Mail::assertNothingSent();
        $this->assertSame(MailCampaignRecipient::FAILED, $recipient->fresh()->status);
    }

    public function test_the_click_route_will_not_redirect_anywhere_it_did_not_sign(): void
    {
        /*
         * Without the signature this route is an open redirect wearing our
         * domain's name — anybody could hand out an api-beta.techplay.gg link
         * pointing at their own page and borrow whatever trust our address
         * has. That is the exact shape of a phishing link.
         */
        $campaign = $this->campaign();
        $recipient = MailCampaignRecipient::create([
            'campaign_id' => $campaign->id,
            'email' => 'reader@example.com',
            'source' => 'account',
        ]);

        $signed = URL::signedRoute('mail.click', [
            'token' => $recipient->token,
            'u' => 'https://techplay.gg/news',
        ]);

        $this->get($signed)->assertRedirect('https://techplay.gg/news');
        $this->assertSame(1, $recipient->fresh()->click_count);

        // The destination swapped after signing: the signature no longer
        // covers it, so we refuse to be the one who sends them there.
        $tampered = str_replace(
            urlencode('https://techplay.gg/news'),
            urlencode('https://evil.example.com'),
            $signed
        );

        $this->get($tampered)->assertRedirect(rtrim((string) config('app.site_url'), '/'));
        $this->assertSame(1, $recipient->fresh()->click_count, 'a refused click is not a click');
    }

    public function test_a_click_counts_as_an_open_even_with_images_off(): void
    {
        // Somebody who blocks images never trips the pixel. Counting them as
        // never having looked is the one reading of these numbers that is
        // definitely wrong, given they clicked.
        $campaign = $this->campaign();
        $recipient = MailCampaignRecipient::create([
            'campaign_id' => $campaign->id,
            'email' => 'reader@example.com',
            'source' => 'account',
        ]);

        $this->get(URL::signedRoute('mail.click', [
            'token' => $recipient->token,
            'u' => 'https://techplay.gg/news',
        ]));

        $this->assertNotNull($recipient->fresh()->opened_at);
        $this->assertSame(1, (int) $campaign->fresh()->opened_count);
    }

    public function test_the_suppression_list_is_the_last_word_on_every_segment(): void
    {
        // A new segment must not be able to reach somebody by forgetting to
        // ask. The gate is at the end of resolve(), not inside each branch.
        $wanted = User::factory()->create(['email_verified_at' => now(), 'is_banned' => false]);
        $refused = User::factory()->create(['email_verified_at' => now(), 'is_banned' => false]);

        MailSuppression::create(['email' => mb_strtolower($refused->email), 'reason' => 'unsubscribed']);

        $addresses = app(CampaignAudience::class)->resolve(['segment' => 'members']);

        $this->assertArrayHasKey(mb_strtolower($wanted->email), $addresses);
        $this->assertArrayNotHasKey(mb_strtolower($refused->email), $addresses);
    }

    public function test_an_unverified_account_is_never_in_an_audience(): void
    {
        // We have no evidence the address reaches anybody, and mailing
        // addresses that bounce is how a sender with no reputation loses the
        // little it has.
        User::factory()->create(['email_verified_at' => null]);

        $this->assertSame([], app(CampaignAudience::class)->resolve(['segment' => 'members']));
    }

    public function test_the_mail_still_goes_out_when_a_template_is_missing_or_off(): void
    {
        /*
         * The reason the whole template layer is safe to have at all: nothing
         * in it can stop a mail. The worst an empty table can do is nothing.
         */
        $this->assertSame(
            'Confirm your email — TechPlay',
            MailTemplate::value('verify-email', 'subject', 'Confirm your email — TechPlay')
        );

        MailTemplate::create([
            'key' => 'verify-email',
            'name' => 'x',
            'subject' => 'Edited subject',
            'is_active' => false,
        ]);

        $this->assertSame(
            'Confirm your email — TechPlay',
            MailTemplate::value('verify-email', 'subject', 'Confirm your email — TechPlay'),
            'a template switched off falls back to the code'
        );
    }

    public function test_a_template_fills_in_the_names_it_was_given(): void
    {
        MailTemplate::create([
            'key' => 'verify-email',
            'name' => 'x',
            'subject' => 'Welcome {{ name }}',
            'is_active' => true,
        ]);

        $this->assertSame(
            'Welcome Ada',
            MailTemplate::value('verify-email', 'subject', 'fallback', ['name' => 'Ada'])
        );
    }

    public function test_queueing_a_campaign_writes_one_row_per_person(): void
    {
        Queue::fake();

        $campaign = $this->campaign(['segment' => 'members']);
        $one = User::factory()->create(['email_verified_at' => now()]);
        $two = User::factory()->create(['email_verified_at' => now()]);

        (new SendCampaign($campaign))->handle(app(CampaignAudience::class));

        $this->assertSame(2, $campaign->fresh()->recipients_count);
        $this->assertDatabaseHas('mail_campaign_recipients', ['email' => mb_strtolower($one->email)]);
        $this->assertDatabaseHas('mail_campaign_recipients', ['email' => mb_strtolower($two->email)]);
        Queue::assertPushed(SendCampaignMessage::class, 2);
    }

    public function test_a_second_run_does_not_write_to_anybody_twice(): void
    {
        // The (campaign, email) unique index plus the sent check. A restarted
        // send has to be safe, because the alternative is a duplicate mailing.
        Queue::fake();

        $campaign = $this->campaign(['segment' => 'members']);
        $user = User::factory()->create(['email_verified_at' => now()]);

        (new SendCampaign($campaign))->handle(app(CampaignAudience::class));

        MailCampaignRecipient::query()->update([
            'status' => MailCampaignRecipient::SENT,
            'sent_at' => now(),
        ]);

        $campaign->forceFill(['status' => MailCampaign::DRAFT])->save();
        (new SendCampaign($campaign->fresh()))->handle(app(CampaignAudience::class));

        $this->assertSame(1, MailCampaignRecipient::where('email', mb_strtolower($user->email))->count());
        Queue::assertPushed(SendCampaignMessage::class, 1);
    }

    public function test_every_link_in_the_body_is_counted_except_the_way_out(): void
    {
        /*
         * The unsubscribe link is deliberately left alone. It has to work when
         * everything else has failed — a reader who cannot get off the list
         * complains to their provider instead, and a spam complaint is what a
         * small sender cannot afford.
         */
        $campaign = $this->campaign();
        $recipient = MailCampaignRecipient::create([
            'campaign_id' => $campaign->id,
            'email' => 'reader@example.com',
            'source' => 'form',
        ]);

        $unsubscribe = $recipient->unsubscribeUrl();
        $html = '<a href="https://techplay.gg/news">News</a>'
            .'<a href="'.$unsubscribe.'">Unsubscribe</a>'
            .'<a href="mailto:hi@techplay.gg">Mail us</a>';

        $rendered = app(CampaignBody::class)->trackLinks($html, $recipient);

        $this->assertStringNotContainsString('href="https://techplay.gg/news"', $rendered);
        $this->assertStringContainsString('/mail/c/'.$recipient->token, $rendered);
        $this->assertStringContainsString('href="'.$unsubscribe.'"', $rendered);
        $this->assertStringContainsString('mailto:hi@techplay.gg', $rendered);
    }

    public function test_a_campaign_that_has_gone_out_can_no_longer_be_edited(): void
    {
        // Offering an edit button afterwards would suggest the copy in ninety
        // inboxes changes with it.
        $campaign = $this->campaign();
        $campaign->forceFill(['status' => MailCampaign::SENT])->save();

        $this->assertFalse($campaign->isEditable());
        $this->assertTrue($campaign->hasGoneOut());
    }
}
