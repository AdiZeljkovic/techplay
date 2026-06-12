import { Metadata } from "next";
import CalendarClient from "./CalendarClient";

export const metadata: Metadata = {
    title: "Game Release Calendar - TechPlay",
    description: "Every game launch in one place. Browse upcoming and past game releases by month and platform — PC, PlayStation, Xbox and Nintendo.",
};

export default function CalendarPage() {
    return <CalendarClient />;
}
