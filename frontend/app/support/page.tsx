import { Metadata } from "next";
import SupportClient from "./SupportClient";

export const metadata: Metadata = {
    title: "Support TechPlay",
    description: "Help keep TechPlay independent. Support us and get exclusive perks.",
};

export default function SupportPage() {
    return <SupportClient />;
}
