<?php

use App\Models\HelpArticle;

$article = HelpArticle::where('slug', 'register-button-is-disabled')->firstOrFail();

$article->update([
    'excerpt' => 'The button unlocks once the anti-spam check finishes. If it never finishes, signing up with Discord goes around it entirely.',
    'seo_description' => 'The Create account button on TechPlay stays disabled until the Turnstile anti-spam check finishes. Content blockers and VPN exits are the usual causes — and Discord sign-up skips the check.',
    'content' => <<<'HTML'
<p>The <strong>Create account</strong> button stays disabled until an anti-spam check called Turnstile finishes running. It is a small box near the bottom of the form, and it usually completes in a second or two without you doing anything.</p>

<h2>If it never finishes, use Discord instead</h2>
<p>This is the short way out, and it works even when the check is completely broken for you: press <strong>Discord</strong> under the form. Signing in with Discord creates your account and <strong>never touches the security check</strong>. Battle.net does the same.</p>
<p>You end up with an ordinary account either way, and you can set a password afterwards from Settings if you would rather have one.</p>

<h2>Why it happens</h2>
<p>Turnstile has to load a script from <code>challenges.cloudflare.com</code>. If that request is blocked, the check never completes and the button never unlocks. The three usual causes, in the order worth trying:</p>
<ul>
<li><strong>A content blocker.</strong> uBlock Origin, Privacy Badger, Brave Shields and most VPN browser extensions can block it. Turn the blocker off for techplay.gg and reload the page.</li>
<li><strong>Third-party cookies switched off.</strong> Safari and Firefox in strict mode block them by default. Allow them for techplay.gg, or try the same page in a private window of a different browser.</li>
<li><strong>A VPN, or a network that filters DNS.</strong> Some exit addresses and some office or school networks are rated badly enough that the check refuses to complete, or never loads at all.</li>
</ul>

<h2>The page will tell you</h2>
<p>If the check has not appeared after fifteen seconds, the form says so and offers a reload button, rather than leaving you in front of a dead button with no explanation. If you see nothing at all where the check should be, that is the same fault — wait a few seconds and the message appears.</p>

<h2>If the box shows an error</h2>
<p>Reload the page. Turnstile issues a token that expires after a few minutes, so a form left open for a while has to run the check again.</p>

<h2>Still stuck</h2>
<p>Tell us which browser you use, whether you have a blocker or a VPN running, and which country you are in. That is almost always enough to name the cause without a back and forth.</p>
HTML,
]);

echo '  azurirano: '.$article->slug.PHP_EOL;
