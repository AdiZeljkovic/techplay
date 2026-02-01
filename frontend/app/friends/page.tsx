import { Metadata } from "next";
import FriendsClient from "./FriendsClient";

export const metadata: Metadata = {
    title: "Friends",
    description: "Your friends list",
    robots: { index: false, follow: false },
};

export default function FriendsPage() {
    return <FriendsClient />;
}
