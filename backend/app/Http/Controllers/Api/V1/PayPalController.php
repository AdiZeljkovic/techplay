<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Services\PayPalService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
        // Every line is validated the same way the cash-on-delivery path
        // validates it. This used to accept `items` as a bare array, so a
        // crafted quantity of 0.01 bought a 100 KM product for one mark.
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1|max:99',
            'shipping_address' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();
        $total = 0;
        $orderItemsData = [];

        foreach ($request->items as $item) {
            $product = Product::find($item['product_id']);
            if (! $product) {
                return response()->json(['error' => 'One of the products is no longer available.'], 422);
            }

            // Stock is checked here as well as at capture: refusing before the
            // buyer reaches PayPal is far kinder than refunding afterwards.
            if ($product->stock < $item['quantity']) {
                return response()->json([
                    'error' => "Only {$product->stock} left of {$product->name}.",
                ], 422);
            }

            $price = (float) $product->price;
            $total += $price * $item['quantity'];
            $orderItemsData[] = [
                'product_id' => $product->id,
                'quantity' => (int) $item['quantity'],
                'price' => $price,
            ];
        }

        if ($total <= 0) {
            return response()->json(['error' => 'Invalid total amount.'], 400);
        }

        try {
            // Prices are quoted in convertible marks, which PayPal does not
            // settle. BAM is pegged to the euro, so the conversion is exact
            // rather than a guess — see config/paypal.php.
            $charge = $this->paypal->toPayableAmount($total);

            $response = $this->paypal->createOrder($charge, config('paypal.currency'));

            if (isset($response['id']) && $response['status'] != null) {
                // Save pending order to database
                $order = Order::create([
                    'user_id' => $user->id,
                    'status' => 'PENDING',
                    'total_price' => $total,
                    'payment_method' => 'paypal',
                    'shipping_address' => $request->shipping_address,
                    'paypal_order_id' => $response['id'],
                ]);

                // Create Order Items
                foreach ($orderItemsData as $data) {
                    $order->items()->create($data);
                }

                return response()->json([
                    'id' => $response['id'],
                    'links' => $response['links'],
                    'internal_order_id' => $order->id,
                ]);
            }

            Log::error('PayPal Create Order Failed', ['response' => $response]);

            return response()->json(['error' => 'Could not initiate payment.'], 500);

        } catch (\Exception $e) {
            Log::error('Create Order Exception: '.$e->getMessage());

            return response()->json(['error' => 'Could not initiate payment.'], 500);
        }
    }

    /**
     * Capture payment after user approval.
     */
    public function captureOrder(Request $request)
    {
        $request->validate([
            'orderID' => 'required|string',
        ]);

        $orderId = $request->orderID;

        try {
            $response = $this->paypal->captureOrder($orderId);

            if (isset($response['status']) && $response['status'] === 'COMPLETED') {
                $order = Order::with('items')->where('paypal_order_id', $orderId)->first();

                if ($order && $order->status !== 'COMPLETED') {
                    \Illuminate\Support\Facades\DB::transaction(function () use ($order, $response) {
                        // Paid goods leave the shelf. The cash-on-delivery path
                        // has always done this; PayPal orders never did, so a
                        // one-off item could be sold repeatedly.
                        foreach ($order->items as $line) {
                            Product::where('id', $line->product_id)
                                ->where('stock', '>=', $line->quantity)
                                ->decrement('stock', $line->quantity);
                        }

                        $order->update([
                            'status' => 'COMPLETED',
                            'paypal_transaction_id' => $response['purchase_units'][0]['payments']['captures'][0]['id'] ?? null,
                        ]);
                    });
                }

                // 'status' carries the PayPal vocabulary the client checks for;
                // it used to answer 'success' here and 'COMPLETED' nowhere, so
                // a captured payment read as a failure and buyers paid twice.
                return response()->json([
                    'status' => 'COMPLETED',
                    'message' => 'Payment completed successfully',
                    'order_id' => $order->id ?? null,
                    'paypal_order_id' => $orderId,
                ]);
            }

            Log::error('PayPal Capture Failed', ['order_id' => $orderId, 'response' => $response]);

            return response()->json(['error' => 'Payment capture failed or incomplete.'], 400);

        } catch (\Exception $e) {
            Log::error('Capture Order Exception: '.$e->getMessage());

            return response()->json(['error' => 'Payment capture failed.'], 500);
        }
    }
}
