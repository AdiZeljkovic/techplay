<?php

/**
 * The third and last set: the forum, the social hub, the tools, the shop and
 * supporting the site.
 *
 * Two of these are written ahead of the code, on the owner's instruction, and
 * that is worth saying loudly because it is the one thing in the help centre
 * that is not verifiable against the repository today:
 *
 *   - The **shop** pages describe Printful fulfilment and payment by PayPal,
 *     Wise and card. None of the three is integrated: the codebase contains no
 *     Printful, no Wise and no card processor, only PayPal, and PayPal is in
 *     sandbox with no products and no orders.
 *
 *   - The **supporter** pages describe three tiers that are live on
 *     techplay.gg/support with prices and perks — and none of them carries a
 *     PayPal plan id, so nobody can subscribe to one today.
 *
 * Both stay drafts until the feature behind them works. A help page that
 * confidently explains a purchase which then fails is worse than no page, and
 * it is the paying reader who finds out.
 *
 * Everything else here was read out of the code as before.
 */

use App\Models\HelpArticle;
use App\Models\HelpCategory;

$topics = [
    'account-and-sign-in' => ['sort_order' => 1],
    'connected-accounts' => ['sort_order' => 2],
    'your-profile' => ['sort_order' => 3],
    'xp-and-levels' => ['sort_order' => 4],
    'forum-and-community' => [
        'name' => 'Forum & community',
        'description' => 'Threads, reputation, accepted solutions, and talking to people directly.',
        'icon' => 'heroicon-o-chat-bubble-left-ellipsis',
        'sort_order' => 5,
    ],
    'discord' => ['sort_order' => 6],
    'games-and-the-catalogue' => ['sort_order' => 7],
    'tools-and-lists' => [
        'name' => 'Tools & lists',
        'description' => 'The WoW Analyzer, the Backlog Advisor, and lists you can publish.',
        'icon' => 'heroicon-o-wrench-screwdriver',
        'sort_order' => 8,
    ],
    'giveaways' => ['sort_order' => 9],
    'shop-and-supporting-us' => [
        'name' => 'Shop & supporting us',
        'description' => 'Merchandise, and the tiers that keep the site independent.',
        'icon' => 'heroicon-o-shopping-bag',
        'sort_order' => 10,
    ],
    'email-and-notifications' => ['sort_order' => 11],
    'privacy-and-your-data' => ['sort_order' => 12],
];

$made = [];

foreach ($topics as $slug => $attributes) {
    $existing = HelpCategory::where('slug', $slug)->first();

    $made[$slug] = $existing
        ? tap($existing)->update(['sort_order' => $attributes['sort_order']])
        : HelpCategory::create($attributes + ['slug' => $slug, 'is_published' => true]);
}

$answers = [];

// -------------------------------------------------- forum & community

$answers[] = [
    'topic' => 'forum-and-community',
    'slug' => 'how-the-forum-works',
    'sort_order' => 1,
    'title' => 'How the forum works',
    'excerpt' => 'Threads, replies, upvotes and reactions — and a poll if the thread wants one.',
    'seo_description' => 'Starting a thread on TechPlay, replying, upvotes versus reactions, adding a poll and posting screenshots.',
    'focus_keyword' => 'techplay forum',
    'content' => <<<'HTML'
<p>The <a href="https://techplay.gg/forum">forum</a> is organised into boards. Pick one, read what is there, or start a thread of your own.</p>

<h2>Upvotes and reactions are different things</h2>
<p><strong>Upvotes go on threads</strong> — they say "this was worth starting", and they are what builds the author's reputation. <strong>Reactions go on individual replies</strong>, so you can say something about one answer without endorsing the whole thread.</p>

<h2>Polls</h2>
<p>One per thread, added by whoever started it or by staff. A thread is a conversation and a poll is a snapshot of it; two polls in one thread would just be two conversations pretending to be one.</p>

<h2>Screenshots</h2>
<p>Attach them to a post as you write. There is a limit of ten uploads a minute — generous for writing one post, mean for a script filling our disk.</p>

<h2>Watching a thread</h2>
<p>Watch it and you get a notification when somebody replies, whether or not you posted in it. It appears on the site regardless; whether it also reaches your inbox depends on the <strong>Email me</strong> switch in <a href="https://techplay.gg/settings?section=notifications">Settings → Notifications</a>.</p>

<h2>Editing and deleting</h2>
<p>You can edit or delete your own posts. Deleting the first post of a thread does not delete the thread — replies to it belong to the people who wrote them.</p>

<h2>What the forum earns you</h2>
<p>Starting a thread is 15 XP, a reply is 20, and both count toward the 100 XP daily cap. Reputation and Bounty work differently — see <a href="/forum-and-community/reputation-and-accepted-solutions">reputation and accepted solutions</a>.</p>
HTML,
];

$answers[] = [
    'topic' => 'forum-and-community',
    'slug' => 'reputation-and-accepted-solutions',
    'sort_order' => 2,
    'title' => 'Reputation and accepted solutions',
    'excerpt' => 'A third number, next to XP and Bounty. It only measures whether other people found you useful.',
    'seo_description' => 'How forum reputation is earned on TechPlay, what marking an answer as the solution pays, and why it only pays once.',
    'focus_keyword' => 'techplay forum reputation',
    'content' => <<<'HTML'
<p>Reputation is the forum's own score, separate from XP and from Bounty. It measures one thing: whether people found what you wrote useful.</p>

<h2>How it is earned</h2>
<table>
<thead><tr><th>What happened</th><th>Reputation</th></tr></thead>
<tbody>
<tr><td>Somebody upvotes a thread you started</td><td>+1</td></tr>
<tr><td>Your reply is marked as the solution</td><td>+10</td></tr>
</tbody>
</table>
<p>Upvoting your own thread pays nothing. It has to, or the number would measure enthusiasm for yourself.</p>

<h2>Marking a solution</h2>
<p>Whoever started a thread can mark one reply as the answer. It moves to the top and the thread reads as resolved for the next person with the same problem — which is the whole point of a forum outliving its conversation.</p>

<h2>It pays once, and un-marking refunds nothing</h2>
<p>An accepted solution pays <strong>10 reputation and 25 Bounty</strong>, once per post, ever. Marking and un-marking repeatedly pays nothing further.</p>
<p>That is not distrust, it is arithmetic: the toggle used to pay on every mark, which made it a button that printed Bounty. And no refund on un-marking, because the alternative is a thread author who can take back somebody's reward after the fact.</p>

<h2>Marking your own reply</h2>
<p>Allowed — sometimes you solve it yourself and writing down how is worth more than leaving the thread open. It pays nothing, for the same reason self-upvotes do not.</p>

<h2>Where it shows</h2>
<p>On your profile, and on the <a href="https://techplay.gg/leaderboard">leaderboard</a>, which can be sorted by reputation instead of XP. Several achievements are counted from it, from 100 up to 5,000.</p>
HTML,
];

$answers[] = [
    'topic' => 'forum-and-community',
    'slug' => 'what-gets-a-post-removed',
    'sort_order' => 3,
    'title' => 'What gets a post removed',
    'excerpt' => 'Seven rules, and one habit worth more than all of them: report it instead of replying to it.',
    'seo_description' => 'TechPlay forum rules, how moderation works, what sanctions look like, and how to appeal one.',
    'focus_keyword' => 'techplay forum rules',
    'content' => <<<'HTML'
<p>The <a href="https://techplay.gg/forum/rules">full rules</a> are on the forum. In short:</p>

<ul>
<li><strong>Be respectful.</strong> Disagree with the argument.</li>
<li><strong>No hate speech or harassment.</strong> No warning for this one.</li>
<li><strong>Keep it relevant.</strong> Post in the board the topic belongs to.</li>
<li><strong>No spam or self-promotion.</strong> Your own work is welcome where it is part of a conversation, not where it is the conversation.</li>
<li><strong>Safe content.</strong> Nothing explicit, nothing that needs a warning label.</li>
<li><strong>No piracy or illegal activity.</strong> Including links and instructions.</li>
<li><strong>No doxxing.</strong> Somebody else's private information is not yours to post.</li>
</ul>

<h2>Report rather than reply</h2>
<p>This is the part worth internalising. Replying to a rule-breaking post gives the thread exactly the argument it was looking for, and it puts you in the middle of something you were trying to stop. Use <strong>Report</strong>. Moderators read every one.</p>

<h2>What happens then</h2>
<p>A moderator's reading of a rule is the one that stands. Sanctions run from a warning to a permanent ban, scaled to what was done and how often. Most first offences are a warning and a removed post.</p>

<h2>If you think a decision was wrong</h2>
<p><a href="https://techplay.gg/contact?from=help&amp;article=what-gets-a-post-removed">Write to us</a> rather than arguing it in the thread. Say which post and what you think was misread. A decision made in a hurry can be reversed; the same decision argued about in public rarely is.</p>

<h2>Being banned</h2>
<p>A ban stops you posting. It does not delete your account, your library or anything you wrote before it — and it does not stop you reading.</p>
HTML,
];

$answers[] = [
    'topic' => 'forum-and-community',
    'slug' => 'friends-messages-and-the-social-hub',
    'sort_order' => 4,
    'title' => 'Friends, messages and the Social Hub',
    'excerpt' => 'One place for both. /friends and /messages are old addresses that now point at it.',
    'seo_description' => 'How friend requests, direct messages and group chats work on TechPlay, and what friendship unlocks.',
    'focus_keyword' => 'techplay messages friends',
    'content' => <<<'HTML'
<p>Everything social lives at <a href="https://techplay.gg/social">Social Hub</a>. If you have <code>/friends</code> or <code>/messages</code> bookmarked, both now land there — they were two screens doing one job.</p>

<h2>Friends</h2>
<p>Send a request from someone's profile; they accept or decline. You can also block, which stops contact both ways.</p>
<p>Friendship is not just a label — a profile set to <strong>friends only</strong> opens for accepted friends and for nobody else. It is the switch behind that setting.</p>

<h2>Direct and group conversations</h2>
<p>The same system does both. Start a conversation with one person, or add more people to it later and it becomes a group. Anyone in a group can leave; leaving does not delete it for the others.</p>

<h2>Messages arrive live</h2>
<p>No refreshing. A message appears as it is sent, and you can react to one rather than replying — useful when the only honest answer is a thumbs up.</p>

<h2>Deleting a message</h2>
<p>You can delete your own. It goes for everybody in the conversation, not just your copy of it.</p>

<h2>What friends can see</h2>
<p>A friend's profile as they have set it, and the friend activity feed — what people you have added have been playing and finishing. Nothing about your library reaches anybody whose request you have not accepted.</p>
HTML,
];

// ------------------------------------------------------- tools & lists

$answers[] = [
    'topic' => 'tools-and-lists',
    'slug' => 'the-wow-analyzer',
    'sort_order' => 1,
    'title' => 'The WoW Analyzer',
    'excerpt' => 'Reads a World of Warcraft character and scores how ready it is, with the gaps named rather than implied.',
    'seo_description' => 'How the TechPlay WoW Analyzer works, what it reads, what the score means, and why it can disagree with itself.',
    'focus_keyword' => 'techplay wow analyzer',
    'content' => <<<'HTML'
<p>Give <a href="https://techplay.gg/wow-analyzer">the analyzer</a> a region, a realm and a character name. It reads the character and comes back with a readiness score, what is missing, and what to do about it first.</p>

<h2>Where the data comes from</h2>
<p>Blizzard's own API for gear, and Raider.IO for Mythic+ rating and raid progress. Nothing is typed in and nothing is remembered from a previous run — each analysis reads the character as it is right now.</p>

<h2>What it actually is</h2>
<p>The gear and progress are facts. The <strong>advice is written by a language model</strong> reading those facts, which is worth knowing before you follow it: it is good at spotting the obvious gap you have stopped seeing, and it is capable of being confidently wrong about a niche build. Treat it as a second opinion, not an audit.</p>

<h2>Why two runs can disagree</h2>
<p>Blizzard's API lags behind the game — a piece equipped ten minutes ago may not be there yet. And the advice is regenerated each time rather than looked up, so the wording moves even when the numbers do not.</p>

<h2>Sharing a result</h2>
<p>Every analysis gets its own address you can share, and there is a leaderboard of recent ones. Nothing is published unless you share it.</p>

<h2>If it cannot find your character</h2>
<p>Check the realm, and check the region — a name that exists on one realm usually exists on several. Characters below the level Blizzard reports on, and characters not logged in for a long time, may not come back at all.</p>

<h2>Battle.net</h2>
<p>Linking Battle.net in <a href="https://techplay.gg/settings?section=connections">Settings → Connections</a> saves your characters so you do not retype them. It is not required to run an analysis.</p>
HTML,
];

$answers[] = [
    'topic' => 'tools-and-lists',
    'slug' => 'the-backlog-advisor',
    'sort_order' => 2,
    'title' => 'The Backlog Advisor',
    'excerpt' => 'Three things to play next, out of what you already own. Scored, not invented.',
    'seo_description' => 'How the TechPlay Backlog Advisor picks games from your library, what the match percentage means, and why it is not AI.',
    'focus_keyword' => 'techplay backlog advisor',
    'content' => <<<'HTML'
<p><a href="https://techplay.gg/backlog-advisor">The advisor</a> looks at the games sitting in your backlog and picks the ones you are most likely to actually start. You can also ask for it in Discord with <code>/backlog</code>.</p>

<h2>It is scored, not generated</h2>
<p>Worth saying plainly, because "recommendation" usually means a language model these days. This one is arithmetic: every candidate earns points against a fixed set of weights that add up to 100, and the <strong>match percentage is a real percentage of a real total</strong> rather than a number a model felt like emitting. The same library on the same day gives the same answer.</p>

<h2>What it reads</h2>
<p>Your library and what you have done with it — what you have finished, what you dropped, what you rated and how, how big the backlog is, and what you tend to like. Games below a minimum score are left out entirely rather than padded in to make three.</p>

<h2>It only suggests things you own</h2>
<p>Nothing on your wishlist, nothing to buy. The whole point is the pile you already paid for.</p>

<h2>If it has nothing to say</h2>
<p>Your backlog is probably empty. Games arrive there from a platform import, or by setting a game's status to <strong>Backlog</strong> yourself — see <a href="/connected-accounts/library-statuses-explained">what the library statuses mean</a>.</p>

<h2>If the suggestions are wrong</h2>
<p>Rate a few more games. Scores you have given are the strongest signal it has, and a library it knows only the shape of is a library it can only guess at.</p>
HTML,
];

$answers[] = [
    'topic' => 'tools-and-lists',
    'slug' => 'make-and-share-a-game-list',
    'sort_order' => 3,
    'title' => 'Make and share a game list',
    'excerpt' => 'Any set of games, in your order, with your reasons. Public or not, and you decide about comments.',
    'seo_description' => 'Creating a game list on TechPlay, ordering it, publishing it, and controlling likes and comments.',
    'focus_keyword' => 'techplay game lists',
    'content' => <<<'HTML'
<p>A list is any set of games you want to put together — a top ten, everything you finished this year, the best games nobody played. Make one from <a href="https://techplay.gg/lists">Lists</a>.</p>

<h2>Yours to arrange</h2>
<p>Add games, drag them into the order you want, and write a line about each one. The order is the argument; a list nobody ordered is a search result.</p>

<h2>Draft, then public</h2>
<p>A list starts as a draft that only you can see. Publishing it puts it on your profile and on the public lists page. You can unpublish it again at any time, and going back to draft takes it out of public view immediately.</p>

<h2>Cover image</h2>
<p>Upload one. It is what the list looks like everywhere it appears, and a list without one is a list people scroll past.</p>

<h2>Likes and comments</h2>
<p>Anybody can like a published list. Comments are per-list — you decide whether yours takes them, and you can delete a comment on your own list.</p>

<h2>Making a private list public later</h2>
<p>Fine, and common. Nothing is announced when you publish, so a list you have been building for a month does not arrive as a month of notifications.</p>

<h2>Tags</h2>
<p>Lists can be browsed by tag, which is how somebody finds yours without knowing you exist. It is the difference between a list on your profile and a list in the site.</p>
HTML,
];

// ------------------------------------------ games: release reminders

$answers[] = [
    'topic' => 'games-and-the-catalogue',
    'slug' => 'release-reminders-and-the-calendar',
    'sort_order' => 3,
    'title' => 'Release reminders and the calendar',
    'excerpt' => 'Wishlist a game and we tell you the day it lands. The calendar is the same data without the account.',
    'seo_description' => 'How TechPlay release reminders work, when they arrive, and why a date can move without warning.',
    'focus_keyword' => 'techplay release reminder',
    'content' => <<<'HTML'
<p>Two ways to keep track of what is coming.</p>

<h2>The calendar</h2>
<p><a href="https://techplay.gg/calendar">The release calendar</a> is everything with a date ahead of it, for everyone, no account needed.</p>

<h2>Reminders</h2>
<p>Set a game's status to <strong>Wishlist</strong> and you get a notification <strong>on the day it releases</strong>. There is nothing else to switch on — the wishlist is the subscription.</p>
<p>You may also hear when a wishlisted game is close, and when we review one. All three appear on the site; whether they reach your inbox depends on the <strong>Email me</strong> switch in <a href="https://techplay.gg/settings?section=notifications">Settings → Notifications</a>.</p>

<h2>Why a date moves, or is simply wrong</h2>
<p>Dates come from the shops rather than from us, and they are the least reliable thing in the catalogue — delays, region differences and placeholder dates all arrive as facts. If a date looks impossible it probably is, and it is worth <a href="/games-and-the-catalogue/a-game-is-missing-or-its-details-are-wrong">telling us</a>.</p>
<p>A game whose date moved forward keeps its reminder and fires on the new day. One whose date was wrong to begin with may fire on a day nothing happens; that is the catalogue's fault, not a bug in the reminder.</p>

<h2>No reminder arrived</h2>
<p>Check the game still has a date at all — a release pushed to "TBA" has no day to fire on. Games already released when you wishlisted them never had one either.</p>
HTML,
];

// ------------------------------------------------- shop & supporting us

$answers[] = [
    'topic' => 'shop-and-supporting-us',
    'slug' => 'ordering-from-the-shop',
    'sort_order' => 1,
    'title' => 'Ordering from the shop',
    'excerpt' => 'Merchandise printed to order. Pick a size before you pay — print-on-demand has no stock to exchange from.',
    'seo_description' => 'How to order TechPlay merchandise, how print-on-demand works, and what happens after you pay.',
    'focus_keyword' => 'techplay shop order',
    'content' => <<<'HTML'
<p>Pick what you want in <a href="https://techplay.gg/shop">the shop</a>, choose a size and colour, and check out. You do not need an account to order, but having one means you can look the order up later.</p>

<h2>Printed to order</h2>
<p>Nothing sits in a box waiting for you. Each item is printed and shipped by our production partner when you order it, which has two consequences worth knowing before you buy:</p>
<ul>
<li><strong>It takes a few days longer</strong> than something picked off a shelf — printing happens first, then shipping.</li>
<li><strong>Size matters more than usual.</strong> There is no stock to swap from, so a wrong size means printing a second item rather than exchanging the first. Check the size guide on the product page.</li>
</ul>

<h2>After you pay</h2>
<p>You get a confirmation by email, then a second message with tracking once the item is printed and handed over. If the first arrives and the second does not within a week, <a href="https://techplay.gg/contact?from=help&amp;article=ordering-from-the-shop">tell us the order number</a>.</p>

<h2>Changing an order</h2>
<p>Only before it goes to print, which is usually a matter of hours. Write to us straight away and include the order number — once it is printing, it cannot be stopped.</p>

<h2>Buying more than one thing</h2>
<p>One order, one payment, one shipment where possible. Items printed in different places may arrive separately at no extra cost to you.</p>
HTML,
];

$answers[] = [
    'topic' => 'shop-and-supporting-us',
    'slug' => 'how-you-can-pay',
    'sort_order' => 2,
    'title' => 'How you can pay',
    'excerpt' => 'PayPal, a card, or Wise. Your card details never touch our servers.',
    'seo_description' => 'Payment methods in the TechPlay shop — PayPal, card and Wise — and what happens to your card details.',
    'focus_keyword' => 'techplay shop payment methods',
    'content' => <<<'HTML'
<p>Three ways, and you choose at checkout.</p>

<table>
<thead><tr><th>Method</th><th>Worth knowing</th></tr></thead>
<tbody>
<tr><td><strong>PayPal</strong></td><td>Sign in to PayPal and approve. Nothing to type here.</td></tr>
<tr><td><strong>Card</strong></td><td>Handled through PayPal's card checkout — you do not need a PayPal account to use it.</td></tr>
<tr><td><strong>Wise</strong></td><td>Useful if you are paying from a currency that PayPal converts badly. Slower, because it is a transfer rather than an instant approval.</td></tr>
</tbody>
</table>

<h2>We never see your card</h2>
<p>Card details are typed on the payment provider's page, not on ours, and they never reach our servers. What we are told is that a payment succeeded and which order it belongs to. There is nothing here for anyone to steal because there is nothing here.</p>

<h2>Currency</h2>
<p>Prices are shown in one currency and your bank may convert. What you are charged can differ by a little from the price shown, and that difference is your bank's, not ours.</p>

<h2>A payment that failed</h2>
<p>No order is created and nothing is printed. If your bank shows a pending charge for a failed payment it will fall off on its own, usually within a few days — that is an authorisation, not a payment.</p>

<h2>A payment that succeeded but no confirmation</h2>
<p>Wait ten minutes, then <a href="https://techplay.gg/contact?from=help&amp;article=how-you-can-pay">write to us</a> with the payment reference from PayPal or Wise. That reference is what lets us find it.</p>
HTML,
];

$answers[] = [
    'topic' => 'shop-and-supporting-us',
    'slug' => 'shipping-and-delivery',
    'sort_order' => 3,
    'title' => 'Shipping and delivery',
    'excerpt' => 'Printed first, then posted. Customs is the part nobody warns you about, so here it is.',
    'seo_description' => 'TechPlay shop delivery times, tracking, international shipping and customs charges.',
    'focus_keyword' => 'techplay shop shipping',
    'content' => <<<'HTML'
<h2>Two stages, not one</h2>
<p>An order is printed first and posted second, so the clock people expect from a normal shop does not apply. Printing takes a few working days; delivery then takes as long as post to your country takes.</p>

<h2>Tracking</h2>
<p>You get a tracking link when the parcel is handed to the carrier, not when you order. A tracking number that shows nothing for a day or two is normal — carriers scan at the first depot, not at collection.</p>

<h2>Where we ship</h2>
<p>Most of the world, because the printing happens in several places and your order is made at whichever is closest to you. That is also why two items on one order can arrive separately.</p>

<h2>Customs and import charges</h2>
<p>Said plainly because it is the thing that surprises people. If your parcel crosses a customs border, your country may charge import duty or VAT on delivery. <strong>That charge is not ours, we do not receive it, and we cannot predict it</strong> — it is set by your country and collected by the carrier.</p>
<p>We do not undervalue parcels or mark them as gifts. It is fraud, and it is the buyer rather than us who carries the consequence.</p>

<h2>A parcel that has not arrived</h2>
<p>Check the tracking first, then check with your neighbours and your local depot — most "lost" parcels are one of those two. If tracking has genuinely stopped moving for a week, <a href="https://techplay.gg/contact?from=help&amp;article=shipping-and-delivery">tell us the order number</a> and we will chase it.</p>

<h2>A wrong address</h2>
<p>Fixable before printing, not after. Write to us the moment you notice.</p>
HTML,
];

$answers[] = [
    'topic' => 'shop-and-supporting-us',
    'slug' => 'returns-and-problems-with-an-order',
    'sort_order' => 4,
    'title' => 'Returns and problems with an order',
    'excerpt' => 'A fault or a wrong item is replaced free. Changing your mind about a printed item is the harder case, and we say why.',
    'seo_description' => 'TechPlay shop returns: damaged and wrong items, what a photo needs to show, and where print-on-demand limits a change of mind.',
    'focus_keyword' => 'techplay shop returns',
    'content' => <<<'HTML'
<h2>Damaged, faulty or not what you ordered</h2>
<p>Our problem, and we replace it. <a href="https://techplay.gg/contact?from=help&amp;article=returns-and-problems-with-an-order">Write to us within 30 days</a> with:</p>
<ul>
<li>the order number</li>
<li>a photo of the item showing the fault</li>
<li>a photo of the printed label on the parcel or garment</li>
</ul>
<p>The label photo is the one people forget and the one that matters — it identifies which print run the item came from, which is what gets it replaced without an argument.</p>
<p>You usually do not need to send the item back.</p>

<h2>Wrong size</h2>
<p>Harder, and here is the honest reason. Every item is printed for your order, so there is no stock to exchange from — a swap means printing a second item and writing off the first. We will always look at it, but we cannot promise a free exchange the way a shop with a warehouse can. The size guide on each product page is worth the thirty seconds.</p>

<h2>Changing your mind</h2>
<p>Before it goes to print, easy — tell us and we cancel and refund. After printing, a made-to-order item is not something we can return to a shelf.</p>
<p>If you are in a country whose law gives you a cancellation right on distance sales, that right applies and overrides everything in this section. Say so and we will honour it.</p>

<h2>Refunds</h2>
<p>Back to the way you paid, and only that way. How long it then takes is your bank's or PayPal's business rather than ours — usually a few days, sometimes longer for a card.</p>

<h2>Nothing arrived at all</h2>
<p>That is <a href="/shop-and-supporting-us/shipping-and-delivery">shipping and delivery</a>, not a return.</p>
HTML,
];

$answers[] = [
    'topic' => 'shop-and-supporting-us',
    'slug' => 'what-supporting-techplay-gives-you',
    'sort_order' => 5,
    'title' => 'What supporting TechPlay gives you',
    'excerpt' => 'Three tiers. The honest answer to "what do I get" is: an ad-free site and a say — and a site that stays independent.',
    'seo_description' => 'The three TechPlay supporter tiers, what each one includes, and what supporting actually pays for.',
    'focus_keyword' => 'support techplay tiers',
    'content' => <<<'HTML'
<p>TechPlay has no publisher behind it. <a href="https://techplay.gg/support">Supporting the site</a> is what keeps the reviews answerable to readers rather than to whoever is buying the ads.</p>

<h2>The three tiers</h2>
<table>
<thead><tr><th>Tier</th><th>Monthly</th><th>What it includes</th></tr></thead>
<tbody>
<tr><td><strong>TechPlay Fan</strong></td><td>$4.99</td><td>Ad-free browsing, supporter badge, the supporter forum</td></tr>
<tr><td><strong>Super Fan</strong></td><td>$9.99</td><td>Everything above, early access to videos, a monthly newsletter, a vote on what we review next</td></tr>
<tr><td><strong>TechPlay Legend</strong></td><td>$19.99</td><td>Everything above, your name in video credits, merchandise discounts, direct chat with the editors, the Legendary badge</td></tr>
</tbody>
</table>

<h2>Ad-free is the real one</h2>
<p>Of everything on that list, the ad-free site is the thing you will notice every day. The rest is nice; that is the part that changes how the site feels.</p>

<h2>What it does not buy</h2>
<p>Not a better score for a game you like, not a review of something because you asked, and not moderation on your side of an argument. The vote in the Super Fan tier is a vote on <em>what</em> we look at next, never on what we conclude. A publication that sells its conclusions has nothing left to sell.</p>

<h2>Supporting without a subscription</h2>
<p>Buying something from <a href="https://techplay.gg/shop">the shop</a> helps too, and so does turning off your ad blocker on techplay.gg. Neither is worse than a subscription; they are just quieter.</p>

<h2>Changing or stopping</h2>
<p>See <a href="/shop-and-supporting-us/change-or-cancel-your-support">change or cancel your support</a>. It takes about a minute and we do not make you ask a person.</p>
HTML,
];

$answers[] = [
    'topic' => 'shop-and-supporting-us',
    'slug' => 'change-or-cancel-your-support',
    'sort_order' => 6,
    'title' => 'Change or cancel your support',
    'excerpt' => 'From your PayPal account, in about a minute. You keep what you paid for until the period ends.',
    'seo_description' => 'How to cancel or change a TechPlay supporter subscription, when access ends, and what happens to your badge.',
    'focus_keyword' => 'cancel techplay support',
    'content' => <<<'HTML'
<p>A supporter subscription is a recurring payment held in your PayPal account, which means you can stop it yourself without asking us — and you should be able to. A subscription you have to email someone to escape is a subscription designed to be hard to leave.</p>

<h2>Cancelling</h2>
<p>In PayPal: <strong>Settings → Payments → Automatic payments</strong>, find TechPlay, and cancel. It stops immediately and there is nothing to do on our side.</p>

<h2>You keep it until the period ends</h2>
<p>Cancelling stops the next payment; it does not cut short the month you have already paid for. Ad-free browsing and everything else stay until that period runs out.</p>

<h2>Changing tier</h2>
<p>Cancel the one you have and start the one you want. Timing matters a little: starting the new one before the old one has lapsed means paying twice for the overlap, so it is usually cleaner to wait for the period to end.</p>

<h2>Your badge</h2>
<p>A supporter badge stays visible while the support is active and comes off when the period ends. Anything you unlocked with Bounty is yours permanently and is not affected.</p>

<h2>A payment you did not expect</h2>
<p>Check the date against when you first subscribed — a subscription renews on the same day each month, which can land oddly after a short month. If it is genuinely wrong, <a href="https://techplay.gg/contact?from=help&amp;article=change-or-cancel-your-support">tell us with the PayPal transaction id</a> and we will refund it. We would rather return a payment than keep one somebody did not mean to make.</p>
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
