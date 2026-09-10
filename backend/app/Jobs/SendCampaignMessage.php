<?php

namespace App\Jobs;

use App\Mail\CampaignMessage;
use App\Models\MailCampaign;
use App\Models\MailCampaignRecipient;
use App\Models\MailSuppression;
use App\Models\NewsletterSubscriber;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * One message to one person.
 *
 * A job per recipient rather than a loop over ninety of them, for three
 * reasons: the queue does the pacing without a worker sleeping through it, one
 * address that fails does not take the other eighty-nine with it, and a retry
 * retries a single message instead of starting the newsletter again.
 */
class SendCampaignMessage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [60, 300];

    public function __construct(public MailCampaignRecipient $recipient) {}

    public function handle(): void
    {
        $this->recipient->refresh();

        // Already done — a restarted campaign, or a retry after the send
        // succeeded and something later in this method threw.
        if ($this->recipient->status === MailCampaignRecipient::SENT) {
            return;
        }

        /*
         * Asked again, at the last possible moment.
         *
         * The audience was resolved when the campaign was queued, and a long
         * send takes minutes. Somebody who unsubscribes in between has said no
         * before this message left, and honouring that is the difference
         * between a list and a spam run. It is also the cheapest possible check
         * to run and the most expensive one to skip.
         */
        if ($this->refused()) {
            $this->recipient->forceFill([
                'status' => MailCampaignRecipient::FAILED,
                'failed_reason' => 'Unsubscribed or suppressed before sending',
            ])->save();

            $this->tally('failed_count');
            $this->finishIfDone();

            return;
        }

        try {
            Mail::to($this->recipient->email)->send(new CampaignMessage($this->recipient));

            $this->recipient->forceFill([
                'status' => MailCampaignRecipient::SENT,
                'sent_at' => now(),
                'failed_reason' => null,
            ])->save();

            $this->tally('sent_count');
        } catch (Throwable $e) {
            // Let the retries happen first; only the last attempt writes a
            // failure, otherwise a temporary refusal is recorded as a loss.
            if ($this->attempts() < $this->tries) {
                throw $e;
            }

            $this->recipient->forceFill([
                'status' => MailCampaignRecipient::FAILED,
                'failed_reason' => mb_substr($e->getMessage(), 0, 300),
            ])->save();

            $this->tally('failed_count');

            Log::channel('connections')->warning('Campaign message failed', [
                'campaign' => $this->recipient->campaign_id,
                'recipient' => $this->recipient->id,
                'error' => $e->getMessage(),
            ]);
        }

        $this->finishIfDone();
    }

    /** Has this address said no since the list was drawn up? */
    private function refused(): bool
    {
        /*
         * Lower-cased on the way in, because addresses arrive here in whatever
         * case they were typed and the subscriber rows are stored folded.
         * Without this the comparison misses and somebody who unsubscribed
         * gets the mail anyway — which is the exact failure this method exists
         * to prevent, and it fails silently and in their favour of being
         * written to.
         */
        $email = mb_strtolower(trim($this->recipient->email));

        // filter() hands back a plain array of the addresses that survived, so
        // an empty one means this address did not.
        if (MailSuppression::filter(collect([$email])) === []) {
            return true;
        }

        return NewsletterSubscriber::query()
            ->whereRaw('LOWER(email) = ?', [$email])
            ->where(fn ($q) => $q->whereNotNull('unsubscribed_at')->orWhere('is_active', false))
            ->exists();
    }

    /** An increment the database performs, so two workers cannot lose one. */
    private function tally(string $column): void
    {
        DB::table('mail_campaigns')
            ->where('id', $this->recipient->campaign_id)
            ->increment($column);
    }

    /**
     * The last message closes the campaign.
     *
     * Asked by every message rather than scheduled after the last one: a job
     * timed to run "after the end" is a guess, and it is wrong the moment a
     * retry pushes one message past it.
     */
    private function finishIfDone(): void
    {
        $stillWaiting = MailCampaignRecipient::query()
            ->where('campaign_id', $this->recipient->campaign_id)
            ->where('status', MailCampaignRecipient::QUEUED)
            ->exists();

        if ($stillWaiting) {
            return;
        }

        MailCampaign::query()
            ->whereKey($this->recipient->campaign_id)
            ->where('status', MailCampaign::SENDING)
            ->update(['status' => MailCampaign::SENT, 'finished_at' => now(), 'updated_at' => now()]);
    }
}
