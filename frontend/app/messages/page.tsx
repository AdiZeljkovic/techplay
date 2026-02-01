import { Metadata } from "next";
import MessagesClient from "./MessagesClient";

export const metadata: Metadata = {
    title: "Messages",
    description: "Your private messages",
    robots: { index: false, follow: false },
};

export default function MessagesPage() {
    return <MessagesClient />;
}
