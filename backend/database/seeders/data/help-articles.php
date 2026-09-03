<?php

/**
 * The first twelve answers, written against the code rather than from memory.
 *
 * Everything stated here was read out of the repository: the XP constants out
 * of XpService, the Steam wording out of SyncSteamLibrary's own error, the
 * deletion list out of AuthController::deleteAccount and the test that guards
 * it, the connection flows out of ConnectedAccountController and the routes
 * beside it. A help page that is confidently wrong is worse than no help page,
 * because the reader stops looking.
 *
 * All drafts. Publishing is the editor's call.
 */

use App\Models\HelpArticle;
use App\Models\HelpCategory;

$topics = [
    'account-and-sign-in' => [
        'name' => 'Account & sign-in',
        'description' => 'Creating an account, signing in, and the things that quietly stop both.',
        'icon' => 'heroicon-o-key',
        'sort_order' => 1,
    ],
    'connected-accounts' => [
        'name' => 'Connected accounts & your library',
        'description' => 'Steam, Xbox, PlayStation, GOG and Epic — linking them, and what to do when a library will not arrive.',
        'icon' => 'heroicon-o-link',
        'sort_order' => 2,
    ],
    'xp-and-levels' => [
        'name' => 'XP, levels & rewards',
        'description' => 'What earns XP, what the daily cap does, and how Bounty is different.',
        'icon' => 'heroicon-o-chart-bar',
        'sort_order' => 3,
    ],
    'email-and-notifications' => [
        'name' => 'Email & notifications',
        'description' => 'What we send, and how to stop all of it.',
        'icon' => 'heroicon-o-envelope',
        'sort_order' => 4,
    ],
    'privacy-and-your-data' => [
        'name' => 'Privacy & your data',
        'description' => 'What TechPlay keeps about you, and what happens when you ask us to stop.',
        'icon' => 'heroicon-o-shield-check',
        'sort_order' => 5,
    ],
];

$made = [];

foreach ($topics as $slug => $attributes) {
    $made[$slug] = HelpCategory::updateOrCreate(
        ['slug' => $slug],
        $attributes + ['is_published' => true]
    );
}

// ---------------------------------------------------------------- answers

$answers = [];

$answers[] = [
    'topic' => 'account-and-sign-in',
    'slug' => 'verification-email-never-arrived',
    'sort_order' => 2,
    'title' => 'Your verification email never arrived',
    'excerpt' => 'Check junk first. After that it is nearly always a typo in the address — and the resend button is on the sign-in page.',
    'seo_description' => 'No verification email from TechPlay? The link lasts an hour, the resend button is on the sign-in page, and a mistyped address looks exactly like success.',
    'focus_keyword' => 'techplay verification email not received',
    'content' => <<<'HTML'
<p>A new account has to confirm its address before it can sign in. If that message has not turned up, work down this list.</p>

<h2>Check junk, then search for the sender</h2>
<p>Search your mailbox for <code>techplay.gg</code> rather than scrolling the junk folder. Gmail in particular files first-time senders under <strong>Promotions</strong> rather than Spam, and that tab is easy to forget you have.</p>

<h2>Send it again</h2>
<p>Go to the sign-in page and try to sign in with the account. Because the address is not confirmed yet, the page offers a <strong>resend</strong> button instead of letting you in. That is the only place to trigger a new one.</p>
<p>Resends are limited to five in ten minutes. Pressing it repeatedly does not make anything arrive faster.</p>

<h2>The link expires after an hour</h2>
<p>A verification link is good for <strong>60 minutes</strong>. If you are clicking one from an email that arrived yesterday it will refuse, and that refusal looks like a broken link rather than an expired one. Resend and use the new message.</p>

<h2>If a resend also brings nothing, the address is probably wrong</h2>
<p>This is the most common cause and the hardest to spot, because we deliberately do not tell you. The resend page answers <em>"If that address needs verifying, a new link is on its way"</em> whether or not an account exists — confirming which addresses are registered would let anyone test a list of email addresses against the site.</p>
<p>So a typo produces exactly the same reassuring message as success. If two resends bring nothing, assume the address on the account has a character wrong in it and <a href="https://techplay.gg/contact?from=help">write to us</a> — tell us the address you meant to use and we can look.</p>

<h2>Work or school addresses</h2>
<p>Corporate and university mail filters discard mail from senders they have not seen before, often without leaving anything in a junk folder. If you have a personal address, it is the shorter path.</p>

<h2>One thing this is never</h2>
<p>Unsubscribing from our newsletter does not stop verification mail. Those are two separate systems — the unsubscribe list only applies to the newsletter, and anything you need in order to use your account is sent regardless.</p>
HTML,
];

$answers[] = [
    'topic' => 'connected-accounts',
    'slug' => 'connect-your-steam-account',
    'sort_order' => 1,
    'title' => 'Connect your Steam account',
    'excerpt' => 'Steam is the one platform with a proper sign-in page. You approve it on Steam and come straight back.',
    'seo_description' => 'How to link Steam to TechPlay: sign in through Steam itself, then let the library import run. Your Steam password never reaches us.',
    'focus_keyword' => 'connect steam to techplay',
    'content' => <<<'HTML'
<p>Open <a href="https://techplay.gg/settings?section=connections">Settings → Connections</a> and press <strong>Connect</strong> beside Steam. You are sent to Steam's own sign-in page, you approve the link there, and you land back on TechPlay.</p>

<h2>What we get, and what we do not</h2>
<p>Steam uses OpenID, which means <strong>your Steam password is never typed on our site and never reaches us</strong>. What comes back is your Steam ID and your public profile name. From there we read your games list through Steam's public API.</p>

<h2>The import starts on its own</h2>
<p>Linking queues a library import immediately. A large library takes a few minutes — the page will say <em>Syncing</em> while it runs.</p>

<h2>If it finishes instantly and your shelf is empty</h2>
<p>That is a privacy setting on Steam's side, not a failure here, and it has its own page: <a href="/connected-accounts/steam-library-is-not-syncing">Your Steam library is not syncing</a>.</p>

<h2>Hiding the connection later</h2>
<p>Each connected account has a visibility switch. Setting it to hidden keeps the library import running while taking the platform chip off your public profile. Disconnecting removes the link entirely.</p>
HTML,
];

$answers[] = [
    'topic' => 'connected-accounts',
    'slug' => 'steam-library-is-not-syncing',
    'sort_order' => 2,
    'title' => 'Your Steam library is not syncing',
    'excerpt' => 'Steam answers a private library and an empty one identically. Two privacy settings decide which one we see.',
    'seo_description' => 'TechPlay says your Steam library is private or empty. Set both your Steam profile and Game details to Public, then sync again.',
    'focus_keyword' => 'steam library not syncing',
    'content' => <<<'HTML'
<p>If your shelf came back empty, or the connection reads <strong>Private</strong>, Steam is answering our request without telling us what you own.</p>

<h2>Two settings, not one</h2>
<p>In Steam: <strong>Profile → Edit Profile → Privacy Settings</strong>.</p>
<ul>
<li><strong>My profile</strong> has to be <strong>Public</strong>. While it is Private or Friends Only, everything under it is too.</li>
<li><strong>Game details</strong> has to be <strong>Public</strong>. This is the one that actually governs the games list, and it is the one people miss — a public profile with private game details still returns nothing.</li>
</ul>
<p>There is also a separate checkbox, <strong>Always keep my total playtime private</strong>. Leaving it ticked lets us see your games but not your hours, so the library fills in while every entry reads zero hours played.</p>

<h2>Then sync again</h2>
<p>Steam does not tell us when you change a setting. Go back to <a href="https://techplay.gg/settings?section=connections">Settings → Connections</a> and press <strong>Sync now</strong>.</p>

<h2>Why we say "private" rather than "synced"</h2>
<p>Worth knowing, because it explains a confusing state we used to show. When a library is private, Steam does not return an error — it returns a perfectly normal success with nothing in it, which is indistinguishable from owning no games unless you look closely. For a while that meant the page said <em>Synced</em> over an empty shelf, which is the one situation where the fix belongs entirely to you and nothing on the page said so. Now it says Private and tells you which switch to move.</p>

<h2>How often it re-syncs by itself</h2>
<p>Once a week, and an account synced in the last six days is skipped. If you have just bought something and want it on your shelf now, <strong>Sync now</strong> is immediate.</p>
HTML,
];

$answers[] = [
    'topic' => 'connected-accounts',
    'slug' => 'connect-your-xbox-account',
    'sort_order' => 3,
    'title' => 'Connect your Xbox account',
    'excerpt' => 'You type a gamertag, so anyone could type yours. The code in your Xbox bio is what proves it is you.',
    'seo_description' => 'Link Xbox to TechPlay with your gamertag, then verify it by putting a short code in your Xbox profile bio.',
    'focus_keyword' => 'connect xbox to techplay',
    'content' => <<<'HTML'
<p>Open <a href="https://techplay.gg/settings?section=connections">Settings → Connections</a>, press <strong>Connect</strong> beside Xbox, and type your gamertag.</p>

<h2>Your Xbox profile has to be visible</h2>
<p>We look the gamertag up through Xbox Live. If the profile is set to private we cannot see it at all, and the error will say the gamertag was not found even though you spelled it correctly.</p>

<h2>Then prove it is yours</h2>
<p>Anyone can type any gamertag, so linking on its own proves nothing — without the next step, somebody could put a well-known player's handle on their profile.</p>
<ol>
<li>Press <strong>Verify</strong>. We give you a short code.</li>
<li>Put that code anywhere in your <strong>Xbox profile bio</strong>.</li>
<li>Come back and press <strong>Verify</strong> again.</li>
<li>Once it passes, delete the code from your bio. It has done its job.</li>
</ol>
<p>If verification fails immediately after you saved the bio, wait a minute and try once more. Xbox takes a little while to publish a profile change, and until it does we are reading the old version.</p>

<h2>What gets imported</h2>
<p>Your games and your gamerscore. The import starts as soon as the gamertag is linked — verification is about who the profile belongs to, not about whether the library arrives.</p>
HTML,
];

$answers[] = [
    'topic' => 'connected-accounts',
    'slug' => 'connect-your-playstation-account',
    'sort_order' => 4,
    'title' => 'Connect your PlayStation account',
    'excerpt' => 'Sony offers no approval screen to sites like ours, so you copy one value out of a page while signed in.',
    'seo_description' => 'Link PlayStation to TechPlay by copying your npsso token from Sony while signed in. It expires quickly, so copy it fresh.',
    'focus_keyword' => 'connect playstation to techplay',
    'content' => <<<'HTML'
<p>PlayStation is the awkward one, and it is worth saying why before the steps: <strong>Sony has no approval screen for third-party sites</strong>. There is no "Sign in with PlayStation" button to send you to. So instead of approving us, you fetch one value from Sony yourself and hand it over.</p>

<h2>The steps</h2>
<ol>
<li>Sign in at <strong>playstation.com</strong> in the same browser.</li>
<li>Open <a href="https://ca.account.sony.com/api/v1/ssocookie" rel="noopener noreferrer" target="_blank">ca.account.sony.com/api/v1/ssocookie</a>. It shows a short line of text, not a page.</li>
<li>Copy the long value next to <strong>npsso</strong> — just the value, without the quotation marks.</li>
<li>Paste it into the PlayStation box in <a href="https://techplay.gg/settings?section=connections">Settings → Connections</a>.</li>
</ol>

<h2>If it says the token did not work</h2>
<p>Almost always because it went stale. That value expires quickly, so a token copied ten minutes ago into a tab you then forgot about will be refused. Reload the Sony page and copy a fresh one.</p>
<p>The other cause is copying the whole line rather than the value — <code>{"npsso":"…"}</code> pasted in full will not exchange.</p>

<h2>What we do with it</h2>
<p>We exchange it once, immediately, for our own access token, and it is that token we keep — not the npsso. It is what lets us read your trophies and your played games.</p>

<h2>Disconnecting</h2>
<p>Press disconnect in Settings and the stored tokens are removed. Changing your PlayStation password also invalidates them on Sony's side, which is a perfectly good way to revoke access from outside our site.</p>
HTML,
];

$answers[] = [
    'topic' => 'connected-accounts',
    'slug' => 'connect-your-gog-account',
    'sort_order' => 5,
    'title' => 'Connect your GOG account',
    'excerpt' => 'GOG has no sign-in programme for other sites, so you copy a code out of the address bar. The blank page is meant to be blank.',
    'seo_description' => 'Link GOG to TechPlay by signing in on GOG and copying the code from the address bar. The success page is blank on purpose.',
    'focus_keyword' => 'connect gog to techplay',
    'content' => <<<'HTML'
<p>GOG runs no sign-in programme for third-party sites, so this is the same route the GOG Galaxy client itself takes: you sign in on GOG's own page and copy a code out of the address bar.</p>

<h2>The steps</h2>
<ol>
<li>In <a href="https://techplay.gg/settings?section=connections">Settings → Connections</a>, open the GOG box and follow the sign-in link.</li>
<li>Sign in on GOG's page as normal.</li>
<li>You land on a <strong>blank white page</strong>. That is correct — there is nothing to read there.</li>
<li>Look at the address bar. It ends with <code>?code=</code> followed by a long string. Copy everything after <code>code=</code>.</li>
<li>Paste it back into the GOG box.</li>
</ol>

<h2>If the code is refused</h2>
<p>Those codes are <strong>single use and short lived</strong>. If you pasted one, it failed for any reason, and then you pasted the same one again, it will fail every time after the first. Open the sign-in link again and take a new one.</p>
<p>Also check you did not copy the <code>&amp;</code> and whatever follows it. Only the value between <code>code=</code> and the next <code>&amp;</code> belongs in the box.</p>

<h2>Why not a normal sign-in button</h2>
<p>Because GOG does not offer one. The alternative would be asking for your GOG password, which we will not do for any platform.</p>
HTML,
];

$answers[] = [
    'topic' => 'connected-accounts',
    'slug' => 'connect-your-epic-account',
    'sort_order' => 6,
    'title' => 'Connect your Epic Games account',
    'excerpt' => 'Epic will let a website confirm who you are, but not what you own. So this uses the launcher route instead.',
    'seo_description' => 'Link Epic Games to TechPlay by pasting an authorization code Epic hands you while signed in. It is single use and expires in minutes.',
    'focus_keyword' => 'connect epic games to techplay',
    'content' => <<<'HTML'
<p>Epic does offer a sign-in for websites, and it is no use here: <strong>it cannot read your library</strong>. Epic's web sign-in has no permission covering what you own, which is checked against their own documentation. So this uses the route the desktop launcher uses — the same one Legendary and Heroic take.</p>

<h2>The steps</h2>
<ol>
<li>Make sure you are signed in to <strong>epicgames.com</strong> in this browser.</li>
<li>In <a href="https://techplay.gg/settings?section=connections">Settings → Connections</a>, open the Epic box and follow the link.</li>
<li>Epic answers with a small block of text rather than a page. Find <code>authorizationCode</code> in it and copy the value in quotes beside it.</li>
<li>Paste it into the Epic box.</li>
</ol>

<h2>If the code is refused</h2>
<p>Epic's codes are <strong>single use and expire in minutes</strong>. If it did not work first time, open the link again for a fresh one rather than reusing the one on your clipboard.</p>
<p>If Epic's page asks you to sign in rather than showing the text, sign in and then open the link again — the code only exists for a session that is already signed in.</p>

<h2>If it says Epic linking is switched off</h2>
<p>That is us, not you. It means the integration is disabled at our end, usually while something is being fixed. Nothing you can do from your side will change it; try again later.</p>
HTML,
];

$answers[] = [
    'topic' => 'connected-accounts',
    'slug' => 'the-same-game-appears-twice-in-my-library',
    'sort_order' => 7,
    'title' => 'The same game appears twice in my library',
    'excerpt' => 'Usually two shop entries that really are two products. Sometimes not — and we would rather show you two than silently merge the wrong pair.',
    'seo_description' => 'Why a game can appear twice in your TechPlay library, why we do not merge duplicates automatically, and what is planned instead.',
    'focus_keyword' => 'duplicate games in library',
    'content' => <<<'HTML'
<p>Owning a game on two platforms does not normally double it. One game is one card, and the platforms you own it on show as several small icons on that single card.</p>
<p>It happens when the two shops disagree about what the game is. Steam's entry and Xbox's entry can land on two different rows in our catalogue, and then your shelf shows both.</p>

<h2>Why we do not just merge them by name</h2>
<p>Because the obvious rule is wrong often enough to do real damage. <strong>Resident Evil 4</strong> has five entries in our catalogue and four of them are genuinely different products: the 2023 remake, the 2014 HD release, and two separate Xbox editions. Merging those would be destroying information, not tidying it.</p>
<p>Adding the release year does not rescue the rule either — the catalogue's dates come from the shops and some of them are simply wrong. Matching on name and year would correctly join about one duplicate pair in fourteen, and would quietly merge genuinely different games on everybody's shelf to get there.</p>
<p>So we leave them. A visible duplicate is a small annoyance you can see and reason about. A wrong merge is invisible and permanent.</p>

<h2>What is planned</h2>
<p>Merging by hand: you press "same game" on the pair, we join them, and the choice is remembered so the next library sync does not undo it. It is not built yet.</p>

<h2>If you have a pair</h2>
<p><a href="https://techplay.gg/contact?from=help&amp;article=the-same-game-appears-twice-in-my-library">Send us the two titles</a>. Real examples are what the manual merge gets designed against, and a few of them are worth more than a rule we guessed at.</p>
HTML,
];

$answers[] = [
    'topic' => 'xp-and-levels',
    'slug' => 'how-xp-and-the-daily-cap-work',
    'sort_order' => 1,
    'title' => 'How XP and the daily cap work',
    'excerpt' => 'A hundred XP a day from ordinary activity, and quests sit outside that ceiling. Reading articles earns nothing.',
    'seo_description' => 'What earns XP on TechPlay, the 100 XP daily cap and when it resets, why quests are exempt, and how XP differs from Bounty.',
    'focus_keyword' => 'techplay xp daily cap',
    'content' => <<<'HTML'
<p>XP measures how long you have been part of the place and how much you have done in it. It only ever goes up.</p>

<h2>What earns it</h2>
<table>
<thead><tr><th>Action</th><th>XP</th></tr></thead>
<tbody>
<tr><td>Reply in a forum thread</td><td>20</td></tr>
<tr><td>Start a forum thread</td><td>15</td></tr>
<tr><td>Finish a game in your library</td><td>15</td></tr>
<tr><td>Message in our Discord</td><td>15</td></tr>
<tr><td>Comment on an article</td><td>10</td></tr>
<tr><td>Review a game</td><td>10</td></tr>
<tr><td>Add a game to your library</td><td>5</td></tr>
</tbody>
</table>
<p>Comments and Discord messages are on a <strong>one-minute cooldown</strong>. A second comment inside that minute is posted normally and simply pays nothing.</p>

<h2>Reading earns nothing</h2>
<p>Worth saying plainly, because people look for it. Opening an article awards no XP and never has. XP is for things you contribute, not things you consume.</p>

<h2>The daily cap</h2>
<p>Ordinary activity is capped at <strong>100 XP a day</strong>, and the day resets at midnight, Sarajevo time. Once you have reached it, everything still works — comments post, games shelve — they just stop paying.</p>
<p>The cap is not there to slow you down. It is there so that an afternoon of low-effort comments cannot outrun a year of actually playing and writing.</p>

<h2>Quests are outside the cap</h2>
<p>A quest that promises 600 XP pays 600 XP, even if you have already hit the ceiling. That is deliberate: a quest can only be claimed once in its period, so the period is what limits it, and putting it under the cap would have made its advertised reward fiction.</p>

<h2>Seasons</h2>
<p>A season can carry an XP multiplier. It is applied to the action's base value first, and the result is what the daily cap then measures — so a busy season fills the day's hundred faster rather than raising it.</p>

<h2>XP is not currency</h2>
<p>This is the distinction people trip over. <strong>XP is progression</strong> — it sets your level and your rank and cannot be spent. <strong>Bounty is the currency</strong>, earned separately through deliberate things: daily streaks, quests, finishing games, publishing, reviews, accepted solutions. Earning XP does not add Bounty.</p>

<h2>Levels and ranks</h2>
<p>Levels are worked out from total XP, and they get more expensive as you climb — 100 XP reaches level 2, but level 28 needs 10,000. Ranks are the named tiers along that ladder: Newcomer, Player, Rookie, Bronze, Silver, Gold, Platinum, Diamond, Master, Grandmaster, and up through Challenger, Elite, Veteran, Legend, Mythic, Immortal, Ascendant, Radiant, Apex and Eternal.</p>
HTML,
];

$answers[] = [
    'topic' => 'email-and-notifications',
    'slug' => 'stop-getting-emails-from-techplay',
    'sort_order' => 1,
    'title' => 'Stop getting emails from TechPlay',
    'excerpt' => 'One link at the bottom of any newsletter, and it takes effect the moment you press it. No sign-in, no confirmation step.',
    'seo_description' => 'How to unsubscribe from TechPlay email: the link in any newsletter, the switch in your settings, and what we still send afterwards.',
    'focus_keyword' => 'unsubscribe from techplay emails',
    'content' => <<<'HTML'
<p>There are two separate things we send, and they are switched off in two different places.</p>

<h2>The newsletter</h2>
<p>Every issue has an <strong>unsubscribe</strong> link at the bottom. Press it and you are off the list immediately — there is no confirmation page to complete and no need to be signed in. If it is easier, Gmail and Outlook also show their own unsubscribe button at the top of the message, which does exactly the same thing.</p>
<p>Your address then goes on a suppression list, which means it stays off even if it would otherwise be added again later — by signing up on the site, for instance. You do not have to do anything twice.</p>

<h2>Notifications about your account</h2>
<p>Replies, mentions, giveaway reminders and the rest are a separate switch: <a href="https://techplay.gg/settings?section=notifications">Settings → Notifications</a>, then turn off <strong>Email me</strong>.</p>
<p>Turning it off never hides anything on the site itself. Everything still appears in your notifications when you visit — it just stops following you into your inbox.</p>

<h2>What still arrives, and why</h2>
<p>Neither switch stops mail you need in order to use the account:</p>
<ul>
<li>the address verification link</li>
<li>password resets</li>
</ul>
<p>These are sent regardless, deliberately. An unsubscribe that also disabled password resets would lock people out of their own accounts, and unsubscribing is not the same as closing an account. If you want the account gone, that is <a href="/privacy-and-your-data/delete-your-account-and-what-happens-to-your-data">a different page</a>.</p>

<h2>Please use the link rather than the spam button</h2>
<p>Reporting a message as spam does stop it — the complaint reaches us and your address is suppressed permanently. But it also tells every mail provider that TechPlay sends unwanted mail, which pushes our messages toward the junk folder for everyone else, including people waiting on a verification link. The unsubscribe link is faster and costs nobody anything.</p>

<h2>If mail keeps arriving after you unsubscribed</h2>
<p>Check the sender address on the message. A newsletter sent before you unsubscribed can sit in a mail queue and land afterwards, but anything sent later should not. If it does, <a href="https://techplay.gg/contact?from=help&amp;article=stop-getting-emails-from-techplay">tell us</a> and include the full message — the headers say which of our systems sent it, which is what we need to find the fault.</p>
HTML,
];

$answers[] = [
    'topic' => 'privacy-and-your-data',
    'slug' => 'delete-your-account-and-what-happens-to-your-data',
    'sort_order' => 1,
    'title' => 'Delete your account, and what happens to your data',
    'excerpt' => 'Everything that names you is removed. Your forum posts stay, attributed to nobody, because deleting them would tear holes in other people\'s conversations.',
    'seo_description' => 'What TechPlay removes when you delete your account, what it keeps and why, and how to do it. Requires your current password and cannot be undone.',
    'focus_keyword' => 'delete techplay account',
    'content' => <<<'HTML'
<p>Go to <a href="https://techplay.gg/settings?section=account">Settings → Account</a> and choose to delete. You will be asked for your <strong>current password</strong> — deletion cannot be undone, and a stolen browser session should not be enough to trigger it.</p>

<h2>What is removed</h2>
<ul>
<li>Your email address, replaced with an unusable placeholder</li>
<li>Your username and display name</li>
<li>Your bio, tagline, location and PC specs</li>
<li>Your avatar and cover image — <strong>the files are deleted from our disk</strong>, not just unlinked</li>
<li>Every platform handle: Steam, PlayStation, Xbox, GOG, Epic, Discord, Battle.net</li>
<li>Every connected account, including the stored access tokens</li>
<li>Your author byline and its links, if you wrote for the site</li>
<li>Every sign-in token, so all your sessions end immediately</li>
</ul>

<h2>What stays, and why</h2>
<p>The account row itself is emptied rather than dropped, because other things point at it.</p>
<ul>
<li><strong>Your forum posts and comments stay</strong>, attributed to "Deleted User". Removing them would take half of other people's conversations with them, leaving replies to nothing.</li>
<li><strong>Your XP, rank and reputation stay</strong> on that anonymous row. They are numbers, and they cannot name anybody.</li>
<li><strong>Giveaway entries stay</strong>, because a draw has an announced winner and removing an entry would change a published result. The IP address and browser string recorded with the entry <em>are</em> removed — they were kept to catch double entries, and that reason ends here.</li>
<li><strong>Your signature on our open letter stays</strong> in the public count, with the name and address removed. Withdrawing it silently would change a number we have published.</li>
<li><strong>PayPal customer and subscription references stay</strong> as financial records. They are kept for accounting and are never shown anywhere.</li>
</ul>

<h2>What it does not do</h2>
<p>It does not free your username or your email address for reuse. Both are replaced with placeholders tied to the old account, so you cannot sign up again with the same address.</p>
<p>It also does not remove you from mailing lists retroactively — but every sign-in token is revoked and the address becomes undeliverable, so nothing reaches you either way. If you only want the email to stop, <a href="/email-and-notifications/stop-getting-emails-from-techplay">unsubscribing</a> is the smaller step and keeps your account.</p>

<h2>Before you do it</h2>
<p>There is no export button yet. If you want a copy of anything — your library, your reviews, your posts — <a href="https://techplay.gg/contact?from=help&amp;article=delete-your-account-and-what-happens-to-your-data">ask us first</a>, while the account still exists. Afterwards there is nothing left to send you.</p>
HTML,
];

foreach ($answers as $answer) {
    $topic = $made[$answer['topic']];

    HelpArticle::updateOrCreate(
        ['slug' => $answer['slug']],
        [
            'help_category_id' => $topic->id,
            'title' => $answer['title'],
            'excerpt' => $answer['excerpt'],
            'content' => $answer['content'],
            'sort_order' => $answer['sort_order'],
            'seo_description' => $answer['seo_description'],
            'focus_keyword' => $answer['focus_keyword'],
            // Drafts. The editor reads them and decides.
            'status' => 'draft',
            'published_at' => null,
        ]
    );
}

// The Turnstile answer written during phase four already lives under its own
// topic; move nothing, only make sure it is filed where the rest expect it.
HelpArticle::where('slug', 'register-button-is-disabled')
    ->update(['help_category_id' => $made['account-and-sign-in']->id]);

echo '  teme:     '.HelpCategory::count().PHP_EOL;
echo '  odgovori: '.HelpArticle::count().' ('.HelpArticle::where('status', 'draft')->count().' nacrta, '.HelpArticle::where('status', 'published')->count().' objavljeno)'.PHP_EOL;
