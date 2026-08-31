<?php

namespace App\Observers;

use App\Models\ConnectedAccount;
use App\Services\QuestService;

/**
 * Linking a platform is the strongest single move a new member can make, and
 * nothing rewarded it.
 *
 * One click on Steam turns an empty shelf into two hundred games with hours
 * already on them — it is what the front page promises in as many words. Two
 * people out of fifty-five have done it, and the progression system could not
 * see it happen: five controller methods checked the `connected_accounts`
 * achievement and not one of them touched a quest.
 *
 * Here rather than in the controllers because there are five ways in — Steam
 * arrives through an OpenID callback, Xbox through a gamertag verification,
 * PlayStation, GOG and Epic each through their own method — and a hook per
 * method is a hook that will be missed by the sixth.
 *
 * `created` only: reconnecting an account that already exists updates the row,
 * and re-linking Steam every morning must not pay again.
 */
class ConnectedAccountObserver
{
    public function created(ConnectedAccount $account): void
    {
        if (! $account->user_id) {
            return;
        }

        try {
            app(QuestService::class)->progress($account->user, 'platform_connected');
        } catch (\Throwable) {
            // Progression must never be the reason a library fails to link.
        }
    }
}
