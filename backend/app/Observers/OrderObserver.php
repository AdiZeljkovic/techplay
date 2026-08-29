<?php

namespace App\Observers;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Returns stock when an order is cancelled.
 *
 * Ordering takes units off the shelf straight away, which is right — it is what
 * stops two customers buying the same last item. Nothing put them back, so a
 * cancelled order quietly removed inventory for good and the product went on
 * reading "out of stock" until someone edited the number by hand.
 *
 * Runs on cancellation from anywhere: the admin panel, a console command, or
 * whatever comes later. Putting it in the observer rather than in the Filament
 * action means a future cancellation path cannot forget.
 */
class OrderObserver
{
    public function updated(Order $order): void
    {
        // Refunded counts too: the customer has their money back, so the goods
        // belong on the shelf again.
        if (! $order->wasChanged('status') || ! in_array($order->status, ['cancelled', 'refunded'], true)) {
            return;
        }

        if ($order->stock_restored_at !== null) {
            return; // cancelled → pending → cancelled must not return them twice
        }

        try {
            DB::transaction(function () use ($order) {
                // Claim the restore first. Two people pressing cancel at the
                // same moment would otherwise both pay out the stock.
                $claimed = Order::whereKey($order->id)
                    ->whereNull('stock_restored_at')
                    ->update(['stock_restored_at' => now()]);

                if ($claimed === 0) {
                    return;
                }

                /*
                 * Through the model, so ProductObserver hears about it.
                 *
                 * A query-builder increment writes the row and fires no events,
                 * so the shop's cached product page and the stock broadcast
                 * never learned the units had come back: a cancelled order left
                 * the item reading "out of stock" until the cache expired,
                 * while the database said otherwise.
                 *
                 * `lockForUpdate` because two lines of the same order — or two
                 * orders cancelled at once — would otherwise read the same
                 * starting figure. The claim above stops one order paying out
                 * twice; this stops two from colliding.
                 */
                foreach ($order->items()->get() as $line) {
                    $product = Product::whereKey($line->product_id)->lockForUpdate()->first();

                    if (! $product) {
                        continue;
                    }

                    $product->stock = (int) $product->stock + (int) $line->quantity;
                    $product->save();
                }
            });

            $order->stock_restored_at = now();
        } catch (\Throwable $e) {
            // Never let bookkeeping stop a cancellation from being recorded.
            Log::warning('Could not restore stock for cancelled order', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
