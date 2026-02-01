import { Metadata } from "next";
import CartClient from "./CartClient";

export const metadata: Metadata = {
    title: "Shopping Cart",
    description: "Your TechPlay shopping cart",
    robots: { index: false, follow: false },
};

export default function CartPage() {
    return <CartClient />;
}
