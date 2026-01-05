
import HardwareClient from "./HardwareClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Hardware Lab",
    description: "Benchmark-driven reviews. Thermals. Raw performance numbers.",
};

export default function HardwarePage() {
    return <HardwareClient />;
}
