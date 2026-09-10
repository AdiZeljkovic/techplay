<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

/**
 * The words of a mail the site sends by itself.
 *
 * Not the mail — the words. Everything structural stays in the Blade file and
 * the notification class: the layout, the button, and above all the link and
 * the token inside it. What an editor gets is the subject, the heading, the
 * paragraphs and the label on the button.
 *
 * That line is drawn where it is on purpose. Two of these mails carry the only
 * way into an account — confirm your address, reset your password — and a
 * template that could remove the button is one that locks every new member out
 * of the site. It would not throw, it would not appear in a log, and nobody
 * would find out until somebody wrote in to say the mail was broken. Wording
 * changes without a deploy; the mechanism does not change at all.
 *
 * A row that is missing or switched off is not an error. The class keeps its
 * own copy and uses it, which means the site keeps sending correct mail even
 * if this table is empty.
 */
class MailTemplate extends Model
{
    protected $fillable = [
        'key', 'name', 'group', 'subject', 'heading', 'body', 'cta_label', 'is_active', 'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Every mail the site sends by itself, and what it can be told about.
     *
     * This is the catalogue the admin screen is built from, so a key that is
     * not here cannot be edited — which is the intention. The variables are
     * listed because an editor cannot be expected to guess them, and one that
     * is typed wrong is left visible in the text rather than silently blanked:
     * a stray {{ naem }} in a draft is a bug you can see.
     *
     * Worth knowing while reading this: the site sends five mails in total.
     * Twenty of the twenty-two notification classes never leave the building —
     * they are `['database']` only, including the weekly digest.
     */
    public const CATALOGUE = [
        'verify-email' => [
            'name' => 'Confirm your email address',
            'group' => 'Account',
            'note' => 'Sent when somebody registers, and again on request. The button carries a signed, expiring link.',
            'vars' => ['name'],
        ],
        'reset-password' => [
            'name' => 'Reset your password',
            'group' => 'Account',
            'note' => 'The button carries a signed link that expires. Say so in the body if you change the wording.',
            'vars' => ['name', 'minutes'],
        ],
        'newsletter-verification' => [
            'name' => 'Confirm your newsletter signup',
            'group' => 'Newsletter',
            'note' => 'Sent to somebody who typed their address into the footer form. The confirmation button is drawn by the code.',
            'vars' => [],
        ],
    ];

    protected static function booted(): void
    {
        /*
         * Forget the cached copy the moment the row changes.
         *
         * Not an Observer class: this is one line of cache housekeeping that
         * belongs to the model, and AppServiceProvider is where content
         * observers are registered — putting a second kind of thing in that
         * list is how ArticleObserver ended up registered twice and every
         * publish ran the whole fan-out two times for two months.
         *
         * `saved` and `deleted` both, because switching a template off is a
         * save and deleting one is not, and an editor who turns a template off
         * expects the built-in copy back immediately rather than in an hour.
         */
        static::saved(fn (self $t) => Cache::forget(self::cacheKey($t->key)));
        static::deleted(fn (self $t) => Cache::forget(self::cacheKey($t->key)));
    }

    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * The active template for a key, or null to use the code's own copy.
     *
     * Cached because the account mails read this on a path a person is waiting
     * on — registration — and forgotten on every save, from the observer.
     */
    public static function forKey(string $key): ?self
    {
        return Cache::remember(
            self::cacheKey($key),
            3600,
            fn () => self::query()->where('key', $key)->where('is_active', true)->first()
        );
    }

    public static function cacheKey(string $key): string
    {
        return 'mail-template:'.$key;
    }

    /**
     * The wording, with the variables filled in.
     *
     * Returns only the fields that are actually set, so a template that fills
     * in the subject and leaves the body empty overrides the subject and lets
     * the class keep its own body. Half a template is a legitimate thing to
     * want and should not blank the other half.
     *
     * @param  array<string, string|int|null>  $vars
     * @return array{subject?: string, heading?: string, body?: string, cta_label?: string}
     */
    public function render(array $vars = []): array
    {
        $out = [];

        foreach (['subject', 'heading', 'body', 'cta_label'] as $field) {
            $value = trim((string) $this->{$field});

            if ($value !== '') {
                $out[$field] = self::substitute($value, $vars);
            }
        }

        return $out;
    }

    /**
     * Replace {{ name }} with what it stands for.
     *
     * Not called fill(): Eloquent\Model already has a non-static fill(), and
     * shadowing it with a static one is a fatal error at class-load time — the
     * whole application stops booting, which is how this was found.
     *
     * Whitespace inside the braces is allowed because people type it. Unknown
     * names are left alone rather than emptied — see the note on CATALOGUE.
     *
     * @param  array<string, string|int|null>  $vars
     */
    public static function substitute(string $text, array $vars): string
    {
        foreach ($vars as $name => $value) {
            $text = preg_replace(
                '/\{\{\s*'.preg_quote((string) $name, '/').'\s*\}\}/',
                (string) $value,
                $text
            );
        }

        return $text;
    }

    /**
     * One field of a template, or the fallback the class carries.
     *
     * The shape every caller uses, so no notification has to know whether a
     * row exists.
     *
     * @param  array<string, string|int|null>  $vars
     */
    public static function value(string $key, string $field, string $fallback, array $vars = []): string
    {
        $template = self::forKey($key);

        if (! $template) {
            return self::substitute($fallback, $vars);
        }

        return $template->render($vars)[$field] ?? self::substitute($fallback, $vars);
    }
}
