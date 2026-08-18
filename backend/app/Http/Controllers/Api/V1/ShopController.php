<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Services\CacheService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ShopController extends Controller
{
    public function index()
    {
        $page = request()->input('page', 1);
        $cacheKey = "shop.products.page_{$page}";

        return Cache::remember($cacheKey, CacheService::TTL_LONG, function () {
            return Product::where('is_active', true)
                ->orderBy('created_at', 'desc')
                ->paginate(12);
        });
    }

    public function show($slug)
    {
        $cacheKey = "shop.product.{$slug}";

        return Cache::remember($cacheKey, CacheService::TTL_LONG, function () use ($slug) {
            return Product::where('slug', $slug)
                ->where('is_active', true)
                ->firstOrFail();
        });
    }

    public function storeOrder(Request $request)
    {
        $request->validate([
            'items' => 'required|array|min:1|max:50',
            'items.*.product_id' => 'required|exists:products,id',
            // Bounded: the quantity was open-ended, so a single request could
            // ask for a number large enough to be a nuisance on its own.
            'items.*.quantity' => 'required|integer|min:1|max:100',
            'shipping_address' => 'required|string',
            'payment_method' => 'required|string|in:cod',
        ]);

        try {
            DB::beginTransaction();

            $totalPrice = 0;
            $orderItemsData = [];

            // Calculate total and prepare items
            foreach ($request->items as $item) {
                $product = Product::findOrFail($item['product_id']);

                $price = $product->price * $item['quantity'];
                $totalPrice += $price;

                $orderItemsData[] = [
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'price' => $product->price,
                ];

                // The decrement is the stock check, not a separate step before
                // it. Reading the stock and then deducting let two orders for
                // the last unit both pass and drove the column negative — the
                // shop's version of the reward-redemption race.
                $taken = Product::whereKey($product->id)
                    ->where('stock', '>=', $item['quantity'])
                    ->decrement('stock', $item['quantity']);

                if ($taken === 0) {
                    throw new \Exception("Insufficient stock for {$product->name}");
                }
            }

            // Create Order
            $order = Order::create([
                'user_id' => Auth::id(),
                'status' => 'pending',
                'total_price' => $totalPrice,
                'payment_method' => 'cod',
                'shipping_address' => $request->shipping_address,
                'notes' => $request->notes ?? null,
            ]);

            // Create Order Items
            foreach ($orderItemsData as $data) {
                $order->items()->create($data);
            }

            DB::commit();

            return response()->json(['message' => 'Order placed successfully', 'order_id' => $order->id], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            // This one is worse than the others: a failed order is a place a
            // buyer will deliberately poke at, and the message carried whatever
            // the driver or a payment call said.
            Log::error('Order failed', ['user' => Auth::id(), 'exception' => $e]);

            return response()->json(['message' => 'We could not place that order. Nothing was charged — please try again.'], 400);
        }
    }
}
