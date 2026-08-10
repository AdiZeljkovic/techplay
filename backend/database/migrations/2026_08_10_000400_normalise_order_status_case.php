<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * One vocabulary for orders.status.
 *
 * The cash-on-delivery path wrote `pending`, and the admin panel's select
 * offers pending / processing / completed / cancelled. The PayPal path wrote
 * PayPal's own words instead — `PENDING`, `COMPLETED` — into the same column.
 *
 * So every PayPal order showed a status the panel does not know: the edit form
 * opened with an empty select, and any filter on status simply did not see
 * them. The code now writes lowercase everywhere; this brings the rows already
 * in the table into line with it.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('orders')->update(['status' => DB::raw('lower(status)')]);

        // Same column, same problem — set by the PayPal webhook.
        if (Schema::hasColumn('orders', 'payment_status')) {
            DB::table('orders')
                ->whereNotNull('payment_status')
                ->update(['payment_status' => DB::raw('lower(payment_status)')]);
        }
    }

    public function down(): void
    {
        // Deliberately not reversed: restoring the mixed casing would only put
        // the inconsistency back.
    }
};
