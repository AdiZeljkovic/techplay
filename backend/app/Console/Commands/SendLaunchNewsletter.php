<?php

namespace App\Console\Commands;

use App\Mail\NewsletterLaunch;
use App\Models\NewsletterSubscriber;
use App\Services\NewsletterAudience;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Send the launch announcement.
 *
 * One message per person, paced, and every recipient gets a working way out.
 * A campaign is the one kind of mail that cannot be re-sent to fix a mistake,
 * so this defaults to doing nothing: without --force it lists the audience and
 * stops.
 */
class SendLaunchNewsletter extends Command
{
    protected $signature = 'newsletter:launch
        {--to=* : send only to these addresses, for a test}
        {--force : actually send; without it this only reports}
        {--limit= : stop after this many recipients}
        {--batch=10 : messages per batch}
        {--pause=3 : seconds between batches}';

    protected $description = 'Send the launch newsletter to members and subscribers';

    public function handle(NewsletterAudience $audience): int
    {
        $only = array_map(
            fn ($e) => mb_strtolower(trim((string) $e)),
            (array) $this->option('to')
        );

        if ($only !== []) {
            // A test address is not on the list and must not join it. It still
            // gets a real row, because the point of a test is to click the real
            // unsubscribe link — but as `test`, which is not mailable, so a
            // later campaign will not pick it up.
            $known = $audience->addresses();
            $recipients = [];
            foreach ($only as $email) {
                $recipients[$email] = $known[$email] ?? 'test';
            }
        } else {
            $recipients = $audience->addresses();
        }

        if ($limit = (int) $this->option('limit')) {
            $recipients = array_slice($recipients, 0, $limit, preserve_keys: true);
        }

        if ($recipients === []) {
            $this->warn('Nobody to write to.');

            return self::SUCCESS;
        }

        $counts = array_count_values($recipients);
        $this->line(sprintf(
            '%d recipient(s): %s',
            count($recipients),
            collect($counts)->map(fn ($n, $src) => "{$n} {$src}")->join(', ')
        ));

        if (! $this->option('force')) {
            $this->newLine();
            foreach (array_slice(array_keys($recipients), 0, 20) as $email) {
                $this->line('  '.$email);
            }
            if (count($recipients) > 20) {
                $this->line('  … and '.(count($recipients) - 20).' more');
            }
            $this->newLine();
            $this->warn('Nothing sent. Re-run with --force to send for real.');

            return self::SUCCESS;
        }

        $batch = max(1, (int) $this->option('batch'));
        $pause = max(0, (int) $this->option('pause'));

        $sent = 0;
        $failed = [];
        $bar = $this->output->createProgressBar(count($recipients));
        $bar->start();

        foreach (array_chunk($recipients, $batch, preserve_keys: true) as $i => $chunk) {
            foreach ($chunk as $email => $source) {
                try {
                    $subscriber = NewsletterSubscriber::forAddress($email, $source);
                    Mail::to($email)->send(new NewsletterLaunch($subscriber));
                    $sent++;
                } catch (Throwable $e) {
                    // One bad address must not end the campaign for everyone
                    // after it in the list.
                    $failed[$email] = $e->getMessage();
                    Log::error('newsletter:launch failed for '.$email, ['error' => $e->getMessage()]);
                }
                $bar->advance();
            }

            // Our own mail server, with no reputation of its own. Fifty
            // messages in one second is what a filter is built to notice.
            if ($pause > 0 && $i < count($recipients) - 1) {
                sleep($pause);
            }
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Sent {$sent}.");

        if ($failed !== []) {
            $this->error(count($failed).' failed:');
            foreach ($failed as $email => $why) {
                $this->line("  {$email} — {$why}");
            }

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
