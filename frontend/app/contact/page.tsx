import { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
    title: "Contact Us",
    description: "Got a tip, found a bug, or want to work with us? Get in touch with the TechPlay team.",
};

export default function ContactPage() {
    return <ContactClient />;
}
