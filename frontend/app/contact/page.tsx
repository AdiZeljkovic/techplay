import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import ContactClient from "./ContactClient";

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata('/contact', {
        title: "Contact Us",
        description: "Got a tip, found a bug, or want to work with us? Get in touch with the TechPlay team.",
    });
}

export default function ContactPage() {
    return <ContactClient />;
}
