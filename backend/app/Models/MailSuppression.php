<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Addresses we must not write to.
 *
 * The single place anything asks before sending. Keyed by the address itself
 * rather than by a subscriber row, because a person who unsubscribes should
 * stay unsubscribed even if a second row for the same address turns up later —
 * through a different form, a different list, or an import.
 */
class MailSuppression extends Model
{
    public const UNSUBSCRIBED = 'unsubscribed';

    public const BOUNCED = 'bounced';

    public const COMPLAINED = 'complained';

    protected $fillable = ['email', 'reason', 'source', 'note'];

    /**
     * Stop writing to an address.
     *
     * Idempotent, and it never downgrades a reason: somebody who complained and
     * later also unsubscribes stays recorded as having complained, because that
     * is the fact that matters if a mailbox provider ever asks.
     */
    public static function suppress(string $email, string $reason = self::UNSUBSCRIBED, ?string $source = null): self
    {
        $email = mb_strtolower(trim($email));

        $existing = static::where('email', $email)->first();

        if ($existing) {
            if ($existing->reason === self::UNSUBSCRIBED && $reason !== self::UNSUBSCRIBED) {
                $existing->forceFill(['reason' => $reason, 'source' => $source ?? $existing->source])->save();
            }

            return $existing;
        }

        return static::create([
            'email' => $email,
            'reason' => $reason,
            'source' => $source,
        ]);
    }

    /** Is this address on the list? */
    public static function has(string $email): bool
    {
        return static::where('email', mb_strtolower(trim($email)))->exists();
    }

    /**
     * The addresses to drop from a send.
     *
     * Takes the whole list at once rather than asking per address, because a
     * campaign to a few thousand people should cost one query, not a few
     * thousand.
     *
     * @param  iterable<string>  $emails
     * @return array<int, string> what is left after suppression
     */
    public static function filter(iterable $emails): array
    {
        $all = collect($emails)->map(fn ($e) => mb_strtolower(trim((string) $e)))->unique();

        $blocked = static::whereIn('email', $all)->pluck('email')->flip();

        return $all->reject(fn ($e) => $blocked->has($e))->values()->all();
    }
}
