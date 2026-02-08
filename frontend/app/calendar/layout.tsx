import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Release Calendar",
    description: "Track upcoming game releases, launch dates, and major gaming events. Stay ahead with TechPlay's comprehensive release calendar.",
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
    return children;
}
