"use client";

import { useEffect } from 'react';
import { getEcho } from '@/lib/echo';

interface ProductStockUpdate {
    id: number;
    slug: string;
    stock: number;
    is_available: boolean;
}

/**
 * Hook for real-time shop product stock updates.
 * @param onStockUpdate - Callback when stock is updated
 */
export function useRealTimeShop(onStockUpdate?: (data: ProductStockUpdate) => void) {
    useEffect(() => {
        const echo = getEcho();
        if (!echo) return;

        const channel = echo.channel('shop');

        channel.listen('.product.stock.updated', (data: ProductStockUpdate) => {
            console.log('📦 Stock updated:', data.slug, '->', data.stock);

            if (onStockUpdate) {
                onStockUpdate(data);
            }
        });

        return () => {
            echo.leaveChannel('shop');
        };
    }, [onStockUpdate]);
}
