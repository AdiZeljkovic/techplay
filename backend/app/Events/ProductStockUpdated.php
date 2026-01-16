<?php

namespace App\Events;

use App\Models\Product;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProductStockUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Product $product;

    public function __construct(Product $product)
    {
        $this->product = $product;
    }

    /**
     * Broadcast on public shop channel.
     */
    public function broadcastOn(): Channel
    {
        return new Channel('shop');
    }

    public function broadcastAs(): string
    {
        return 'product.stock.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->product->id,
            'slug' => $this->product->slug,
            'stock' => $this->product->stock,
            'is_available' => $this->product->stock > 0,
        ];
    }
}
