<?php

namespace Database\Seeders;

use App\Models\MailTemplate;
use Illuminate\Database\Seeder;

/**
 * The templates, filled in with what the site already says.
 *
 * Not empty boxes. An editor opening this screen for the first time should see
 * the mail as it goes out today and be able to change a sentence — an empty
 * field would ask them to write the whole thing from memory, and the first save
 * would quietly replace working copy with a guess.
 *
 * firstOrCreate, so running this again after somebody has edited a template
 * leaves their words alone. Re-seeding must never be a way to lose work.
 */
class MailTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $copy = [
            'verify-email' => [
                'subject' => 'Confirm your email — TechPlay',
                'heading' => 'Confirm your email',
                'body' => "Confirm this address and your account is ready.\n\nUntil you do, you can look around but not post, rate or collect — we confirm addresses so that nobody can sign up as you.",
                'cta_label' => 'CONFIRM EMAIL',
            ],
            'reset-password' => [
                'subject' => 'Set a new password — TechPlay',
                'heading' => 'Set a new password',
                'body' => 'Somebody asked to reset the password on this account. If that was you, the button below takes you straight to a new one.',
                'cta_label' => 'SET NEW PASSWORD',
            ],
            'newsletter-verification' => [
                'subject' => 'Confirm your TechPlay newsletter subscription',
                'heading' => 'Confirm your subscription',
                'body' => "Thanks for signing up. Confirm this address and the newsletter starts arriving.\n\nIt is one mail when there is something worth sending — not a schedule for its own sake.",
                'cta_label' => 'CONFIRM SUBSCRIPTION',
            ],
        ];

        foreach (MailTemplate::CATALOGUE as $key => $spec) {
            MailTemplate::firstOrCreate(
                ['key' => $key],
                array_merge(
                    [
                        'name' => $spec['name'],
                        'group' => $spec['group'],
                        'is_active' => true,
                    ],
                    $copy[$key] ?? ['subject' => $spec['name']]
                )
            );
        }
    }
}
