import { Metadata } from "next";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
    title: "Checkout",
    description: "Complete your purchase",
    robots: { index: false, follow: false },
};

export default function CheckoutPage() {
    return <CheckoutClient />;
}
