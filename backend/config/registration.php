<?php

return [

    /*
     * Domains that exist only to throw away.
     *
     * Deliberately short and deliberately not a country list. Blocking a TLD —
     * .ru is the one usually suggested — filters by where somebody lives rather
     * than by what they are doing: it turns away real readers, and stops nobody,
     * because anyone farming accounts uses Gmail or one of these instead.
     *
     * These are services whose entire purpose is a mailbox nobody owns. The list
     * is here rather than in code so it can be added to without a deploy, and it
     * is worth remembering that it is a speed bump: hundreds of such services
     * exist and any list goes stale. The real defence is below it — an account
     * gets nothing at all until the address is confirmed.
     */
    'disposable_domains' => [
        'mailinator.com',
        'guerrillamail.com',
        'guerrillamail.info',
        'sharklasers.com',
        '10minutemail.com',
        '10minutemail.net',
        'tempmail.com',
        'temp-mail.org',
        'throwawaymail.com',
        'yopmail.com',
        'trashmail.com',
        'getnada.com',
        'dispostable.com',
        'maildrop.cc',
        'fakeinbox.com',
        'mohmal.com',
        'emailondeck.com',
        'mintemail.com',
    ],

    /*
     * Whether registration checks that the domain can receive mail at all.
     *
     * Measured on this server: a real domain answers in 1–12 ms, a domain that
     * does not exist in about 85, and a near-miss like `gmial.com` took 1.76
     * seconds — the slow case is a typo, which is also the case where the reader
     * most needs to be told rather than left waiting for mail that will never
     * arrive.
     *
     * Switchable because it is a network call inside a request: if the resolver
     * ever becomes the slow part of signing up, this is the thing to turn off.
     */
    'verify_mx' => env('REGISTRATION_VERIFY_MX', true),

];
