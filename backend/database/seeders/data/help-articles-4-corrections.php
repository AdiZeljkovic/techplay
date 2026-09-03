<?php

/**
 * Corrections found by reading the code back against what was written.
 *
 * Five claims were wrong. None of them was a typo — each was something I
 * assumed rather than checked, which is exactly the failure a help centre
 * cannot afford: a confidently wrong page costs more than a missing one,
 * because the reader stops looking.
 *
 *   1. Battle.net "is not for signing in".  It is — the sign-in page carries a
 *      Battle.net button beside the Discord one.
 *   2. A password reset "signs you out everywhere except the browser you are
 *      using". During a reset you are not signed in anywhere; every token goes.
 *   3. "A library import never overwrites a status." It does, in two defined
 *      ways, and both surprise people — which is the whole reason to say so.
 *   4. "Changing the username changes the address of your profile." The
 *      username cannot be changed at all; the field is disabled and labelled
 *      "Cannot be changed".
 *   5. Deleting an account asks for the password *and* for you to type your
 *      username. The page mentioned only the password.
 *
 * Plus the two features people use that had no page: commenting on articles
 * (21 written) and the newsletter (56 subscribers).
 */

use App\Models\HelpArticle;
use App\Models\HelpCategory;

// ------------------------------------------------------------ corrections

$fixes = [];

$fixes['sign-in-with-discord'] = [
    'content' => <<<'HTML'
<p>The sign-in page has a <strong>Discord</strong> button. Press it, approve on Discord's page, and you are in — no password to remember.</p>

<h2>It does two things at once</h2>
<p>Signing in this way also <strong>links</strong> your Discord account, and linking is what lets the rest work: Professor Buffy recognises you in the server, your rank role lines up with your rank here, and XP earned in chat lands on this account.</p>

<h2>Battle.net signs you in too</h2>
<p>There is a Battle.net button beside it and it works the same way. It is also what the WoW tools read your characters from, so if you use those, this is the one to link.</p>

<h2>If you already have an account with a password</h2>
<p>Sign in normally first, then attach Discord from <a href="https://techplay.gg/settings?section=connections">Settings → Connections</a>. Doing it in that order attaches Discord to the account you already have. Doing it the other way round can leave you with two.</p>

<h2>"That Discord account is already linked"</h2>
<p>A Discord account can only be attached to one TechPlay account. If you see this, that Discord is on another account here — usually one you made earlier and forgot. <a href="https://techplay.gg/contact?from=help&amp;article=sign-in-with-discord">Tell us the Discord username</a> and we can look.</p>

<h2>Unlinking</h2>
<p>Disconnecting Discord in Settings is safe as long as you have a password set. If Discord is the only way you have ever signed in, set a password first — otherwise you are removing your own key.</p>
HTML,
];

$fixes['reset-a-forgotten-password'] = [
    'content' => <<<'HTML'
<p>Use the <strong>Forgot your password?</strong> link on the sign-in page. Enter your address and we send a reset link.</p>

<h2>The link lasts an hour</h2>
<p>After that it is refused, and a refused link looks the same as a broken one. Ask for a new one rather than clicking the old email again.</p>

<h2>The page never says whether the address exists</h2>
<p>Deliberately. Confirming which addresses are registered would let anyone test a list of email addresses against the site, so the answer is the same either way. If nothing arrives, check junk first, then consider that the address on the account may not be the one you typed.</p>

<h2>If you signed up with Discord or Battle.net</h2>
<p>Then there is no password on the account and nothing to reset — sign in the way you did before. You can set a password afterwards from Settings if you would rather have one.</p>

<h2>Resetting ends every session</h2>
<p>Completing a reset signs the account out <strong>everywhere</strong>, including any device still holding a session you did not know about. Then you sign in again with the new password.</p>
<p>That is the point of it, not a side effect: if somebody else had got in, the reset is what puts them out. It is also why a reset is worth doing even when you remember the password and simply suspect something is wrong.</p>
HTML,
];

$fixes['change-your-password-or-details'] = [
    'title' => 'Change your password, name or email',
    'excerpt' => 'The password and your display name you can change yourself. The username you cannot, and the email goes through us.',
    'seo_description' => 'Changing your TechPlay password and display name, why the username is fixed, and how to change the email address on your account.',
    'content' => <<<'HTML'
<h2>Password</h2>
<p><a href="https://techplay.gg/settings?section=security">Settings → Security</a>. You need your current password, and the new one needs at least <strong>eight characters, with letters and numbers</strong> in it.</p>
<p>Saving it <strong>signs out every other session</strong> — every other browser, phone and tab. Only the one you changed it in stays signed in. A password change that left old sessions alive would be no defence at all against somebody who already had one.</p>

<h2>Display name</h2>
<p><a href="https://techplay.gg/settings?section=profile">Settings → Profile</a>. This is what people see beside your posts, and it can be anything — spaces included. Leave it empty and your username is used instead.</p>

<h2>Username</h2>
<p><strong>Fixed once the account is made.</strong> The field in Settings shows it and will not let you edit it, and there is no way to change it from our side either.</p>
<p>It is the address of your profile and it is what everything you have ever posted is filed under, so changing it would break every link to you that anybody has saved or shared. If you dislike the one you chose, the display name above is the one that shows — the username is mostly a URL.</p>

<h2>Email address</h2>
<p>Not editable in Settings — the field says so. It is the key to password resets and to verification, so changing it is a thing we would rather do with a person in the loop. <a href="https://techplay.gg/contact?from=help&amp;article=change-your-password-or-details">Write to us from the address currently on the account</a> and say what to change it to.</p>
HTML,
];

$fixes['library-statuses-explained'] = [
    'content' => <<<'HTML'
<p>Every game on your shelf carries one status. Most of them are just labels for you; two of them do something.</p>

<table>
<thead><tr><th>Status</th><th>What it says</th></tr></thead>
<tbody>
<tr><td><strong>Playing</strong></td><td>In it right now. Shows on your profile.</td></tr>
<tr><td><strong>Played</strong></td><td>Been in it. Not finished, not abandoned.</td></tr>
<tr><td><strong>Backlog</strong></td><td>Owned, not started. This is what the Backlog Advisor reads.</td></tr>
<tr><td><strong>Completed</strong></td><td>Finished. <strong>Pays 50 Bounty and 15 XP</strong>, once per game, ever.</td></tr>
<tr><td><strong>Wishlist</strong></td><td>Not owned. <strong>Gets you a reminder when it comes out.</strong></td></tr>
<tr><td><strong>Dropped</strong></td><td>Given up on. No judgement; it keeps the backlog honest.</td></tr>
</tbody>
</table>

<h2>Completed pays exactly once</h2>
<p>Marking a game Completed pays the first time and never again — not by moving it away and back, and not by removing it from your shelf and adding it again. The payment is remembered against the game, not against the row on your shelf.</p>

<h2>Wishlist is the useful one</h2>
<p>Anything on your wishlist with a release date ahead of it puts a reminder in the queue. It is the one status that makes the site do something for you later.</p>

<h2>A sync can move a status, in two cases</h2>
<p>Worth knowing, because both surprise people who find a game somewhere they did not put it.</p>
<ul>
<li><strong>Off the backlog.</strong> If a game is in your <em>Backlog</em> and the platform reports that you have actually played it, it moves to <em>Playing</em> if that was recent and <em>Played</em> if it was not. A backlog is a list of things you have not started, so a game you have started does not belong on it.</li>
<li><strong>To Completed.</strong> If the platform reports <strong>every achievement or trophy earned</strong>, the game moves to <em>Completed</em>. That is the closest thing Steam, Xbox and PlayStation have to "I finished this".</li>
</ul>

<h2>What a sync never touches</h2>
<p><strong>Completed, Dropped and Wishlist stay where you put them.</strong> Nothing a platform reports will move a game out of those three, so a game you abandoned stays abandoned even if you load it once, and a game you marked finished is not un-finished by anything.</p>
HTML,
];

$fixes['delete-your-account-and-what-happens-to-your-data'] = [
    'content' => <<<'HTML'
<p>Go to <a href="https://techplay.gg/settings?section=account">Settings → Account</a> and choose to delete. You will be asked to <strong>type your username</strong> and to enter your <strong>current password</strong>. Deletion cannot be undone, and neither a stolen browser session nor a misclick should be enough to trigger it.</p>

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

foreach ($fixes as $slug => $attributes) {
    $article = HelpArticle::where('slug', $slug)->first();

    if (! $article) {
        echo "  NEDOSTAJE: {$slug}".PHP_EOL;

        continue;
    }

    $article->update($attributes);
    echo "  ispravljeno: {$slug}".PHP_EOL;
}

// ------------------------------------------------------------- new answers

$new = [];

$new[] = [
    'topic' => 'forum-and-community',
    'slug' => 'commenting-on-articles',
    'sort_order' => 5,
    'title' => 'Commenting on articles',
    'excerpt' => 'Ten XP a comment, once a minute. The same rules as the forum, because it is the same conversation.',
    'seo_description' => 'How comments work on TechPlay articles: what they earn, the one-minute cooldown, editing and deleting, and what gets one removed.',
    'focus_keyword' => 'techplay article comments',
    'content' => <<<'HTML'
<p>Every article, review and guide takes comments at the bottom. You need an account, and a confirmed email address.</p>

<h2>What a comment earns</h2>
<p><strong>10 XP</strong>, on a <strong>one-minute cooldown</strong>. A second comment inside that minute posts normally and simply pays nothing — the cooldown exists so that a conversation is worth more than a fast typist.</p>
<p>Comments count toward the same 100 XP daily cap as everything else, and they earn no Bounty. Bounty comes from finishing things rather than from talking.</p>

<h2>Replies and votes</h2>
<p>You can reply to a comment rather than to the article, and vote on one. A reply notifies whoever you replied to, and mentioning somebody by name notifies them too — both appear in the bell at the top of the site.</p>

<h2>Editing and deleting</h2>
<p>Your own, at any time. Deleting a comment that has replies leaves the replies in place; they belong to the people who wrote them.</p>

<h2>What gets one removed</h2>
<p>The same rules as the forum — <a href="/forum-and-community/what-gets-a-post-removed">what gets a post removed</a> covers them. In short: argue with the argument, not the person, and nothing that needs a warning label.</p>
<p>Use <strong>Report</strong> rather than replying to something that breaks a rule. Replying gives it the argument it was looking for and puts you in the middle of something you were trying to stop.</p>

<h2>Comments on game lists are separate</h2>
<p>A published list takes its own comments, and whoever made the list decides whether it takes them at all. See <a href="/tools-and-lists/make-and-share-a-game-list">make and share a game list</a>.</p>
HTML,
];

$new[] = [
    'topic' => 'email-and-notifications',
    'slug' => 'the-newsletter',
    'sort_order' => 3,
    'title' => 'The newsletter',
    'excerpt' => 'One email, occasionally, about what actually happened. You confirm the address before anything is sent.',
    'seo_description' => 'What the TechPlay newsletter is, how to subscribe, the confirmation step, and how it differs from account notifications.',
    'focus_keyword' => 'techplay newsletter',
    'content' => <<<'HTML'
<p>The newsletter is one email, sent occasionally, about what has been happening on the site. It is not a daily digest and it is not automated from the feed.</p>

<h2>Subscribing</h2>
<p>The <a href="https://techplay.gg/newsletter">newsletter page</a> takes an address. You do <strong>not</strong> need an account — it is open to anyone.</p>
<p>If you do have an account and your email is confirmed, you are already reachable and do not need to sign up separately.</p>

<h2>You confirm the address first</h2>
<p>Signing up sends a confirmation link, and nothing is sent until you follow it. That is not a formality: without it, anybody could put your address on our list, and the first you would hear of it is mail you never asked for.</p>
<p>If the confirmation does not arrive, the causes are the same as for the account one — see <a href="/account-and-sign-in/verification-email-never-arrived">your verification email never arrived</a>.</p>

<h2>It is not the same as notifications</h2>
<p>Three separate things, controlled in three separate places:</p>
<ul>
<li>The <strong>newsletter</strong> — this. Its own list, its own unsubscribe link.</li>
<li><strong>Account notifications</strong> — replies, mentions, giveaway reminders. One switch in <a href="https://techplay.gg/settings?section=notifications">Settings → Notifications</a>.</li>
<li><strong>Discord pings</strong> — opt-in, with <code>/subscribe</code> in the server.</li>
</ul>
<p>Turning one off does nothing to the others. See <a href="/email-and-notifications/what-we-send-you">what we send you</a> for the whole picture.</p>

<h2>Leaving</h2>
<p>Every issue carries an unsubscribe link, and it takes effect the moment you press it — no sign-in, no confirmation page. <a href="/email-and-notifications/stop-getting-emails-from-techplay">Stop getting emails from TechPlay</a> has the detail.</p>
HTML,
];

foreach ($new as $answer) {
    HelpArticle::updateOrCreate(
        ['slug' => $answer['slug']],
        [
            'help_category_id' => HelpCategory::where('slug', $answer['topic'])->value('id'),
            'title' => $answer['title'],
            'excerpt' => $answer['excerpt'],
            'content' => $answer['content'],
            'sort_order' => $answer['sort_order'],
            'seo_description' => $answer['seo_description'],
            'focus_keyword' => $answer['focus_keyword'],
            'status' => 'published',
            'published_at' => now(),
        ]
    );
    echo "  novo: {$answer['slug']}".PHP_EOL;
}

echo PHP_EOL.'  ukupno odgovora: '.HelpArticle::count().' ('.HelpArticle::where('status', 'published')->count().' objavljeno)'.PHP_EOL;
