import { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
    title: "About Us",
    description: "Built by gamers, for gamers. Learn about TechPlay — honest gaming and tech coverage since 2020.",
};

export default function AboutPage() {
    return <AboutClient />;
}
