<?php

namespace App\Services;

use App\Models\GiveawayEntry;
use App\Models\MailSuppression;
use App\Models\NewsletterSubscriber;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Who a campaign is for.
 *
 * NewsletterAudience answers one question — everybody we may write to — and the
 * launch command still uses it. This answers the same question with conditions
 * on it, and it is careful to end at the same gate: whatever the rule selects,
 * the last thing that happens is MailSuppression::filter(). There is one
 * answer to "may we write to this person" and a new segment cannot get around
 * it by forgetting to ask.
 *
 * Two groups go in, and they are not the same permission. Somebody who typed
 * their address into the footer asked for mail. A member did not — we may write
 * to them because they hold an account, which is a weaker claim and is why the
 * footer says something different for each.
 *
 * Unverified accounts are never included, under any segment. We have no
 * evidence the address reaches a person, and mailing addresses that bounce is
 * precisely how a mail server with no reputation loses the little it has.
 */
class CampaignAudience
{
    /** The rules an editor can pick from, and what each one means in words. */
    public const SEGMENTS = [
        'everyone' => 'Members and newsletter signups',
        'members' => 'Registered members only',
        'signups' => 'Newsletter signups only (not members)',
        'giveaway' => 'People who entered a giveaway',
    ];

    /**
     * Resolve a stored rule into addresses.
     *
     * @param  array<string, mixed>  $rule
     * @return array<string, string> address => NewsletterSubscriber::FROM_*
     */
    public function resolve(array $rule): array
    {
        $segment = $rule['segment'] ?? 'everyone';

        /*
         * merge() lets the right-hand side win a shared key, so somebody who
         * both registered and used the footer form comes out as a signup —
         * once, and labelled with the stronger of the two claims.
         */
        $candidates = match ($segment) {
            'members' => $this->members($rule),
            'signups' => $this->signups(),
            'giveaway' => $this->giveawayEntrants($rule),
            default => $this->members($rule)->merge($this->signups()),
        };

        $allowed = MailSuppression::filter($candidates->keys());

        return $candidates->only($allowed)->all();
    }

    /** How many people a rule reaches, without building the list twice over. */
    public function count(array $rule): int
    {
        return count($this->resolve($rule));
    }

    /**
     * @return Collection<string, string>
     */
    private function members(array $rule): Collection
    {
        $query = User::query()
            ->whereNotNull('email_verified_at')
            ->where('is_banned', false);

        if (($minXp = (int) ($rule['min_xp'] ?? 0)) > 0) {
            $query->where('xp', '>=', $minXp);
        }

        /*
         * "Seen in the last N days" is a real segment and a trap.
         *
         * last_seen_at is null for anybody who has not been back since the
         * column started being written, which is not the same as inactive. So
         * the filter only ever narrows to people we have positively seen; it
         * never treats a null as a no.
         */
        if (($days = (int) ($rule['seen_within_days'] ?? 0)) > 0) {
            $query->whereNotNull('last_seen_at')
                ->where('last_seen_at', '>=', now()->subDays($days));
        }

        if (($days = (int) ($rule['registered_within_days'] ?? 0)) > 0) {
            $query->where('created_at', '>=', now()->subDays($days));
        }

        return $this->keyed($query->pluck('email'), NewsletterSubscriber::FROM_ACCOUNT);
    }

    /**
     * @return Collection<string, string>
     */
    private function signups(): Collection
    {
        return $this->keyed(
            NewsletterSubscriber::query()->mailable()->pluck('email'),
            NewsletterSubscriber::FROM_FORM
        );
    }

    /**
     * @return Collection<string, string>
     */
    private function giveawayEntrants(array $rule): Collection
    {
        $query = GiveawayEntry::query()
            ->join('users', 'users.id', '=', 'giveaway_entries.user_id')
            ->whereNotNull('users.email_verified_at')
            ->where('users.is_banned', false);

        // No id means anybody who has ever entered anything, which is a
        // reasonable thing to want and a reasonable default.
        if ($id = (int) ($rule['giveaway_id'] ?? 0)) {
            $query->where('giveaway_entries.giveaway_id', $id);
        }

        return $this->keyed($query->pluck('users.email'), NewsletterSubscriber::FROM_ACCOUNT);
    }

    /**
     * @param  Collection<int, string|null>  $emails
     * @return Collection<string, string>
     */
    private function keyed(Collection $emails, string $source): Collection
    {
        return $emails
            ->filter()
            ->mapWithKeys(fn ($email) => [mb_strtolower(trim((string) $email)) => $source]);
    }
}
