<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\PayPalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PayPalController extends Controller
{
    protected PayPalService $paypal;

    public function __construct(PayPalService $paypal)
    {
        $this->paypal = $paypal;
    }

    public function activateSubscription(Request $request)
    {
        $request->validate([
            'subscriptionID' => 'required|string',
        ]);

        $user = $request->user();

        // In a real app, verify subscription status with PayPal API here
        // $details = $this->paypal->getSubscriptionDetails($request->subscriptionID);
        // if ($details['status'] !== 'ACTIVE') ...

        $user->update([
            'paypal_subscription_id' => $request->subscriptionID,
            'subscription_ends_at' => Carbon::now()->addMonth(), // Temporary assumption, should get from Plan/Details
        ]);

        // Optional: Create an Order record for history
        // Order::create([...]);

        return response()->json(['status' => 'success', 'message' => 'Subscription activated.']);
    }

    /**
     * Create a PayPal order for Shop items.
     */
    public function createOrder(Request $request)
    {
        // Flexible validation: allow direct amount OR items
        $request->validate([
            'amount' => 'nullable|numeric|min:0.01',
            'items' => 'nullable|array',
            'shipping_address' => 'nullable|string',
        ]);

        $user = $request->user();
        $total = $request->amount ?? 0;
        $orderItemsData = [];

        // If items provided (Shop flow)
        if ($request->has('items') && is_array($request->items)) {
            $total = 0;
            foreach ($request->items as $item) {
                // Check if Product model exists, otherwise fallback to item['price']
                if (class_exists(\App\Models\Product::class)) {
                    $product = \App\Models\Product::find($item['product_id']);
                    if ($product) {
                        $price = $product->price;
                        $total += $price * $item['quantity'];
                        $orderItemsData[] = [
                            'product_id' => $product->id,
                            'quantity' => $item['quantity'],
                            'price' => $price,
                        ];
                    }
                } else {
                    // Simple fallback if no Product model
                    $price = $item['price'] ?? 0;
                    $total += $price * ($item['quantity'] ?? 1);
                }
            }
        }

        if ($total <= 0) {
            return response()->json(['error' => 'Invalid total amount.'], 400);
        }

        try {
            // Create Order on PayPal
            $response = $this->paypal->createOrder($total, config('paypal.currency', 'EUR'));

            if (isset($response['id']) && $response['status'] != null) {
                // Save pending order to database
                $order = Order::create([
                    'user_id' => $user->id,
                    'status' => 'PENDING',
                    'total_price' => $total,
                    // 'payment_method' => 'paypal',
                    // 'shipping_address' => $request->shipping_address,
                    'paypal_order_id' => $response['id'],
                    'items' => json_encode($orderItemsData), // Store as JSON for now
                ]);

                // If Order has items relation and we have data
                // if (method_exists($order, 'items')) { ... }

                return response()->json([
                    'id' => $response['id'],
                    'links' => $response['links'],
                    'internal_order_id' => $order->id,
                ]);
            }

            Log::error('PayPal Create Order Failed', ['response' => $response]);
            return response()->json(['error' => 'Could not initiate payment.'], 500);

        } catch (\Exception $e) {
            Log::error('Create Order Exception: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Capture payment after user approval.
     */
    public function captureOrder(Request $request)
    {
        $request->validate([
            'orderID' => 'required|string'
        ]);

        $orderId = $request->orderID;

        try {
            $response = $this->paypal->captureOrder($orderId);

            if (isset($response['status']) && $response['status'] === 'COMPLETED') {
                // Update order status in database
                $order = Order::where('paypal_order_id', $orderId)->first();

                if ($order) {
                    $order->update([
                        'status' => 'COMPLETED', // Normalized status
                    ]);
                }

                return response()->json($response);
            }

            return response()->json(['error' => 'Payment capture failed or incomplete.', 'details' => $response], 400);

        } catch (\Exception $e) {
            Log::error('Capture Order Exception: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
