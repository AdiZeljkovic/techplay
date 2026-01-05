<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ShopController extends Controller
{
    public function index()
    {
        $page = request()->get('page', 1);
        return \Illuminate\Support\Facades\Cache::remember("shop.products.page_{$page}", 1800, function () {
            return Product::where('is_active', true)->orderBy('created_at', 'desc')->paginate(12);
        });
    }

    public function show($slug)
    {
        return \Illuminate\Support\Facades\Cache::remember("shop.product.{$slug}", 1800, function () use ($slug) {
            return Product::where('slug', $slug)->where('is_active', true)->firstOrFail();
        });
    }

    public function storeOrder(Request $request)
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
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

                // Optional: Check stock
                if ($product->stock < $item['quantity']) {
                    throw new \Exception("Insufficient stock for {$product->name}");
                }

                $price = $product->price * $item['quantity'];
                $totalPrice += $price;

                $orderItemsData[] = [
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'price' => $product->price,
                ];

                // Deduct stock
                $product->decrement('stock', $item['quantity']);
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
            return response()->json(['message' => 'Order failed: ' . $e->getMessage()], 400);
        }
    }
}
