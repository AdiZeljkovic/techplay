
import HardwareClient from "./HardwareClient";
import { Metadata } from "next";

// Revalidate every 10 minutes
export const revalidate = 600;

export const metadata: Metadata = {
    title: "Hardware Lab",
    description: "Benchmark-driven reviews. Thermals. Raw performance numbers.",
};

export default function HardwarePage() {
    return <HardwareClient />;
}
