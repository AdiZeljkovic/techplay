<?php

namespace App\Observers;

use App\Events\ProductStockUpdated;
use App\Models\Product;
use Illuminate\Support\Facades\Cache;

class ProductObserver
{
    /**
     * Handle the Product "created" event.
     */
    public function created(Product $product): void
    {
        $this->invalidateCache($product);
    }

    /**
     * Handle the Product "updated" event.
     */
    public function updated(Product $product): void
    {
        // Broadcast stock changes
        if ($product->isDirty('stock')) {
            broadcast(new ProductStockUpdated($product))->toOthers();
        }

        $this->invalidateCache($product);
    }

    /**
     * Handle the Product "deleted" event.
     */
    public function deleted(Product $product): void
    {
        $this->invalidateCache($product);
    }

    /**
     * Invalidate shop cache when product changes
     */
    protected function invalidateCache(Product $product): void
    {
        // Clear specific product cache
        Cache::forget("shop.product.{$product->slug}");

        // Clear product listing cache (first 5 pages)
        for ($page = 1; $page <= 5; $page++) {
            Cache::forget("shop.products.page_{$page}");
        }
    }
}
