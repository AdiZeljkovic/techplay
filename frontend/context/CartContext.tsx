"use client";

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

interface Product {
    id: number;
    name: string;
    slug: string;
    /** Laravel's decimal cast serialises as a string, so this arrives as "49.99". */
    price: number | string;
    image_url?: string;
    stock?: number;
}

interface CartItem extends Product {
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    totalPrice: number;
    itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'techplay_cart';

/** Prices cross the wire as strings; everything downstream wants a number. */
export const priceOf = (p: Product | CartItem) => Number(p.price) || 0;

/** A stored cart is untrusted input: it survives upgrades, extensions and half-writes. */
function readStoredCart(): CartItem[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(
            (i): i is CartItem =>
                !!i && typeof i === 'object' &&
                typeof i.id === 'number' &&
                typeof i.name === 'string' &&
                Number.isFinite(Number(i.price)) &&
                Number.isFinite(Number(i.quantity)) && Number(i.quantity) > 0
        );
    } catch {
        // A corrupt value used to throw inside the provider that wraps the whole
        // application, which meant one bad localStorage entry took the site down
        // for that visitor on every page load until they cleared site data.
        localStorage.removeItem(STORAGE_KEY);
        return [];
    }
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    useEffect(() => {
        setItems(readStoredCart());
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            // storage full or blocked — the cart simply does not persist
        }
    }, [items]);

    const capacity = (product: Product, wanted: number) =>
        typeof product.stock === 'number' && product.stock > 0
            ? Math.min(wanted, product.stock)
            : wanted;

    const addToCart = (product: Product) => {
        setItems(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: capacity(item, item.quantity + 1) }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: number) => {
        setItems(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: number, quantity: number) => {
        if (quantity < 1) return;
        setItems(prev => prev.map(item =>
            item.id === productId ? { ...item, quantity: capacity(item, quantity) } : item
        ));
    };

    const clearCart = () => setItems([]);

    // PERF: Memoize calculations to prevent re-computation on every render
    const totalPrice = useMemo(() => items.reduce((sum, item) => sum + priceOf(item) * item.quantity, 0), [items]);
    const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalPrice, itemCount }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
