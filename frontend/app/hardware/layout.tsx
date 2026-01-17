import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Hardware Lab - GPU, CPU & PC Component Reviews",
    description: "Benchmark-driven hardware reviews with thermal testing, FPS comparisons, and raw performance numbers. Find the best graphics cards, processors, and PC components for your budget.",
    keywords: ["hardware reviews", "GPU benchmarks", "CPU reviews", "graphics card reviews", "PC component reviews", "gaming PC parts", "RTX benchmarks", "AMD vs Intel", "best gaming GPU"],
    openGraph: {
        title: "Hardware Lab - PC Component Reviews & Benchmarks",
        description: "In-depth hardware analysis with real-world gaming benchmarks, thermal tests, and value comparisons.",
        type: "website",
    },
    alternates: {
        canonical: "/hardware",
    },
};

export default function HardwareLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
