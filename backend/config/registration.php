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
     * Measured on this server: gmail.com answers from MX in 1 ms, techplay.gg in
     * 35, and a domain that does not exist at all in 47. The check is MX first
     * and A second, because a domain with no MX record still receives mail at
     * its A record — refusing those would turn away small real domains.
     *
     * That fallback is also the limit of what this catches. `gmial.com` — the
     * typo you would most want caught — has an A record, so it is accepted, and
     * a first version of this comment wrongly claimed otherwise. What is caught
     * is a domain that resolves to nothing: a fat-fingered TLD, a dead company
     * domain, an address invented on the spot. That is the common case, and
     * telling someone at the form beats letting them wait for mail that cannot
     * arrive.
     *
     * Switchable because it is a network call inside a request: if the resolver
     * ever becomes the slow part of signing up, this is the thing to turn off.
     * It fails open — a resolver that is down lets registrations through rather
     * than closing the door.
     */
    'verify_mx' => env('REGISTRATION_VERIFY_MX', true),

];
