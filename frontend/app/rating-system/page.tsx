import { Metadata } from "next";
import RatingSystemClient from "./RatingSystemClient";

export const metadata: Metadata = {
    title: "Rating System",
    description: "How TechPlay rates games and hardware — our scoring criteria explained.",
};

export default function RatingSystemPage() {
    return <RatingSystemClient />;
}
