<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * P4 unit six: the shop.
 *
 * Ordering takes stock off the shelf, which is right. Nothing ever put it back,
 * and the stock check was a read followed by a write rather than one operation.
 */
class ShopOrderTest extends TestCase
{
    use RefreshDatabase;

    private function product(int $stock = 3): Product
    {
        return Product::create([
            'name' => 'TechPlay Mug',
            'slug' => 'techplay-mug',
            'description' => 'Holds coffee.',
            'price' => 25.00,
            'stock' => $stock,
            'is_active' => true,
        ]);
    }

    private function order(User $user, Product $product, int $qty = 1)
    {
        return $this->actingAs($user)->postJson('/api/v1/shop/orders/cod', [
            'items' => [['product_id' => $product->id, 'quantity' => $qty]],
            'shipping_address' => 'Neka ulica 1, Sarajevo',
            'payment_method' => 'cod',
        ]);
    }

    public function test_an_order_takes_the_units_off_the_shelf(): void
    {
        $user = User::factory()->create();
        $product = $this->product(3);

        $this->order($user, $product, 2)->assertSuccessful();

        $this->assertSame(1, (int) $product->fresh()->stock);
    }

    public function test_stock_cannot_go_negative(): void
    {
        $user = User::factory()->create();
        $product = $this->product(1);

        $this->order($user, $product, 1)->assertSuccessful();

        // The decrement is the check now, so the second order finds nothing
        // left rather than reading a stale number and pushing the column below
        // zero.
        $this->order($user, $product, 1)->assertStatus(400);

        $this->assertSame(0, (int) $product->fresh()->stock);
    }

    public function test_cancelling_an_order_puts_the_stock_back(): void
    {
        $user = User::factory()->create();
        $product = $this->product(3);

        $this->order($user, $product, 2)->assertSuccessful();
        $this->assertSame(1, (int) $product->fresh()->stock);

        // Cancelling used to change a status string and nothing else, so the
        // units stayed gone and the product read "out of stock" for good.
        $order = Order::where('user_id', $user->id)->firstOrFail();
        $order->update(['status' => 'cancelled']);

        $this->assertSame(3, (int) $product->fresh()->stock);
    }

    public function test_stock_comes_back_once_however_often_the_status_is_flipped(): void
    {
        $user = User::factory()->create();
        $product = $this->product(3);

        $this->order($user, $product, 2)->assertSuccessful();

        $order = Order::where('user_id', $user->id)->firstOrFail();
        $order->update(['status' => 'cancelled']);
        $order->update(['status' => 'pending']);
        $order->update(['status' => 'cancelled']);
        $order->update(['status' => 'refunded']);

        $this->assertSame(3, (int) $product->fresh()->stock, 'the units are returned once, not per flip');
    }

    public function test_an_order_is_written_with_the_same_status_vocabulary_everywhere(): void
    {
        $user = User::factory()->create();
        $product = $this->product(2);

        $this->order($user, $product, 1)->assertSuccessful();

        // PayPal used to write PayPal's words — PENDING, COMPLETED — into the
        // same column the admin panel filters on in lowercase.
        $status = (string) Order::where('user_id', $user->id)->value('status');

        $this->assertSame(strtolower($status), $status);
        $this->assertContains($status, ['pending', 'processing', 'completed', 'cancelled', 'refunded']);
    }
}
