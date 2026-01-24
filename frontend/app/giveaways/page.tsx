import { Metadata } from "next";
import GiveawaysClient from "./GiveawaysClient";

export const metadata: Metadata = {
    title: "Giveaways - TechPlay",
    description: "Browse active and past giveaways. Enter to win amazing gaming prizes!",
    openGraph: {
        title: "TechPlay Giveaways",
        description: "Win amazing gaming prizes - enter our giveaways now!",
    },
};

export default function GiveawaysPage() {
    return <GiveawaysClient />;
}
