<?php

/**
 * The second set, covering the rest of what the platform actually does.
 *
 * Written the same way as the first: every figure and every step was read out
 * of the code or off the production database. The XP and Bounty numbers come
 * from XpService, BountyService, StreakService and the award sites that call
 * them; the achievement criteria and the customisation prices are counted from
 * the live tables; the giveaway rules are GiveawayController::enter.
 *
 * Three surfaces are deliberately absent, and the absence is the finding
 * rather than an oversight — see the report that came with this.
 *
 * All drafts.
 */

use App\Models\HelpArticle;
use App\Models\HelpCategory;

$topics = [
    'account-and-sign-in' => ['name' => 'Account & sign-in', 'sort_order' => 1],
    'connected-accounts' => ['name' => 'Connected accounts & your library', 'sort_order' => 2],
    'your-profile' => [
        'name' => 'Your profile',
        'description' => 'Who can see it, what the badges mean, and how to make it yours.',
        'icon' => 'heroicon-o-user-circle',
        'sort_order' => 3,
    ],
    'xp-and-levels' => ['name' => 'XP, levels & rewards', 'sort_order' => 4],
    'discord' => [
        'name' => 'Discord',
        'description' => 'Linking your account, what Professor Buffy can do, and roles that will not line up.',
        'icon' => 'heroicon-o-chat-bubble-left-right',
        'sort_order' => 5,
    ],
    'games-and-the-catalogue' => [
        'name' => 'Games & the catalogue',
        'description' => 'Three hundred thousand games, where they come from, and what to do when one is wrong.',
        'icon' => 'heroicon-o-squares-2x2',
        'sort_order' => 6,
    ],
    'giveaways' => [
        'name' => 'Giveaways',
        'description' => 'How to enter, and how a winner is actually picked.',
        'icon' => 'heroicon-o-gift',
        'sort_order' => 7,
    ],
    'email-and-notifications' => ['name' => 'Email & notifications', 'sort_order' => 8],
    'privacy-and-your-data' => ['name' => 'Privacy & your data', 'sort_order' => 9],
];

$made = [];

foreach ($topics as $slug => $attributes) {
    $existing = HelpCategory::where('slug', $slug)->first();

    // Existing topics keep their description and icon; only the running order
    // changes, because three new topics have to slot in between them.
    $made[$slug] = $existing
        ? tap($existing)->update(['sort_order' => $attributes['sort_order']])
        : HelpCategory::create($attributes + ['slug' => $slug, 'is_published' => true]);
}

$answers = [];

// ------------------------------------------------------ account & sign-in

$answers[] = [
    'topic' => 'account-and-sign-in',
    'slug' => 'sign-in-with-discord',
    'sort_order' => 3,
    'title' => 'Sign in with Discord',
    'excerpt' => 'One button instead of a password. It also links the account, which is what makes the bot recognise you.',
    'seo_description' => 'Using Discord to sign in to TechPlay, what linking gives you, and what happens if that Discord account is already attached to someone else.',
    'focus_keyword' => 'techplay discord sign in',
    'content' => <<<'HTML'
<p>The sign-in page has a <strong>Continue with Discord</strong> button. Press it, approve on Discord's page, and you are in — no password to remember.</p>

<h2>It does two things at once</h2>
<p>Signing in this way also <strong>links</strong> your Discord account, and linking is what lets the rest work: Professor Buffy recognises you in the server, your rank role lines up with your rank here, and XP earned in chat lands on this account.</p>

<h2>If you already have an account with a password</h2>
<p>Sign in normally first, then attach Discord from <a href="https://techplay.gg/settings?section=connections">Settings → Connections</a>. Doing it in that order attaches Discord to the account you already have. Doing it the other way round can leave you with two.</p>

<h2>"That Discord account is already linked"</h2>
<p>A Discord account can only be attached to one TechPlay account. If you see this, that Discord is on another account here — usually one you made earlier and forgot. <a href="https://techplay.gg/contact?from=help&amp;article=sign-in-with-discord">Tell us the Discord username</a> and we can look.</p>

<h2>Battle.net</h2>
<p>There is a Battle.net link as well, and it does less: it is there for the WoW character tools, not for signing in.</p>

<h2>Unlinking</h2>
<p>Disconnecting Discord in Settings is safe as long as you have a password set. If Discord is the only way you have ever signed in, set a password first — otherwise you are removing your own key.</p>
HTML,
];

$answers[] = [
    'topic' => 'account-and-sign-in',
    'slug' => 'reset-a-forgotten-password',
    'sort_order' => 4,
    'title' => 'Reset a forgotten password',
    'excerpt' => 'The link on the sign-in page works and is good for an hour. If you only ever signed in with Discord, you do not have a password to reset.',
    'seo_description' => 'How to reset your TechPlay password, how long the link lasts, and what to do if you signed up through Discord and never set one.',
    'focus_keyword' => 'techplay forgot password',
    'content' => <<<'HTML'
<p>Use the <strong>Forgot your password?</strong> link on the sign-in page. Enter your address and we send a reset link.</p>

<h2>The link lasts an hour</h2>
<p>After that it is refused, and a refused link looks the same as a broken one. Ask for a new one rather than clicking the old email again.</p>

<h2>The page never says whether the address exists</h2>
<p>Deliberately. Confirming which addresses are registered would let anyone test a list of email addresses against the site, so the answer is the same either way. If nothing arrives, check junk first, then consider that the address on the account may not be the one you typed.</p>

<h2>If you signed up with Discord</h2>
<p>Then there is no password on the account and nothing to reset — sign in with Discord instead. You can set a password afterwards from Settings if you would rather have one.</p>

<h2>The new password ends your other sessions</h2>
<p>Setting a password signs you out everywhere except the browser you are using. That is on purpose: if someone else had got in, changing the password is what puts them out.</p>
HTML,
];

$answers[] = [
    'topic' => 'account-and-sign-in',
    'slug' => 'change-your-password-or-details',
    'sort_order' => 5,
    'title' => 'Change your password, username or email',
    'excerpt' => 'Two of the three you can do yourself. The email address is not one of them.',
    'seo_description' => 'Changing your TechPlay password and username from Settings, the password rules, and why the email address has to go through us.',
    'focus_keyword' => 'change techplay password',
    'content' => <<<'HTML'
<h2>Password</h2>
<p><a href="https://techplay.gg/settings?section=security">Settings → Security</a>. You need your current password, and the new one needs at least <strong>eight characters, with letters and numbers</strong> in it.</p>
<p>Saving it <strong>signs out every other session</strong> — every other browser, phone and tab. Only the one you changed it in stays signed in. A password change that left old sessions alive would be no defence at all against somebody who already had one.</p>

<h2>Username and display name</h2>
<p><a href="https://techplay.gg/settings?section=profile">Settings → Profile</a>. The username is the one in your profile address; the display name is what people see beside your posts. Changing the username changes the address of your profile, so old links to it stop working.</p>

<h2>Email address</h2>
<p>Not editable here — the field says so. It is the key to password resets and to verification, so changing it is a thing we would rather do with a person in the loop. <a href="https://techplay.gg/contact?from=help&amp;article=change-your-password-or-details">Write to us from the address currently on the account</a> and say what to change it to.</p>
HTML,
];

// ----------------------------------------------- connected accounts

$answers[] = [
    'topic' => 'connected-accounts',
    'slug' => 'what-we-import-from-each-platform',
    'sort_order' => 8,
    'title' => 'What we import from each platform',
    'excerpt' => 'Games from all five. Hours from some. Presence from one. Here is the table.',
    'seo_description' => 'Exactly what TechPlay reads from Steam, Xbox, PlayStation, GOG and Epic once you link them — games, playtime, trophies and live presence.',
    'focus_keyword' => 'what techplay imports from steam',
    'content' => <<<'HTML'
<p>Every platform hands out a different amount, and none of them hands out everything. What arrives is what they will give a third party — not a decision we made.</p>

<table>
<thead><tr><th>Platform</th><th>Games</th><th>Hours</th><th>Achievements</th><th>Now playing</th></tr></thead>
<tbody>
<tr><td>Steam</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
<tr><td>Xbox</td><td>Yes</td><td>—</td><td>Gamerscore</td><td>—</td></tr>
<tr><td>PlayStation</td><td>Yes</td><td>—</td><td>Trophies</td><td>—</td></tr>
<tr><td>GOG</td><td>Yes</td><td>—</td><td>—</td><td>—</td></tr>
<tr><td>Epic</td><td>Yes</td><td>—</td><td>—</td><td>—</td></tr>
<tr><td>Discord</td><td>—</td><td>—</td><td>—</td><td>Yes</td></tr>
</tbody>
</table>

<h2>Hours are a Steam thing</h2>
<p>Steam is the only one of the five that will tell a third party how long you have played something — and only if you have not ticked <em>Always keep my total playtime private</em>. Everywhere else the games arrive and the hours read zero, which is the platform's answer rather than a failed import.</p>

<h2>"Now playing" comes from two places</h2>
<p>Steam presence and Discord Rich Presence. Either one can put a game on your profile while you are in it. Neither works if the platform's own privacy settings hide what you are doing.</p>

<h2>What we never get</h2>
<p>Passwords, payment details, friends lists, messages, and anything you have bought but not added to a library. Steam is read through its public API; the other four are read with tokens you can revoke on their side at any time.</p>

<h2>How often it refreshes</h2>
<p>Once a week automatically, and immediately whenever you press <strong>Sync now</strong> in <a href="https://techplay.gg/settings?section=connections">Settings → Connections</a>.</p>
HTML,
];

$answers[] = [
    'topic' => 'connected-accounts',
    'slug' => 'library-statuses-explained',
    'sort_order' => 9,
    'title' => 'What the library statuses mean',
    'excerpt' => 'Six of them, and only two are worth anything: Completed pays, Wishlist gets you release reminders.',
    'seo_description' => 'Playing, Played, Backlog, Completed, Wishlist and Dropped on TechPlay — what each one does, and which ones change anything.',
    'focus_keyword' => 'techplay library status',
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

<h2>Statuses are yours</h2>
<p>A library import never overwrites one. If a sync brings a game you already had, it keeps the status you gave it — the import adds what is missing rather than replacing what is there.</p>
HTML,
];

$answers[] = [
    'topic' => 'connected-accounts',
    'slug' => 'a-game-appeared-on-my-shelf-by-itself',
    'sort_order' => 10,
    'title' => 'A game appeared on my shelf by itself',
    'excerpt' => 'There is a switch called "Shelve what I play", and it is on by default. One switch turns it off.',
    'seo_description' => 'Why a game appeared in your TechPlay library on its own, and how to stop it — the Shelve what I play setting.',
    'focus_keyword' => 'game added to library automatically',
    'content' => <<<'HTML'
<p>Because the site noticed you playing it. When Steam or Discord reports you in a game for more than a couple of minutes, it goes on your shelf so you do not have to.</p>

<h2>Turning it off</h2>
<p><a href="https://techplay.gg/settings?section=notifications">Settings → Notifications</a>, then switch off <strong>Shelve what I play</strong>. Nothing is added automatically after that; anything already there stays where it is.</p>

<h2>It only adds, it never changes</h2>
<p>A game it shelves for you arrives as unstarted. If a game is already on your shelf with a status you chose, this leaves it alone.</p>

<h2>Play sessions are a separate thing</h2>
<p>Steam playtime also produces <strong>session suggestions</strong> — "you played this for two hours yesterday, add it to your journal?" — which sit there until you accept or dismiss them. Nothing is written to your journal unless you say so.</p>

<h2>If you would rather nothing was watched at all</h2>
<p>Disconnect the platform in <a href="https://techplay.gg/settings?section=connections">Settings → Connections</a>. Presence and playtime both come from the link; removing it stops both.</p>
HTML,
];

$answers[] = [
    'topic' => 'connected-accounts',
    'slug' => 'disconnect-a-platform',
    'sort_order' => 11,
    'title' => 'Disconnect a platform',
    'excerpt' => 'The link and its tokens go. The games you imported stay on your shelf, because by then they are yours.',
    'seo_description' => 'What happens when you disconnect Steam, Xbox, PlayStation, GOG or Epic from TechPlay — and what stays behind.',
    'focus_keyword' => 'disconnect steam from techplay',
    'content' => <<<'HTML'
<p><a href="https://techplay.gg/settings?section=connections">Settings → Connections</a>, then disconnect. It takes effect at once.</p>

<h2>What goes</h2>
<ul>
<li>The link itself, and any access tokens we were holding for it</li>
<li>The platform chip on your public profile</li>
<li>Future library syncs from that platform</li>
<li>"Now playing" from that platform, if it was one of the two that report it</li>
</ul>

<h2>What stays</h2>
<ul>
<li><strong>Every game already on your shelf</strong>, with the statuses, hours and notes you gave them. Your library is yours; the connection was only how it got filled.</li>
<li>Anything you wrote — reviews, lists, journal entries</li>
<li>XP, Bounty and achievements already earned</li>
</ul>

<h2>Just want it off your profile?</h2>
<p>Each connection has a visibility switch next to it. Setting it to hidden takes the chip off your public profile while the library keeps syncing — which is usually what people want when they ask about this.</p>

<h2>Revoking from the other side</h2>
<p>You do not need us. Changing your PlayStation password, or removing our access on GOG or Epic, invalidates the tokens immediately. Steam is read through its public API, so making your profile private has the same effect.</p>
HTML,
];

// --------------------------------------------------------- your profile

$answers[] = [
    'topic' => 'your-profile',
    'slug' => 'who-can-see-your-profile',
    'sort_order' => 1,
    'title' => 'Who can see your profile',
    'excerpt' => 'Public, or friends only. There is no half-way, and a few things stay visible either way.',
    'seo_description' => 'TechPlay profile privacy: public or friends-only, what each setting hides, and what stays visible whatever you choose.',
    'focus_keyword' => 'techplay profile privacy',
    'content' => <<<'HTML'
<p><a href="https://techplay.gg/settings?section=privacy">Settings → Privacy</a> has one choice with two answers.</p>

<h2>Public</h2>
<p>Anyone with the address can open your profile: your library, your level and rank, your achievements, your lists and what you are playing.</p>

<h2>Friends only</h2>
<p>Only people whose friend request you have accepted. Everyone else gets a closed door rather than a thinned-out page — a profile that shows some of you to strangers is harder to reason about than one that shows none.</p>
<p>It applies everywhere, not only on the site. Professor Buffy refuses to read out a private shelf in a Discord channel too — a library read aloud in a channel is still a library read.</p>

<h2>What stays visible either way</h2>
<ul>
<li><strong>Anything you posted in public.</strong> Forum threads, comments and reviews carry your name where you wrote them. Making your profile private does not retract things you said out loud.</li>
<li><strong>Public game lists.</strong> A list you published is published; make it private on the list itself if you want it back.</li>
<li><strong>The leaderboard.</strong> It ranks by XP and shows the name attached to the number.</li>
</ul>

<h2>If you want all of it gone</h2>
<p>That is <a href="/privacy-and-your-data/delete-your-account-and-what-happens-to-your-data">deleting the account</a>, which is a different and much larger thing.</p>
HTML,
];

$answers[] = [
    'topic' => 'your-profile',
    'slug' => 'achievements-and-your-trophy-case',
    'sort_order' => 2,
    'title' => 'Achievements and your trophy case',
    'excerpt' => 'Sixty-seven of them, four of which we will not tell you about. You choose five to show.',
    'seo_description' => 'How TechPlay achievements unlock, what they are counted from, the hidden ones, and how the five-slot trophy case works.',
    'focus_keyword' => 'techplay achievements',
    'content' => <<<'HTML'
<p>There are <strong>67 achievements</strong>. They unlock on their own — nothing to claim, nothing to press.</p>

<h2>What they are counted from</h2>
<p>Almost everything you can do here has one behind it: games added, games completed, games wishlisted, platforms connected, days active, daily streak, friends made, forum posts and threads, accepted solutions, reputation, reviews written, XP earned, and filling in your PC specs.</p>
<p>Most come in steps rather than one at a time — the games-added set runs from your first game to 250, the streak set from three days to a hundred.</p>

<h2>Four are hidden</h2>
<p>They exist, they are unlocked the same way, and we do not list what they need. A hidden achievement you can look up is a task; one you cannot is a surprise, which is the only reason to have them.</p>

<h2>The trophy case</h2>
<p>Your profile shows <strong>five</strong> achievements of your choosing, not the five most recent. Pick them on your own profile — that choice is the point. A wall of every badge you have says nothing; five says what you are proud of.</p>

<h2>If one has not unlocked</h2>
<p>Some are counted from things that settle in the background — playtime and view counts are written down every few minutes rather than instantly. Give it ten minutes. If a milestone you have clearly passed is still locked after that, <a href="https://techplay.gg/contact?from=help&amp;article=achievements-and-your-trophy-case">tell us which one</a>.</p>
HTML,
];

$answers[] = [
    'topic' => 'your-profile',
    'slug' => 'customise-your-profile',
    'sort_order' => 3,
    'title' => 'Customise your profile',
    'excerpt' => 'Thirty-one items — themes, frames, badges and post colours. Some are free, the rest cost Bounty.',
    'seo_description' => 'Profile themes, frames, badges and post colours on TechPlay: what they cost in Bounty and how to equip them.',
    'focus_keyword' => 'techplay profile customization',
    'content' => <<<'HTML'
<p>There are <strong>31</strong> things you can put on a profile, in five kinds.</p>

<table>
<thead><tr><th>Kind</th><th>How many</th><th>Cost in Bounty</th></tr></thead>
<tbody>
<tr><td>Themes</td><td>10</td><td>free to 900</td></tr>
<tr><td>Frames</td><td>7</td><td>free to 800</td></tr>
<tr><td>Badges</td><td>7</td><td>free to 800</td></tr>
<tr><td>Post colours</td><td>5</td><td>200 to 350</td></tr>
<tr><td>Perks</td><td>2</td><td>1000 to 1500</td></tr>
</tbody>
</table>

<h2>Acquire, then equip</h2>
<p>Two separate steps. Acquiring spends the Bounty and is permanent; equipping is what puts it on your profile, and you can change your mind as often as you like at no further cost.</p>

<h2>Some are locked to a tier rather than a price</h2>
<p>A few are tied to supporter status instead of Bounty. Those show as locked until the tier they belong to applies.</p>

<h2>Where the Bounty comes from</h2>
<p>Not from XP — the two are separate on purpose. See <a href="/xp-and-levels/bounty-and-what-to-spend-it-on">Bounty and what to spend it on</a>.</p>

<h2>Post colours</h2>
<p>These change the colour of your name where you post, not the post itself. It is deliberately a small effect: a forum where everybody is shouting in a different colour is a forum nobody can read.</p>
HTML,
];

// ------------------------------------------------------- xp and levels

$answers[] = [
    'topic' => 'xp-and-levels',
    'slug' => 'ranks-and-levels',
    'sort_order' => 2,
    'title' => 'Ranks and levels',
    'excerpt' => 'Twenty ranks along one ladder. Levels get more expensive the higher you go, on purpose.',
    'seo_description' => 'How TechPlay levels are worked out from XP, the twenty ranks on the ladder, and what a rank actually changes.',
    'focus_keyword' => 'techplay ranks levels',
    'content' => <<<'HTML'
<p>Your level is worked out from total XP, and your rank is the named tier your level falls into. Both only go up.</p>

<h2>Levels get more expensive</h2>
<p>100 XP reaches level 2. Level 28 needs 10,000. That curve is deliberate: an early level should arrive quickly enough to mean something, and a late one should be worth having.</p>

<h2>The twenty ranks</h2>
<p>Newcomer, Player, Rookie, Bronze, Silver, Gold, Platinum, Diamond, Master, Grandmaster, Challenger, Elite, Veteran, Legend, Mythic, Immortal, Ascendant, Radiant, Apex, Eternal.</p>

<h2>What a rank changes</h2>
<ul>
<li>The badge on your profile and beside your posts</li>
<li>Your <strong>Discord role</strong>, if you have linked your account — the bot reads the same ladder, so the two cannot drift apart</li>
<li>Your place on the <a href="https://techplay.gg/leaderboard">leaderboard</a></li>
</ul>
<p>Ranks do not unlock features. Nothing on the site is behind one — progression here is something to look at, not a gate.</p>

<h2>Rank up notifications</h2>
<p>You get one when you cross a threshold. If you would rather not, turn off <strong>Email me</strong> in <a href="https://techplay.gg/settings?section=notifications">Settings → Notifications</a> — it still appears on the site.</p>
HTML,
];

$answers[] = [
    'topic' => 'xp-and-levels',
    'slug' => 'bounty-and-what-to-spend-it-on',
    'sort_order' => 3,
    'title' => 'Bounty, and what to spend it on',
    'excerpt' => 'The currency, as opposed to XP which is the score. Earned for finishing things, spent on your profile.',
    'seo_description' => 'What Bounty is on TechPlay, how it differs from XP, exactly what earns it, and what it buys.',
    'focus_keyword' => 'techplay bounty',
    'content' => <<<'HTML'
<p>Two numbers, and people mix them up constantly. <strong>XP is the score</strong> — it sets your level and rank and cannot be spent. <strong>Bounty is the money</strong> — it is spent, and earning XP does not add any.</p>

<h2>What earns Bounty</h2>
<table>
<thead><tr><th>What you did</th><th>Bounty</th></tr></thead>
<tbody>
<tr><td>Mark a game <strong>Completed</strong></td><td>50, once per game</td></tr>
<tr><td>Have an answer accepted as a solution</td><td>25</td></tr>
<tr><td>Write a review of a game</td><td>15, once per game</td></tr>
<tr><td>Claim your daily streak</td><td>10 to 60, depending on the run</td></tr>
<tr><td>Finish a quest</td><td>whatever the quest says</td></tr>
<tr><td>Publish an article (staff)</td><td>30, or 75 for a review</td></tr>
</tbody>
</table>
<p>The "once per game" ones are remembered against the game, not against the row on your shelf — so removing a game and adding it back does not pay twice, and neither does un-completing and re-completing it.</p>

<h2>What it buys</h2>
<p>Profile customisations — themes, frames, badges and post colours, from free up to 1,500 — and a small rewards catalogue on top of that: a profile spotlight, a custom username colour, a shop discount, a theme, a badge and a frame, priced 250 to 1,500.</p>

<h2>It does not buy anything real</h2>
<p>Bounty is not money, cannot be bought with money, cannot be cashed out and cannot be transferred to another account. It exists so the things you do here add up to something visible.</p>

<h2>Where to see the balance</h2>
<p>On your own profile. Every award and every purchase is written down, so the number can always be accounted for.</p>
HTML,
];

$answers[] = [
    'topic' => 'xp-and-levels',
    'slug' => 'daily-streak-and-quests',
    'sort_order' => 4,
    'title' => 'The daily streak and quests',
    'excerpt' => 'Ten Bounty for showing up, rising to sixty on a long run. Quests pay outside the daily XP cap.',
    'seo_description' => 'How the TechPlay daily streak pays, what breaks it, and why quest XP is not limited by the daily cap.',
    'focus_keyword' => 'techplay daily streak',
    'content' => <<<'HTML'
<h2>The streak</h2>
<p>Claim once a day. It pays <strong>10 Bounty</strong> on day one and <strong>5 more for each unbroken day</strong> after that, up to a ceiling of 60 a day. You can also claim it from Discord with <code>/daily</code>.</p>
<p>Miss a day and the run resets to one. But the site counts your <strong>total active days</strong> separately from the unbroken run, so breaking a streak never takes away days you have already put in — several achievements are counted from that total rather than from the streak.</p>

<h2>Quests</h2>
<p>There are <strong>53</strong> of them, on daily, weekly and longer cycles: finish a game, write a review, keep a streak going, add to your library.</p>

<h2>Quests are outside the daily XP cap</h2>
<p>Ordinary activity is capped at 100 XP a day. Quests are not — a quest that promises 600 XP pays 600, even on a day you have already reached the ceiling.</p>
<p>That is deliberate, and it was a bug first: quests used to sit under the cap, so a 600 XP quest paid whatever was left of a hundred and quietly dropped the rest. A reward that does not pay what it advertises is worse than no reward.</p>

<h2>Seasons</h2>
<p>A season can carry an XP multiplier. It is applied to the base value of an action before the daily cap measures it — so a busy season fills the day's hundred faster rather than raising the ceiling. Quests, being outside the cap, feel the multiplier in full.</p>
HTML,
];

// ------------------------------------------------------------- discord

$answers[] = [
    'topic' => 'discord',
    'slug' => 'link-your-discord-account',
    'sort_order' => 1,
    'title' => 'Link your Discord account',
    'excerpt' => 'One link joins the two. After it, chat earns XP here and your rank becomes a role there.',
    'seo_description' => 'How to link Discord to TechPlay, what linking enables, and how to fix it when the bot does not recognise you.',
    'focus_keyword' => 'link discord to techplay',
    'content' => <<<'HTML'
<p>Either sign in with Discord on the site, or attach it from <a href="https://techplay.gg/settings?section=connections">Settings → Connections</a> if you already have an account.</p>

<h2>What it turns on</h2>
<ul>
<li><strong>XP for talking.</strong> A message in our server is worth 15 XP, on a one-minute cooldown, and it counts against the same 100-a-day cap as everything else.</li>
<li><strong>Your rank as a role.</strong> The bot reads the same rank ladder the site does, so the role you carry there is the rank you hold here.</li>
<li><strong>The commands that need to know who you are</strong> — <code>/profile</code>, <code>/library</code>, <code>/daily</code>, <code>/backlog</code>, <code>/match</code>.</li>
<li><strong>Presence.</strong> If Discord says you are in a game, that can appear on your profile.</li>
</ul>

<h2>The bot does not know me</h2>
<p>Run <code>/link</code> in the server. It tells you where you stand and what to do next. The usual cause is having two accounts — one made with Discord and one made with an email address — and the bot is looking at the wrong one.</p>

<h2>One Discord, one account</h2>
<p>A Discord account attaches to exactly one TechPlay account. "Already linked" means it is on another one here.</p>

<h2>Being in the server is separate from having linked</h2>
<p>The bot is the only thing that knows who is actually in the server, as opposed to who linked once and left. Some things check membership rather than the link.</p>
HTML,
];

$answers[] = [
    'topic' => 'discord',
    'slug' => 'what-professor-buffy-can-do',
    'sort_order' => 2,
    'title' => 'What Professor Buffy can do',
    'excerpt' => 'Nineteen commands. The useful ones read your shelf, compare it with a friend, and tell you what to play next.',
    'seo_description' => 'Every Professor Buffy command on the TechPlay Discord — profile, library, match, backlog, daily, giveaways and more.',
    'focus_keyword' => 'professor buffy discord commands',
    'content' => <<<'HTML'
<p>Professor Buffy is our Discord bot. <code>/help</code> lists everything; these are the ones worth knowing.</p>

<h2>About you</h2>
<table>
<thead><tr><th>Command</th><th>What it does</th></tr></thead>
<tbody>
<tr><td><code>/profile</code></td><td>Your TechPlay profile, or somebody else's</td></tr>
<tr><td><code>/library</code></td><td>A shelf — yours or a friend's, filtered by status</td></tr>
<tr><td><code>/match</code></td><td>How much your taste overlaps with someone else's</td></tr>
<tr><td><code>/backlog</code></td><td>Three things to play next, out of what you already own</td></tr>
<tr><td><code>/daily</code></td><td>Claim the daily streak without leaving Discord</td></tr>
<tr><td><code>/link</code>, <code>/sync</code></td><td>Attach your account; line your role up with your rank</td></tr>
</tbody>
</table>

<h2>About everything else</h2>
<table>
<tbody>
<tr><td><code>/game</code></td><td>Look a game up in the catalogue. It suggests as you type — with this many games, typing a title blind and hoping is a guess, not a search</td></tr>
<tr><td><code>/search</code></td><td>Find an article</td></tr>
<tr><td><code>/latest</code></td><td>The newest stories</td></tr>
<tr><td><code>/forum</code></td><td>What is being discussed</td></tr>
<tr><td><code>/giveaways</code></td><td>What is running now</td></tr>
<tr><td><code>/leaderboard</code></td><td>The XP table</td></tr>
<tr><td><code>/subscribe</code></td><td>Turn news or giveaway pings on and off</td></tr>
<tr><td><code>/gift</code></td><td>Send XP to somebody else, 10 to 1000</td></tr>
<tr><td><code>/tip</code>, <code>/stats</code>, <code>/techplay</code></td><td>A tip, server stats, whether the site is up</td></tr>
</tbody>
</table>

<h2>A private profile stays private</h2>
<p>Every command that reads a shelf refuses a profile set to friends-only. A library read out in a channel is still a library read.</p>
HTML,
];

$answers[] = [
    'topic' => 'discord',
    'slug' => 'your-discord-role-is-wrong',
    'sort_order' => 3,
    'title' => 'Your Discord role does not match your rank',
    'excerpt' => 'Run /sync. Roles are applied when something changes, so a rank earned while the bot was down needs a nudge.',
    'seo_description' => 'Fixing a TechPlay Discord rank role that is out of date or missing — /sync, and the two reasons it happens.',
    'focus_keyword' => 'discord role not syncing techplay',
    'content' => <<<'HTML'
<p>Run <code>/sync</code> in the server. That re-reads your rank and applies the matching role.</p>

<h2>Why it drifts</h2>
<p>Roles are applied at the moment your rank changes. If the bot was restarting or Discord was refusing writes at exactly that moment, the rank moved here and the role did not move there. Nothing re-checks it on a schedule for every member, so it stays wrong until something asks.</p>

<h2>If /sync says you are not linked</h2>
<p>Then the two accounts are not attached — see <a href="/discord/link-your-discord-account">Link your Discord account</a>.</p>

<h2>If the role does not exist in the server</h2>
<p>There is a role per rank and there are twenty ranks. If yours is missing, that is ours to fix rather than yours: <a href="https://techplay.gg/contact?from=help&amp;article=your-discord-role-is-wrong">tell us which rank</a>, or say so in the server.</p>

<h2>A role the bot cannot reach</h2>
<p>Discord will not let a bot manage a role positioned above its own. If a rank role has been dragged up the list, the bot silently cannot apply it. Again ours, not yours.</p>
HTML,
];

// -------------------------------------------------- games and catalogue

$answers[] = [
    'topic' => 'games-and-the-catalogue',
    'slug' => 'a-game-is-missing-or-its-details-are-wrong',
    'sort_order' => 1,
    'title' => 'A game is missing, or its details are wrong',
    'excerpt' => 'The catalogue is over three hundred thousand games assembled from shops. Some of it is wrong, and we would rather say so.',
    'seo_description' => 'Where TechPlay game data comes from, why some release dates and covers are wrong, and how to report a game that is missing.',
    'focus_keyword' => 'techplay game missing catalogue',
    'content' => <<<'HTML'
<p>The catalogue holds over <strong>330,000 games</strong>. It is assembled from what the shops publish — Steam and PlayStation are the live sources — rather than typed in by us.</p>

<h2>Which means some of it is wrong</h2>
<p>Release dates are the worst of it, and we would rather tell you than let you find out: the shops' own dates include obvious nonsense, and it survives into the catalogue. If a date looks impossible, it probably is.</p>
<p>Covers, genres and platform lists come from the same place and carry the same risk. None of it is invented at our end, which also means none of it is ours to simply correct without a source.</p>

<h2>The same game more than once</h2>
<p>Common, and usually correct. A remaster, a regional edition and a console version genuinely are different products. Where it is genuinely the same game twice, see <a href="/connected-accounts/the-same-game-appears-twice-in-my-library">the same game appears twice in my library</a>.</p>

<h2>A game that is not there at all</h2>
<p>Most likely it is not on the shops we read, or it is listed under a name you would not guess. Try the search with fewer words first.</p>

<h2>Telling us</h2>
<p><a href="https://techplay.gg/contact?from=help&amp;article=a-game-is-missing-or-its-details-are-wrong">Send the name and, if you have it, the store link.</a> A store link is worth ten reports without one, because it is the thing that lets us find the entry rather than guess at it.</p>
HTML,
];

$answers[] = [
    'topic' => 'games-and-the-catalogue',
    'slug' => 'rating-and-reviewing-games',
    'sort_order' => 2,
    'title' => 'Rating and reviewing a game',
    'excerpt' => 'Your score is yours and sits apart from ours. Writing one pays 15 Bounty, once per game.',
    'seo_description' => 'How to rate and review a game on TechPlay, how reader scores differ from editorial reviews, and what a review earns.',
    'focus_keyword' => 'rate a game on techplay',
    'content' => <<<'HTML'
<p>Open a game's page and rate it. You can leave a written review with the score or just the score.</p>

<h2>Two different things called a review</h2>
<p>Ours are written by the editorial team, scored against a <a href="https://techplay.gg/rating-system">published method</a>, and appear in the Reviews section. Yours are reader scores, shown on the game's page and on your profile. Neither moves the other — an editorial score is not a average of readers, and readers are not marking our homework.</p>

<h2>What writing one earns</h2>
<p><strong>15 Bounty and 10 XP</strong>, once per game. Once means once: editing it, deleting it and writing a new one, or unpublishing and republishing all pay nothing further. That is not meanness — it used to pay each time, which made a single game worth an afternoon of farming.</p>

<h2>Changing or removing it</h2>
<p>Rate the game again to change the score. Removing the review removes it from the game's page; the Bounty already paid stays paid.</p>

<h2>What we will remove</h2>
<p>Reviews that are abuse aimed at a person rather than an opinion about a game. Disliking a game as loudly as you want is fine — that is what the box is for.</p>
HTML,
];

// ----------------------------------------------------------- giveaways

$answers[] = [
    'topic' => 'giveaways',
    'slug' => 'how-giveaways-work',
    'sort_order' => 1,
    'title' => 'How giveaways work',
    'excerpt' => 'One entry per account. Tasks and referrals earn extra points; a network is limited to five entries.',
    'seo_description' => 'Entering a TechPlay giveaway, how extra points work, the limits that stop multiple accounts, and how winners are drawn.',
    'focus_keyword' => 'techplay giveaway entry',
    'content' => <<<'HTML'
<p>Open a giveaway and press enter. You need an account — an anonymous entry cannot be contacted if it wins.</p>

<h2>One entry per account</h2>
<p>Entering twice does nothing; the second press finds the entry you already have. Some giveaways then offer <strong>tasks</strong> that add points to that entry, and points are what weight the draw.</p>

<h2>Referrals</h2>
<p>Where a giveaway offers it, sharing your link earns you points when somebody enters through it. The points go to you, and the person who used it enters normally — nobody is worse off for having used a link.</p>

<h2>Five entries per network</h2>
<p>A single network address can enter a given giveaway five times at most, across all accounts on it. That is a blunt limit and it has a cost we accept: a household, a student hall or an office can hit it legitimately. It is still better than the alternative, which is one person with ten accounts winning everything and everybody else quietly leaving.</p>
<p>If you have hit it and you should not have, <a href="https://techplay.gg/contact?from=help&amp;article=how-giveaways-work">say so</a> before the giveaway closes.</p>

<h2>How a winner is picked</h2>
<p>Drawn from the entries when the giveaway ends, weighted by points, with the number of winners set per prize tier. The winner is named on the giveaway page afterwards, so the result is checkable rather than announced privately.</p>

<h2>We record an address and a browser string with your entry</h2>
<p>Only to enforce the limit above. Both are removed if you delete your account, while the entry itself stays — a draw that has already announced a winner should not change afterwards.</p>
HTML,
];

// ------------------------------------------------ email & notifications

$answers[] = [
    'topic' => 'email-and-notifications',
    'slug' => 'what-we-send-you',
    'sort_order' => 2,
    'title' => 'What we send you, and where it appears',
    'excerpt' => 'Three channels — the site, your inbox, Discord — and one switch that governs the middle one.',
    'seo_description' => 'Every kind of notification TechPlay sends, which channel it uses, and which switch turns it off.',
    'focus_keyword' => 'techplay notifications',
    'content' => <<<'HTML'
<p>Notifications reach you in up to three places, and they are controlled separately.</p>

<h2>On the site</h2>
<p>The bell in the header. Everything appears here, and nothing switches it off — it is the record of what happened while you were away.</p>
<ul>
<li>Replies to your posts and comments, and mentions of your name</li>
<li>Friend requests</li>
<li>Threads you are watching</li>
<li>Rank ups, achievements unlocked, quests completed, recognitions received</li>
<li>Giveaway reminders and results</li>
<li>Wishlist games releasing, or being reviewed</li>
</ul>

<h2>In your inbox</h2>
<p>The ones worth interrupting you for, governed by a single switch: <strong>Email me</strong> in <a href="https://techplay.gg/settings?section=notifications">Settings → Notifications</a>. Turning it off never hides anything on the site.</p>
<p>Two kinds ignore that switch, deliberately: <strong>email verification</strong> and <strong>password resets</strong>. An unsubscribe that also disabled password resets would lock people out of their own accounts.</p>

<h2>In Discord</h2>
<p>Separate again, and opt-in. <code>/subscribe news</code> and <code>/subscribe giveaway</code> in the server; <code>/subscribe status</code> shows where you stand.</p>

<h2>The newsletter is none of these</h2>
<p>It is its own list with its own unsubscribe link — see <a href="/email-and-notifications/stop-getting-emails-from-techplay">stop getting emails from TechPlay</a>.</p>
HTML,
];

// ------------------------------------------------------ privacy & data

$answers[] = [
    'topic' => 'privacy-and-your-data',
    'slug' => 'cookies-and-what-we-measure',
    'sort_order' => 2,
    'title' => 'Cookies, and what we measure',
    'excerpt' => 'Analytics and advertising are both off until you say otherwise. The banner is a real choice, not a formality.',
    'seo_description' => 'What TechPlay measures, which cookies it sets, and how to change your consent afterwards.',
    'focus_keyword' => 'techplay cookies consent',
    'content' => <<<'HTML'
<p>Three categories, and only one of them is on before you choose.</p>

<table>
<thead><tr><th>Category</th><th>Default</th><th>What it is</th></tr></thead>
<tbody>
<tr><td><strong>Necessary</strong></td><td>on</td><td>Signing in, your session, remembering this choice. The site cannot work without them.</td></tr>
<tr><td><strong>Analytics</strong></td><td><strong>off</strong></td><td>Which pages get read, roughly where readers are, whether something is broken.</td></tr>
<tr><td><strong>Marketing</strong></td><td><strong>off</strong></td><td>Advertising measurement.</td></tr>
</tbody>
</table>

<h2>Off means off</h2>
<p>Until you accept, analytics and advertising storage are denied at the source rather than collected and discarded later. Declining is a real outcome, not a slower path to the same one.</p>

<h2>Changing your mind</h2>
<p>The choice is stored in your browser. Clearing site data brings the banner back; the <a href="https://techplay.gg/cookies">cookie policy</a> has the detail on each one.</p>

<h2>What we can see either way</h2>
<p>Our own server records the requests it answers — address, page, browser string — which is how any web server works and how the site is defended from scrapers. That is separate from analytics and is not what the banner governs.</p>

<h2>Advertising</h2>
<p>The site carries ads. They load on techplay.gg only, and never on this help centre.</p>
HTML,
];

$answers[] = [
    'topic' => 'privacy-and-your-data',
    'slug' => 'get-a-copy-of-your-data',
    'sort_order' => 3,
    'title' => 'Get a copy of your data',
    'excerpt' => 'There is no export button yet. Ask us and we will put it together — but ask before you delete the account.',
    'seo_description' => 'How to request a copy of your TechPlay data, what it contains, and why to ask before deleting your account.',
    'focus_keyword' => 'techplay data export',
    'content' => <<<'HTML'
<p>You are entitled to a copy of what we hold about you, and we will send it. There is no button for it yet, so it goes through a person.</p>

<h2>How to ask</h2>
<p><a href="https://techplay.gg/contact?from=help&amp;article=get-a-copy-of-your-data">Write to us from the address on the account</a> and say you want a copy of your data. Asking from the account's own address is what tells us it is you.</p>

<h2>What you get</h2>
<ul>
<li>Your account details, and what your settings are set to</li>
<li>Your library — every game, status, hours and note</li>
<li>Your lists, reviews and journal entries</li>
<li>Your forum threads and comments</li>
<li>XP, Bounty, achievements and the ledger behind them</li>
<li>Which platforms you have linked (never the tokens themselves)</li>
</ul>

<h2>Ask before you delete</h2>
<p>This matters. Deleting the account empties the row in place — after that there is nothing left to send you, and no way to reconstruct it. If you want both, ask for the copy first and delete once it has arrived.</p>

<h2>Corrections</h2>
<p>Most things you can fix yourself in Settings. For anything you cannot — the email address, or something in a record you cannot reach — the same address works.</p>
HTML,
];

foreach ($answers as $answer) {
    HelpArticle::updateOrCreate(
        ['slug' => $answer['slug']],
        [
            'help_category_id' => $made[$answer['topic']]->id,
            'title' => $answer['title'],
            'excerpt' => $answer['excerpt'],
            'content' => $answer['content'],
            'sort_order' => $answer['sort_order'],
            'seo_description' => $answer['seo_description'],
            'focus_keyword' => $answer['focus_keyword'],
            'status' => 'draft',
            'published_at' => null,
        ]
    );
}

echo '  teme:     '.HelpCategory::count().PHP_EOL;
echo '  odgovori: '.HelpArticle::count().' ('.HelpArticle::where('status', 'draft')->count().' nacrta, '.HelpArticle::where('status', 'published')->count().' objavljeno)'.PHP_EOL;
