<?php

namespace App\Observers;

use App\Events\ProductStockUpdated;
use App\Models\Product;

class ProductObserver
{
    /**
     * Handle the Product "updated" event.
     */
    public function updated(Product $product): void
    {
        // Broadcast stock changes
        if ($product->isDirty('stock')) {
            broadcast(new ProductStockUpdated($product))->toOthers();
        }
    }
}
