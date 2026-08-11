<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\PayPalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PayPalController extends Controller
{
    protected PayPalService $paypal;

    public function __construct(PayPalService $paypal)
    {
        $this->paypal = $paypal;
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
                    // Lowercase, like every other writer of this column. PayPal
                    // orders used to carry PayPal's own vocabulary, so they
                    // showed a status the admin panel's select does not offer
                    // and were missed by every status filter.
                    'status' => 'pending',
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
                // Scoped to the caller: the order id alone used to be enough to
                // drive someone else's capture and stock decrement.
                $order = Order::with('items')
                    ->where('paypal_order_id', $orderId)
                    ->where('user_id', $request->user()->id)
                    ->first();

                if ($order && $order->status !== 'completed') {
                    DB::transaction(function () use ($order, $response) {
                        // Paid goods leave the shelf. The cash-on-delivery path
                        // has always done this; PayPal orders never did, so a
                        // one-off item could be sold repeatedly.
                        foreach ($order->items as $line) {
                            $taken = Product::where('id', $line->product_id)
                                ->where('stock', '>=', $line->quantity)
                                ->decrement('stock', $line->quantity);

                            // Money has already changed hands, so this is not a
                            // reason to refuse the order — but somebody has paid
                            // for something that is not on the shelf, and that
                            // has to reach a human rather than pass silently.
                            if ($taken === 0) {
                                Log::warning('Oversold: paid order exceeds stock', [
                                    'order_id' => $order->id,
                                    'product_id' => $line->product_id,
                                    'quantity' => $line->quantity,
                                ]);
                            }
                        }

                        $order->update([
                            'status' => 'completed',
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
