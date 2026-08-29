import type { Metadata } from "next";
import ProductClient from "./ProductClient";
import { getServerApiUrl, serverHeaders } from "@/lib/api";
import { ROBOTS_INDEX, ROBOTS_NOINDEX } from "@/lib/seo";
import { getStorageUrl } from "@/lib/imageUrl";

/**
 * A product page that search engines and chat apps can read.
 *
 * This route was a single `"use client"` file with no layout beside it, and a
 * client component cannot export metadata — so every product served the root
 * layout's default title and no card at all. Shared in a Discord message or a
 * tweet, a product link showed the site's generic description; in a search
 * result it showed "TechPlay". It was the only detail page on the site without
 * its own metadata, and it was the one on the page people are asked to buy
 * from.
 *
 * Same shape as every other detail route here: a server page that fetches for
 * the head, and the interactive half beside it in ProductClient. The client
 * still does its own fetch through SWR — the cart needs live stock — so this
 * one is for the head only.
 */

export const revalidate = 900;

type Props = { params: Promise<{ slug: string }> };

type Product = {
    name?: string;
    description?: string;
    price?: number | string;
    image_url?: string;
    stock?: number;
};

async function getProduct(slug: string): Promise<Product | null> {
    try {
        const res = await fetch(`${getServerApiUrl()}/shop/products/${slug}`, {
            next: { revalidate: 900, tags: ["shop", `product-${slug}`] },
            headers: serverHeaders(),
        });

        if (!res.ok) {
            return null;
        }

        const json = await res.json();

        return json?.data ?? json ?? null;
    } catch {
        // The head is not worth a 500. The page still renders; it just goes out
        // with the fallback title rather than the product's.
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const product = await getProduct(slug);

    if (!product?.name) {
        return { title: "Product Not Found", robots: ROBOTS_NOINDEX };
    }

    const title = `${product.name} — TechPlay Shop`;
    const description = (product.description ?? "")
        .replace(/<[^>]+>/g, "")
        .trim()
        .slice(0, 160) || `${product.name}, from the TechPlay shop.`;

    const absoluteImage = product.image_url ? getStorageUrl(product.image_url) : undefined;

    return {
        title,
        description,
        robots: ROBOTS_INDEX,
        alternates: { canonical: `/shop/${slug}` },
        openGraph: {
            title,
            description,
            type: "website",
            url: `https://techplay.gg/shop/${slug}`,
            siteName: "TechPlay",
            images: absoluteImage ? [{ url: absoluteImage, alt: product.name }] : undefined,
        },
        twitter: {
            card: absoluteImage ? "summary_large_image" : "summary",
            title,
            description,
            images: absoluteImage ? [absoluteImage] : undefined,
        },
    };
}

export default function ProductPage() {
    return <ProductClient />;
}
