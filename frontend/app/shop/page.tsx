
import ShopClient from "./ShopClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Shop - TechPlay",
    description: "Official merchandise, premium gaming gear, and exclusive hardware accessories.",
};

export default function ShopPage() {
    return <ShopClient />;
}
